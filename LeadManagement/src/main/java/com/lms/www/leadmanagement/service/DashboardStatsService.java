package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.DashboardStatsDTO;
import com.lms.www.leadmanagement.entity.*;
import com.lms.www.leadmanagement.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class DashboardStatsService {

    @Autowired
    private AttendanceSessionRepository attendanceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private LeadTaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RevenueTargetRepository targetRepository;

    @Autowired
    private AttendanceService attendanceService;

    public DashboardStatsDTO getStats(User user, LocalDate from, LocalDate to) {
        if (user == null) return null;

        LocalDateTime start = (from != null ? from : LocalDate.now()).atStartOfDay();
        LocalDateTime end = (to != null ? to : LocalDate.now()).atTime(LocalTime.MAX);

        List<Long> targetUserIds = getTargetUserIds(user);
        if (targetUserIds.isEmpty()) {
            return DashboardStatsDTO.builder()
                .dailyRevenue(BigDecimal.ZERO).monthlyRevenue(BigDecimal.ZERO).expectedRevenue(BigDecimal.ZERO)
                .monthlyTarget(BigDecimal.ZERO).targetAchievement(0.0)
                .build();
        }
        
        // 1. Attendance
        List<AttendanceSession> sessions = attendanceRepository.findFilteredByUserIds(targetUserIds, start, end);
        long present = sessions != null ? sessions.stream().filter(s -> s.getUser() != null).map(s -> s.getUser().getId()).distinct().count() : 0;
        long late = sessions != null ? sessions.stream().filter(s -> s.isLate() && s.getUser() != null).map(s -> s.getUser().getId()).distinct().count() : 0;
        
        long totalActiveUsers = targetUserIds.size();
        long absent = Math.max(0, totalActiveUsers - present);

        // 2. Targets & Revenue
        LocalDateTime nowIndia = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        BigDecimal monthlyTarget = BigDecimal.ZERO;
        
        // If viewing global/team stats as Admin/Manager, default to the GlobalTarget goal if no specific node target is set
        monthlyTarget = targetRepository.findByUserIdAndMonthAndYear(user.getId(), nowIndia.getMonthValue(), nowIndia.getYear())
                .map(RevenueTarget::getTargetAmount)
                .orElse(user.getMonthlyTarget());
        
        if (monthlyTarget == null || monthlyTarget.compareTo(BigDecimal.ZERO) == 0) {
            // Fallback to GlobalTarget settings for high-level dashboards
            try {
                GlobalTarget gt = attendanceService.getGlobalTarget();
                if (gt != null) monthlyTarget = gt.getMonthlyRevenueGoal();
            } catch (Exception e) {
                // ignore
            }
        }
        
        if (monthlyTarget == null) monthlyTarget = BigDecimal.ZERO;

        List<Payment> payments = paymentRepository.findFilteredByUserIds(targetUserIds, start, end);
        BigDecimal daily = BigDecimal.ZERO;
        BigDecimal monthly = BigDecimal.ZERO;

        if (payments != null) {
            daily = payments.stream()
                .filter(p -> p.getStatus() == Payment.Status.PAID || p.getStatus() == Payment.Status.SUCCESS)
                .filter(p -> p.getCreatedAt().isAfter(LocalDate.now().atStartOfDay()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            monthly = payments.stream()
                .filter(p -> p.getStatus() == Payment.Status.PAID || p.getStatus() == Payment.Status.SUCCESS)
                .filter(p -> p.getCreatedAt().isAfter(LocalDate.now().withDayOfMonth(1).atStartOfDay()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // Expected Revenue is defined as Target gap (Target - Achieved) per user request
        BigDecimal expected = monthlyTarget.subtract(monthly).max(BigDecimal.ZERO);

        // 3. Follow-ups
        List<LeadTask> tasks = taskRepository.findFilteredByUserIds(targetUserIds, start, end);
        long todayFollowups = tasks != null ? tasks.stream()
                .filter(t -> t.getDueDate() != null && t.getDueDate().isAfter(LocalDate.now().atStartOfDay()) && t.getDueDate().isBefore(LocalDate.now().atTime(LocalTime.MAX)))
                .count() : 0;
        
        long pendingFollowups = tasks != null ? tasks.stream()
                .filter(t -> t.getStatus() == LeadTask.TaskStatus.PENDING && t.getDueDate() != null && t.getDueDate().isBefore(LocalDateTime.now()))
                .count() : 0;

        Double achievement = 0.0;
        if (monthlyTarget.compareTo(BigDecimal.ZERO) > 0) {
            achievement = monthly.divide(monthlyTarget, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal(100)).doubleValue();
        }

        return DashboardStatsDTO.builder()
                .presentCount(present)
                .absentCount(absent)
                .lateCount(late)
                .dailyRevenue(daily)
                .monthlyRevenue(monthly)
                .expectedRevenue(expected)
                .todayFollowups(todayFollowups)
                .pendingFollowups(pendingFollowups)
                .monthlyTarget(monthlyTarget)
                .targetAchievement(achievement)
                .build();
    }

    private List<Long> getTargetUserIds(User user) {
        if (user.getRole() != null && user.getRole().getName().equals("ADMIN")) {
            return userRepository.findAll().stream().map(User::getId).collect(Collectors.toList());
        }
        
        List<Long> ids = userRepository.findSubordinateIds(user.getId());
        List<Long> result = new java.util.ArrayList<>();
        if (ids != null) result.addAll(ids);
        result.add(user.getId()); // Include self
        return result;
    }
}
