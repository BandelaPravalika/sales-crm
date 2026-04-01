package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.AttendanceDTO;
import com.lms.www.leadmanagement.dto.AttendancePolicyDTO;
import com.lms.www.leadmanagement.dto.LocationRequestDTO;
import com.lms.www.leadmanagement.dto.OfficeLocationDTO;
import com.lms.www.leadmanagement.entity.*;
import com.lms.www.leadmanagement.exception.ResourceNotFoundException;
import com.lms.www.leadmanagement.mapper.AttendanceMapper;
import com.lms.www.leadmanagement.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AttendanceService {

    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;
    @Autowired
    private AttendanceDailyRepository attendanceDailyRepository;
    @Autowired
    private OfficeLocationRepository officeLocationRepository;
    @Autowired
    private AttendancePolicyRepository attendancePolicyRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AttendanceMapper attendanceMapper;

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");
    private static final double MAX_SPEED_KMPH = 150.0;

    // Default Policy Values
    private static final int DEFAULT_TRACKING_INTERVAL = 300;
    private static final int DEFAULT_GRACE_PERIOD = 2;
    private static final double DEFAULT_OFFICE_RADIUS = 200.0;
    private static final LocalTime DEFAULT_SHORT_BREAK_START = LocalTime.of(17, 0);
    private static final LocalTime DEFAULT_SHORT_BREAK_END = LocalTime.of(17, 10);
    private static final LocalTime DEFAULT_LONG_BREAK_START = LocalTime.of(13, 0);
    private static final LocalTime DEFAULT_LONG_BREAK_END = LocalTime.of(14, 0);

    private LocalDateTime nowInIndia() {
        return LocalDateTime.now(INDIA_ZONE);
    }

    private LocalDate todayInIndia() {
        return LocalDate.now(INDIA_ZONE);
    }

    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private Optional<OfficeLocation> findNearestOffice(double lat, double lng) {
        return officeLocationRepository.findAll().stream()
                .min((o1, o2) -> Double.compare(
                        calculateDistance(lat, lng, o1.getLatitude(), o1.getLongitude()),
                        calculateDistance(lat, lng, o2.getLatitude(), o2.getLongitude())));
    }

    private String getIpHash(String ip) {
        return String.valueOf(ip != null ? ip.hashCode() : 0);
    }

    @Transactional
    public AttendanceDTO clockIn(LocationRequestDTO request, String ua, String ip) {
        Long userId = request.getUserId();

        attendanceSessionRepository.findByUserIdAndStatusIn(userId,
                List.of(AttendanceStatus.WORKING, AttendanceStatus.ON_SHORT_BREAK, AttendanceStatus.ON_LONG_BREAK,
                        AttendanceStatus.AUTO_BREAK))
                .ifPresent(this::finalizeSession);

        OfficeLocation office = findNearestOffice(request.getLat(), request.getLng())
                .orElseThrow(() -> new RuntimeException("No office locations defined. Admin must setup a branch first."));

        if (calculateDistance(request.getLat(), request.getLng(), office.getLatitude(), office.getLongitude()) > office
                .getRadius()) {
            throw new RuntimeException("Outside office zone. Move closer to " + office.getName());
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        AttendanceSession session = AttendanceSession.builder()
                .user(user).office(office).checkInTime(nowInIndia()).status(AttendanceStatus.WORKING)
                .lastLat(request.getLat()).lastLng(request.getLng())
                .lastAccuracy(request.getAccuracy() != null ? request.getAccuracy() : 0.0)
                .lastLocationTime(nowInIndia()).lastSeenTime(nowInIndia())
                .deviceId(request.getDeviceId() != null ? request.getDeviceId() : "WEB_BROWSER")
                .userAgent(ua).ipHash(getIpHash(ip))
                .totalWorkMinutes(0).totalBreakMinutes(0).isAutoCheckout(false)
                .build();

        return convertToDTO(attendanceSessionRepository.save(session));
    }

    @Transactional
    public AttendanceDTO trackLocation(LocationRequestDTO request, String ua, String ip) {
        Long userId = request.getUserId();
        try {
            AttendanceSession session = attendanceSessionRepository.findActiveForUpdate(userId,
                    List.of(AttendanceStatus.WORKING, AttendanceStatus.ON_SHORT_BREAK, AttendanceStatus.ON_LONG_BREAK,
                            AttendanceStatus.AUTO_BREAK))
                    .orElseThrow(
                            () -> new ResourceNotFoundException("No active session found. Please Clock In again."));

            if (session.getOffice() == null) {
                log.error("Fatal error: active attendance session #{} has no office node", session.getId());
                finalizeSession(session);
                throw new RuntimeException("Operational integrity violation: missing office link. Please Clock In again.");
            }

            AttendancePolicy policy = attendancePolicyRepository.findByOfficeId(session.getOffice().getId())
                    .orElseGet(() -> AttendancePolicy.builder().office(session.getOffice()).build());

            LocalDateTime now = nowInIndia();

            validateSecurity(session, request, ip);
            performVelocityCheck(session, request, now);

            // Throttling
            long secondsSinceLast = Duration.between(session.getLastLocationTime(), now).getSeconds();
            int interval = policy.getTrackingIntervalSec() != null ? policy.getTrackingIntervalSec()
                    : DEFAULT_TRACKING_INTERVAL;
            if (secondsSinceLast < (interval / 2)) {
                return convertToDTO(session);
            }

            // Stale Session Check
            int maxIdle = policy.getMaxIdleMinutes() != null ? policy.getMaxIdleMinutes() : 30;
            if (Duration.between(session.getLastSeenTime(), now).toMinutes() > maxIdle) {
                finalizeSession(session);
                throw new RuntimeException("Session timed out. Please Clock In again.");
            }

            handleGeofenceAndWorkStatus(session, request, policy, now);

            session.setLastLat(request.getLat());
            session.setLastLng(request.getLng());
            session.setLastAccuracy(request.getAccuracy() != null ? request.getAccuracy() : session.getLastAccuracy());
            session.setLastLocationTime(now);

            return convertToDTO(attendanceSessionRepository.save(session));
        } catch (PessimisticLockingFailureException e) {
            throw new RuntimeException("System busy. Try again.");
        }
    }

    private void validateSecurity(AttendanceSession session, LocationRequestDTO request, String ip) {
        // If device ID is provided by client, it must match. If null, we skip this check for web-based tracking resilience.
        if (request.getDeviceId() != null && !request.getDeviceId().equals(session.getDeviceId())) {
            throw new RuntimeException("Security violation: Device mismatch.");
        }
        
        if (!session.getIpHash().equals(getIpHash(ip))) {
            throw new RuntimeException("Security violation: Network change detected.");
        }
    }

    private void performVelocityCheck(AttendanceSession session, LocationRequestDTO request, LocalDateTime now) {
        if (session.getLastLat() != null && session.getLastLng() != null && session.getLastLocationTime() != null) {
            double metersMoved = calculateDistance(session.getLastLat(), session.getLastLng(), request.getLat(),
                    request.getLng());
            long secondsElapsed = Duration.between(session.getLastLocationTime(), now).toSeconds();

            if (secondsElapsed > 5) {
                double kmph = (metersMoved / 1000.0) / (secondsElapsed / 3600.0);
                if (kmph > MAX_SPEED_KMPH) {
                    log.warn("Suspicious movement (Fake GPS?) detected for user {}: {} km/h", session.getUser().getId(),
                            kmph);
                    throw new RuntimeException("Suspicious activity detected. Location rejected.");
                }
            }
        }
    }

    private void handleGeofenceAndWorkStatus(AttendanceSession session, LocationRequestDTO request,
            AttendancePolicy policy, LocalDateTime now) {
        double distance = calculateDistance(request.getLat(), request.getLng(),
                session.getOffice().getLatitude(), session.getOffice().getLongitude());
        boolean isInside = distance <= session.getOffice().getRadius();

        long deltaMins = Duration.between(session.getLastSeenTime(), now).toMinutes();
        LocalTime currentTime = now.toLocalTime();

        if (isInside) {
            if (session.getStatus() == AttendanceStatus.WORKING) {
                session.setTotalWorkMinutes(session.getTotalWorkMinutes() + (int) deltaMins);
            }
            session.setStatus(AttendanceStatus.WORKING);
            session.setLastSeenTime(now);
            session.setOutsideStartTime(null);
        } else {
            handleOutsideOffice(session, policy, now, currentTime, deltaMins);
        }
    }

    private void handleOutsideOffice(AttendanceSession session, AttendancePolicy policy, LocalDateTime now,
            LocalTime currentTime, long deltaMins) {
        boolean inShortBreak = isWithinBreak(currentTime, policy.getShortBreakStartTime(),
                policy.getShortBreakEndTime(), DEFAULT_SHORT_BREAK_START, DEFAULT_SHORT_BREAK_END);
        boolean inLongBreak = isWithinBreak(currentTime, policy.getLongBreakStartTime(), policy.getLongBreakEndTime(),
                DEFAULT_LONG_BREAK_START, DEFAULT_LONG_BREAK_END);

        if (inShortBreak || inLongBreak) {
            session.setTotalBreakMinutes(session.getTotalBreakMinutes() + (int) deltaMins);
            session.setStatus(inLongBreak ? AttendanceStatus.ON_LONG_BREAK : AttendanceStatus.ON_SHORT_BREAK);
            session.setOutsideStartTime(null);
        } else {
            handleUnauthorizedExit(session, policy, now);
        }
        session.setLastSeenTime(now);
    }

    private boolean isWithinBreak(LocalTime current, LocalTime policyStart, LocalTime policyEnd, LocalTime defaultStart,
            LocalTime defaultEnd) {
        LocalTime start = policyStart != null ? policyStart : defaultStart;
        LocalTime end = policyEnd != null ? policyEnd : defaultEnd;
        return !current.isBefore(start) && !current.isAfter(end);
    }

    private void handleUnauthorizedExit(AttendanceSession session, AttendancePolicy policy, LocalDateTime now) {
        if (session.getOutsideStartTime() == null) {
            session.setOutsideStartTime(now);
            session.setOutsideCount((session.getOutsideCount() != null ? session.getOutsideCount() : 0) + 1);
        }

        long outsideDuration = Duration.between(session.getOutsideStartTime(), now).toMinutes();
        int gracePeriod = policy.getGracePeriodMinutes() != null ? policy.getGracePeriodMinutes()
                : DEFAULT_GRACE_PERIOD;

        if (outsideDuration >= gracePeriod) {
            finalizeSession(session);
            throw new RuntimeException(
                    "Auto punch-out: Unauthorized exit exceeded " + gracePeriod + " min grace period.");
        }
        session.setStatus(AttendanceStatus.ON_SHORT_BREAK);
    }

    @Transactional
    public List<OfficeLocationDTO> getAllOffices() {
        return officeLocationRepository.findAll().stream()
                .map(attendanceMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OfficeLocation createOffice(OfficeLocation office) {
        return officeLocationRepository.save(office);
    }

    @Transactional
    public void deleteOffice(Long id) {
        if (!officeLocationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Office not found");
        }
        officeLocationRepository.deleteById(id);
    }

    @Transactional
    public List<AttendancePolicyDTO> getAllPolicies() {
        return attendancePolicyRepository.findAll().stream()
                .map(attendanceMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AttendancePolicy createPolicy(AttendancePolicyDTO dto) {
        OfficeLocation office = officeLocationRepository.findById(dto.getOfficeId())
                .orElseThrow(() -> new ResourceNotFoundException("Office not found"));

        AttendancePolicy policy = AttendancePolicy.builder()
                .office(office)
                .shortBreakStartTime(
                        dto.getShortBreakStartTime() != null ? LocalTime.parse(dto.getShortBreakStartTime())
                                : DEFAULT_SHORT_BREAK_START)
                .shortBreakEndTime(dto.getShortBreakEndTime() != null ? LocalTime.parse(dto.getShortBreakEndTime())
                        : DEFAULT_SHORT_BREAK_END)
                .longBreakStartTime(dto.getLongBreakStartTime() != null ? LocalTime.parse(dto.getLongBreakStartTime())
                        : DEFAULT_LONG_BREAK_START)
                .longBreakEndTime(dto.getLongBreakEndTime() != null ? LocalTime.parse(dto.getLongBreakEndTime())
                        : DEFAULT_LONG_BREAK_END)
                .gracePeriodMinutes(
                        dto.getGracePeriodMinutes() != null ? dto.getGracePeriodMinutes() : DEFAULT_GRACE_PERIOD)
                .trackingIntervalSec(
                        dto.getTrackingIntervalSec() != null ? dto.getTrackingIntervalSec() : DEFAULT_TRACKING_INTERVAL)
                .maxAccuracyMeters(dto.getMaxAccuracyMeters())
                .minimumWorkMinutes(dto.getMinimumWorkMinutes())
                .maxIdleMinutes(dto.getMaxIdleMinutes())
                .build();

        return attendancePolicyRepository.save(policy);
    }

    @Transactional
    public AttendancePolicy updatePolicy(Long id, AttendancePolicyDTO dto) {
        AttendancePolicy policy = attendancePolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));

        if (dto.getShortBreakStartTime() != null)
            policy.setShortBreakStartTime(LocalTime.parse(dto.getShortBreakStartTime()));
        if (dto.getShortBreakEndTime() != null)
            policy.setShortBreakEndTime(LocalTime.parse(dto.getShortBreakEndTime()));
        if (dto.getLongBreakStartTime() != null)
            policy.setLongBreakStartTime(LocalTime.parse(dto.getLongBreakStartTime()));
        if (dto.getLongBreakEndTime() != null)
            policy.setLongBreakEndTime(LocalTime.parse(dto.getLongBreakEndTime()));
        if (dto.getGracePeriodMinutes() != null)
            policy.setGracePeriodMinutes(dto.getGracePeriodMinutes());
        if (dto.getTrackingIntervalSec() != null)
            policy.setTrackingIntervalSec(dto.getTrackingIntervalSec());
        if (dto.getMaxAccuracyMeters() != null)
            policy.setMaxAccuracyMeters(dto.getMaxAccuracyMeters());
        if (dto.getMinimumWorkMinutes() != null)
            policy.setMinimumWorkMinutes(dto.getMinimumWorkMinutes());
        if (dto.getMaxIdleMinutes() != null)
            policy.setMaxIdleMinutes(dto.getMaxIdleMinutes());

        return attendancePolicyRepository.save(policy);
    }

    @Transactional
    public void deletePolicy(Long id) {
        if (!attendancePolicyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Policy not found");
        }
        attendancePolicyRepository.deleteById(id);
    }

    @Transactional
    public List<AttendanceShift> getAllShifts() {
        return attendanceShiftRepository.findAll();
    }

    @Autowired
    private AttendanceShiftRepository attendanceShiftRepository;

    @Transactional
    public AttendanceShift createShift(AttendanceShift shift) {
        return attendanceShiftRepository.save(shift);
    }

    @Transactional
    public void deleteShift(Long id) {
        if (!attendanceShiftRepository.existsById(id)) {
            throw new ResourceNotFoundException("Shift not found");
        }
        attendanceShiftRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getDailySummaries(LocalDate date, Long userId) {
        List<AttendanceDaily> logs;
        if (date != null && userId != null) {
            logs = attendanceDailyRepository.findByUserIdAndDate(userId, date).map(List::of).orElse(List.of());
        } else if (date != null) {
            logs = attendanceDailyRepository.findByDate(date);
        } else if (userId != null) {
            logs = attendanceDailyRepository.findByUserIdOrderByDateDesc(userId);
        } else {
            logs = attendanceDailyRepository.findAll();
        }

        return logs.stream().map(log -> {
            AttendanceSession dummy = AttendanceSession.builder()
                    .user(log.getUser())
                    .checkInTime(log.getDate().atStartOfDay())
                    .status(AttendanceStatus.PUNCHED_OUT)
                    .totalWorkMinutes(log.getTotalWorkMinutes())
                    .totalBreakMinutes(log.getTotalBreakMinutes())
                    .outsideCount(log.getOutsideCount())
                    .build();
            return convertToDTO(dummy);
        }).collect(Collectors.toList());
    }

    private void finalizeSession(AttendanceSession s) {
        LocalDateTime now = nowInIndia();
        
        // Final work/break duration update before closing
        long finalMins = Duration.between(s.getLastSeenTime() != null ? s.getLastSeenTime() : s.getCheckInTime(), now).toMinutes();
        if (finalMins > 0) {
            if (s.getStatus() == AttendanceStatus.WORKING) {
                s.setTotalWorkMinutes(s.getTotalWorkMinutes() + (int) finalMins);
            } else if (s.getStatus() == AttendanceStatus.ON_SHORT_BREAK || 
                       s.getStatus() == AttendanceStatus.ON_LONG_BREAK || 
                       s.getStatus() == AttendanceStatus.AUTO_BREAK) {
                s.setTotalBreakMinutes(s.getTotalBreakMinutes() + (int) finalMins);
            }
        }

        s.setStatus(AttendanceStatus.PUNCHED_OUT);
        s.setCheckOutTime(now);
        s.setAutoCheckout(true);
        s.setLastSeenTime(now);
        attendanceSessionRepository.save(s);
        reconcileDailySummary(s.getUser().getId(), todayInIndia(), s.getOffice());
    }

    private void reconcileDailySummary(Long userId, LocalDate date, OfficeLocation office) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        AttendanceShift shift = user.getShift();
        if (shift == null) {
            AttendancePolicy policy = attendancePolicyRepository.findByOfficeId(office.getId())
                    .orElseGet(() -> AttendancePolicy.builder().office(office).build());

            List<AttendanceSession> sessions = attendanceSessionRepository.findSessionsForDate(userId,
                    date.atStartOfDay(), date.atTime(23, 59, 59));
            int totalWork = sessions.stream().mapToInt(AttendanceSession::getTotalWorkMinutes).sum();
            int totalBreak = sessions.stream().mapToInt(AttendanceSession::getTotalBreakMinutes).sum();
            int totalOutside = sessions.stream().mapToInt(s -> s.getOutsideCount() != null ? s.getOutsideCount() : 0)
                    .sum();

            AttendanceDaily daily = attendanceDailyRepository.findByUserIdAndDate(userId, date)
                    .orElse(AttendanceDaily.builder().user(user).date(date).build());
            daily.setTotalWorkMinutes(totalWork);
            daily.setTotalBreakMinutes(totalBreak);
            daily.setOutsideCount(totalOutside);
            daily.setStatus(totalWork >= (policy.getMinimumWorkMinutes() != null ? policy.getMinimumWorkMinutes() : 480)
                    ? "PRESENT"
                    : "ABSENT");
            attendanceDailyRepository.save(daily);
            return;
        }

        List<AttendanceSession> sessions = attendanceSessionRepository.findSessionsForDate(userId, date.atStartOfDay(),
                date.atTime(23, 59, 59));
        int totalWork = sessions.stream().mapToInt(AttendanceSession::getTotalWorkMinutes).sum();
        int totalBreak = sessions.stream().mapToInt(AttendanceSession::getTotalBreakMinutes).sum();
        int totalOutside = sessions.stream().mapToInt(s -> s.getOutsideCount() != null ? s.getOutsideCount() : 0).sum();

        AttendanceDaily daily = attendanceDailyRepository.findByUserIdAndDate(userId, date)
                .orElse(AttendanceDaily.builder().user(user).date(date).build());

        if (!sessions.isEmpty()) {
            LocalTime firstPunch = sessions.get(0).getCheckInTime().toLocalTime();
            daily.setLate(firstPunch.isAfter(shift.getStartTime().plusMinutes(shift.getGraceMinutes())));
        }

        if (!sessions.isEmpty()) {
            AttendanceSession lastSession = sessions.get(sessions.size() - 1);
            if (lastSession.getCheckOutTime() != null) {
                daily.setEarlyExit(lastSession.getCheckOutTime().toLocalTime().isBefore(shift.getEndTime()));
            }
        }

        if (totalWork >= shift.getMinFullDayMinutes()) {
            daily.setStatus("PRESENT");
        } else if (totalWork >= shift.getMinHalfDayMinutes()) {
            daily.setStatus("HALF_DAY");
        } else {
            daily.setStatus("ABSENT");
        }

        long totalShiftMinutes = Duration.between(shift.getStartTime(), shift.getEndTime()).toMinutes();
        daily.setOvertimeMinutes(Math.max(0, totalWork - (int) totalShiftMinutes));

        daily.setTotalWorkMinutes(totalWork);
        daily.setTotalBreakMinutes(totalBreak);
        daily.setOutsideCount(totalOutside);
        attendanceDailyRepository.save(daily);
    }

    @Transactional
    public AttendanceDTO clockOut(Long userId) {
        AttendanceSession session = attendanceSessionRepository.findActiveForUpdate(userId,
                List.of(AttendanceStatus.WORKING, AttendanceStatus.ON_SHORT_BREAK, AttendanceStatus.ON_LONG_BREAK,
                        AttendanceStatus.AUTO_BREAK))
                .orElseThrow(() -> new ResourceNotFoundException("No active session to clock out."));

        finalizeSession(session);
        session.setAutoCheckout(false);
        return convertToDTO(attendanceSessionRepository.save(session));
    }

    @Transactional
    public AttendanceDTO startBreak(Long userId, String type) {
        AttendanceSession session = attendanceSessionRepository
                .findActiveForUpdate(userId, List.of(AttendanceStatus.WORKING))
                .orElseThrow(() -> new RuntimeException("Must be in WORKING status to start a break."));

        AttendanceStatus breakStatus = "LONG".equalsIgnoreCase(type) ? AttendanceStatus.ON_LONG_BREAK
                : AttendanceStatus.ON_SHORT_BREAK;

        session.setStatus(breakStatus);
        session.setOutsideStartTime(nowInIndia());
        session.setLastSeenTime(nowInIndia());

        return convertToDTO(attendanceSessionRepository.save(session));
    }

    @Transactional
    public AttendanceDTO endBreak(Long userId) {
        AttendanceSession session = attendanceSessionRepository.findActiveForUpdate(userId,
                List.of(AttendanceStatus.ON_SHORT_BREAK, AttendanceStatus.ON_LONG_BREAK, AttendanceStatus.AUTO_BREAK))
                .orElseThrow(() -> new ResourceNotFoundException("No active break found to end."));

        LocalDateTime now = nowInIndia();
        long deltaMins = Duration.between(
                session.getOutsideStartTime() != null ? session.getOutsideStartTime() : session.getLastSeenTime(), now)
                .toMinutes();

        session.setTotalBreakMinutes(session.getTotalBreakMinutes() + (int) deltaMins);
        session.setStatus(AttendanceStatus.WORKING);
        session.setOutsideStartTime(null);
        session.setLastSeenTime(now);

        return convertToDTO(attendanceSessionRepository.save(session));
    }

    @Scheduled(fixedRate = 600000)
    @Transactional
    public void cleanupStaleSessions() {
        LocalDateTime now = nowInIndia();
        attendanceSessionRepository
                .findAllByStatusIn(List.of(AttendanceStatus.WORKING, AttendanceStatus.ON_SHORT_BREAK,
                        AttendanceStatus.ON_LONG_BREAK, AttendanceStatus.AUTO_BREAK))
                .stream()
                .forEach(s -> {
                    AttendancePolicy policy = attendancePolicyRepository.findByOfficeId(s.getOffice().getId())
                            .orElseGet(() -> AttendancePolicy.builder().office(s.getOffice()).build());
                    int maxIdle = policy.getMaxIdleMinutes() != null ? policy.getMaxIdleMinutes() : 30;
                    if (Duration.between(s.getLastSeenTime(), now).toMinutes() > maxIdle) {
                        finalizeSession(s);
                    }
                });
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void markDailyAbsenteeism() {
        LocalDate yesterday = todayInIndia().minusDays(1);
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            if ("ADMIN".equalsIgnoreCase(user.getRole().getName()))
                continue;

            Optional<AttendanceDaily> dailyOpt = attendanceDailyRepository.findByUserIdAndDate(user.getId(), yesterday);
            if (dailyOpt.isEmpty()) {
                attendanceDailyRepository.save(AttendanceDaily.builder()
                        .user(user).date(yesterday).status("ABSENT")
                        .totalWorkMinutes(0).totalBreakMinutes(0).outsideCount(0)
                        .build());
            }
        }
    }

    @Transactional(readOnly = true)
    public Optional<AttendanceDTO> getCurrentStatus(Long userId) {
        return attendanceSessionRepository.findByUserIdAndStatusIn(userId,
                List.of(AttendanceStatus.WORKING, AttendanceStatus.ON_SHORT_BREAK, AttendanceStatus.ON_LONG_BREAK,
                        AttendanceStatus.AUTO_BREAK))
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getMyLogs(Long userId) {
        return attendanceSessionRepository.findByUserIdOrderByCheckInTimeDesc(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private AttendanceDTO convertToDTO(AttendanceSession s) {
        if (s == null) return null;
        
        OfficeLocation office = s.getOffice();
        AttendancePolicy policy = office != null
                ? attendancePolicyRepository.findByOfficeId(office.getId()).orElse(null)
                : null;

        LocalDate date = s.getCheckInTime() != null ? s.getCheckInTime().toLocalDate() : todayInIndia();
        
        Long userId = (s.getUser() != null) ? s.getUser().getId() : null;
        int dayWork = 0;
        if (userId != null) {
            AttendanceDaily daily = attendanceDailyRepository.findByUserIdAndDate(userId, date).orElse(null);
            dayWork = (daily != null && daily.getTotalWorkMinutes() != null) ? daily.getTotalWorkMinutes() : 
                      (s.getTotalWorkMinutes() != null ? s.getTotalWorkMinutes() : 0);
        } else {
            dayWork = (s.getTotalWorkMinutes() != null) ? s.getTotalWorkMinutes() : 0;
        }
        
        String dayHours = String.format("%dh %dm", dayWork / 60, dayWork % 60);

        return attendanceMapper.toDTO(s, policy, dayWork, dayHours);
    }
}
