package com.lms.www.leadmanagement.controller;

import com.lms.www.leadmanagement.dto.ApiResponse;
import com.lms.www.leadmanagement.dto.AttendanceDTO;
import com.lms.www.leadmanagement.dto.AttendancePolicyDTO;
import com.lms.www.leadmanagement.dto.OfficeLocationDTO;
import com.lms.www.leadmanagement.entity.AttendancePolicy;
import com.lms.www.leadmanagement.entity.AttendanceShift;
import com.lms.www.leadmanagement.entity.OfficeLocation;
import com.lms.www.leadmanagement.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/attendance")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TEAM_LEADER')")
public class AdminAttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping("/summaries")
    public ResponseEntity<ApiResponse<List<AttendanceDTO>>> getDailySummaries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getDailySummaries(date, userId)));
    }

    @GetMapping("/offices")
    public ResponseEntity<ApiResponse<List<OfficeLocationDTO>>> getAllOffices() {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAllOffices()));
    }

    @PostMapping("/offices")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OfficeLocation>> createOffice(@Valid @RequestBody OfficeLocation office) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.createOffice(office)));
    }

    @DeleteMapping("/offices/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteOffice(@PathVariable Long id) {
        attendanceService.deleteOffice(id);
        return ResponseEntity.ok(ApiResponse.success("Office deleted"));
    }

    @GetMapping("/policies")
    public ResponseEntity<ApiResponse<List<AttendancePolicyDTO>>> getAllPolicies() {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAllPolicies()));
    }

    @PostMapping("/policies")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AttendancePolicy>> createPolicy(@Valid @RequestBody AttendancePolicyDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.createPolicy(dto)));
    }

    @PutMapping("/policies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AttendancePolicy>> updatePolicy(@PathVariable Long id, @Valid @RequestBody AttendancePolicyDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.updatePolicy(id, dto)));
    }

    @DeleteMapping("/policies/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePolicy(@PathVariable Long id) {
        attendanceService.deletePolicy(id);
        return ResponseEntity.ok(ApiResponse.success("Policy deleted"));
    }

    @GetMapping("/shifts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceShift>>> getAllShifts() {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getAllShifts()));
    }

    @PostMapping("/shifts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceShift>> createShift(@Valid @RequestBody AttendanceShift shift) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.createShift(shift)));
    }

    @DeleteMapping("/shifts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteShift(@PathVariable Long id) {
        attendanceService.deleteShift(id);
        return ResponseEntity.ok(ApiResponse.success("Shift deleted"));
    }
}
