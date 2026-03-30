package com.lms.www.leadmanagement.controller;

import com.lms.www.leadmanagement.dto.LeadDTO;
import com.lms.www.leadmanagement.dto.PaymentDTO;
import com.lms.www.leadmanagement.dto.RoleDTO;
import com.lms.www.leadmanagement.dto.UserDTO;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.service.AdminService;
import com.lms.www.leadmanagement.service.LeadPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private LeadPaymentService leadPaymentService;

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @PostMapping("/manager")
    public ResponseEntity<UserDTO> createManager(@RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(adminService.createManager(userDTO));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/roles")
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        return ResponseEntity.ok(adminService.getAllRoles());
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @PostMapping("/users")
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(adminService.createUser(userDTO));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @PutMapping("/users/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(adminService.updateUser(id, userDTO));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @PostMapping("/roles")
    public ResponseEntity<RoleDTO> createRole(@RequestBody RoleDTO roleDTO) {
        return ResponseEntity.ok(adminService.createRole(roleDTO));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/permissions")
    public ResponseEntity<java.util.List<String>> getAllPermissions() {
        return ResponseEntity.ok(adminService.getAllPermissions());
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/users")
    public ResponseEntity<Page<UserDTO>> getAllUsers(@PageableDefault(size = 20) Pageable pageable) {
        System.out.println("API CALL: GET /api/admin/users?page=" + pageable.getPageNumber());
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/leads")
    public ResponseEntity<Page<LeadDTO>> getAllLeads(@PageableDefault(size = 20) Pageable pageable) {
        System.out.println("API CALL: GET /api/admin/leads?page=" + pageable.getPageNumber());
        return ResponseEntity.ok(adminService.getAllLeads(pageable));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getLeadStats() {
        System.out.println("API CALL: GET /api/admin/stats");
        return ResponseEntity.ok(adminService.getLeadStats());
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @RequestParam(value = "start", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime start,
            @RequestParam(value = "end", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime end,
            @RequestParam(value = "userId", required = false) Long userId) {
        User requester = adminService.getCurrentUser();
        return ResponseEntity.ok(adminService.getDashboardStats(start, end, requester, userId));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/reports/member-performance")
    public ResponseEntity<List<Map<String, Object>>> getMemberPerformance(
            @RequestParam(value = "start", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime start,
            @RequestParam(value = "end", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime end) {
        User requester = adminService.getCurrentUser();
        return ResponseEntity.ok(adminService.getMemberPerformanceFiltered(start, end, requester));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/payments/history")
    public ResponseEntity<List<PaymentDTO>> getPaymentHistory(
            @RequestParam(value = "tlId", required = false) Long tlId,
            @RequestParam(value = "associateId", required = false) Long associateId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(value = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate) {
        return ResponseEntity.ok(leadPaymentService.getFilteredPaymentHistory(tlId, associateId, startDate, endDate, status));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/payments/invoice/{leadId}")
    public ResponseEntity<PaymentDTO> getInvoice(@PathVariable Long leadId) {
        return ResponseEntity.ok(leadPaymentService.generateInvoice(leadId));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/team-leaders")
    public ResponseEntity<List<UserDTO>> getTeamLeaders() {
        return ResponseEntity.ok(leadPaymentService.getTeamLeaders());
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/associates/{tlId}")
    public ResponseEntity<List<UserDTO>> getAssociates(@PathVariable Long tlId) {
        return ResponseEntity.ok(adminService.getAssociatesByTl(tlId));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/test")
    public ResponseEntity<String> testAdmin() {
        return ResponseEntity.ok("Admin Connectivity OK");
    }
}
