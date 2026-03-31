package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.entity.CallRecord;
import com.lms.www.leadmanagement.entity.Lead;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.CallRecordRepository;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@Service
public class CallLogService {

    @Autowired
    private CallRecordRepository callRecordRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    private static final String UPLOAD_DIR = "uploads/recordings/";
    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    @Transactional
    public CallRecord saveCallRecord(Long userId, Long leadId, String phoneNumber, String callType,
                                     String status, String note, Integer duration,
                                     MultipartFile file) throws IOException {

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Lead lead = leadId != null ? leadRepository.findById(leadId).orElse(null) : null;

        // 1. Storage Path: {cwd}/uploads/recordings/{userId}/{date}/
        String dateStr = LocalDate.now(INDIA_ZONE).toString();
        // Use absolute base to survive server restarts
        Path baseDir = Paths.get(System.getProperty("user.dir"), UPLOAD_DIR, String.valueOf(userId), dateStr);
        Files.createDirectories(baseDir);

        // 2. Determine extension — Chrome MediaRecorder sends 'video/webm' for audio-only
        String ct = file.getContentType();
        String extension = getExtension(file.getOriginalFilename());
        if (("video/webm".equals(ct) || "audio/webm".equals(ct)) && !"webm".equalsIgnoreCase(extension)) {
            extension = "webm";
        }

        String filename = System.currentTimeMillis() + "_" + UUID.randomUUID() + "." + extension;
        Path filePath = baseDir.resolve(filename);

        // 3. Save file
        Files.copy(file.getInputStream(), filePath);

        try {
            CallRecord callRecord = CallRecord.builder()
                    .user(user)
                    .lead(lead)
                    .phoneNumber(phoneNumber)
                    .callType(callType)
                    .status(status)
                    .note(note)
                    .duration(duration)
                    .startTime(LocalDateTime.now(INDIA_ZONE).minusSeconds(duration != null ? duration : 0))
                    .endTime(LocalDateTime.now(INDIA_ZONE))
                    .recordingPath(filePath.toAbsolutePath().toString())
                    .build();

            return callRecordRepository.save(callRecord);
        } catch (Exception e) {
            Files.deleteIfExists(filePath);
            log.error("Rolling back audio file save for user {} due to DB error", userId);
            throw new RuntimeException("Failed to save record. File deleted for integrity.");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "mp3";
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    public List<CallRecord> getMyLogs(Long userId) {
        return callRecordRepository.findByUserIdOrderByStartTimeDesc(userId);
    }

    public Map<String, Object> getStats(Long userId) {
        Map<String, Object> stats = callRecordRepository.getStatsForUser(userId);
        
        // Manual calculation for conversion rate if needed, or structured map
        Map<String, Object> result = new HashMap<>(stats);
        Long total = (Long) stats.get("totalCalls");
        Long connected = (Long) stats.get("connectedCalls");
        
        if (total != null && total > 0 && connected != null) {
            double rate = (connected.doubleValue() / total.doubleValue()) * 100;
            result.put("conversionRate", Math.round(rate * 100.0) / 100.0);
        } else {
            result.put("conversionRate", 0.0);
        }
        
        return result;
    }

    public Path getAudioFile(Long recordId, Long requestingUserId, boolean isAdmin) {
        CallRecord record = callRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Record not found"));

        if (!isAdmin && !record.getUser().getId().equals(requestingUserId)) {
            throw new RuntimeException("Unauthorized access to recording");
        }

        String storedPath = record.getRecordingPath();
        // Handle both old relative paths and new absolute paths
        Path path = Paths.get(storedPath);
        if (!path.isAbsolute()) {
            path = Paths.get(System.getProperty("user.dir")).resolve(storedPath);
        }
        return path;
    }

    // --- Administrative Reporting ---

    public List<CallRecord> getAllLogsAdmin(LocalDate date, Long userId) {
        if (date != null && userId != null) {
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(23, 59, 59);
            return callRecordRepository.findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(userId, start, end);
        } else if (date != null) {
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(23, 59, 59);
            return callRecordRepository.findByStartTimeBetweenOrderByStartTimeDesc(start, end);
        } else if (userId != null) {
            return callRecordRepository.findByUserIdOrderByStartTimeDesc(userId);
        } else {
            return callRecordRepository.findAll();
        }
    }

    public Map<String, Object> getGlobalStats() {
        return callRecordRepository.getGlobalStats();
    }
}
