package com.lms.www.leadmanagement.controller;

import com.lms.www.leadmanagement.dto.ApiResponse;
import com.lms.www.leadmanagement.dto.AttendanceDTO;
import com.lms.www.leadmanagement.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/attendance")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEADER')")
public class AdminAttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/summaries")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getSummaries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getDailySummaries(date, userId)));
    }

    @PostMapping("/force-clock-out/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<AttendanceDTO>> forceClockOut(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.clockOut(userId)));
    }
}
