package com.lms.www.leadmanagement.controller;

import com.lms.www.leadmanagement.dto.BulkUploadResponseDTO;
import com.lms.www.leadmanagement.dto.LeadDTO;
import com.lms.www.leadmanagement.dto.PaymentDTO;
import com.lms.www.leadmanagement.dto.UserDTO;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.service.LeadBulkUploadService;
import com.lms.www.leadmanagement.service.LeadPaymentService;
import com.lms.www.leadmanagement.service.LeadService;
import com.lms.www.leadmanagement.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {

    @Autowired
    private ManagerService managerService;

    @Autowired
    private com.lms.www.leadmanagement.service.AdminService adminService;

    @Autowired
    private LeadService leadService;

    @Autowired
    private LeadBulkUploadService bulkUploadService;

    @Autowired
    private LeadPaymentService leadPaymentService;

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @PostMapping("/team-leader")
    public ResponseEntity<UserDTO> createTeamLeader(@RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(managerService.createTeamLeader(userDTO));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/team-leaders")
    public ResponseEntity<List<UserDTO>> getTeamLeaders() {
        return ResponseEntity.ok(managerService.getAllManagedUsers());
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/team-tree")
    public ResponseEntity<UserDTO> getTeamTree() {
        User manager = managerService.getCurrentUser();
        return ResponseEntity.ok(UserDTO.fromEntityWithTree(manager));
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    @PostMapping("/leads")
    public ResponseEntity<LeadDTO> createLead(@RequestBody LeadDTO leadDTO) {
        return ResponseEntity.ok(leadService.createLead(leadDTO));
    }

    @PreAuthorize("hasAuthority('BULK_UPLOAD')")
    @PostMapping("/leads/bulk-upload")
    public ResponseEntity<BulkUploadResponseDTO> bulkUploadLeads(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "assignedToIds", required = false) String assignedToIds) {
        return ResponseEntity.ok(bulkUploadService.uploadLeads(file, assignedToIds));
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    @GetMapping("/leads")
    public ResponseEntity<List<LeadDTO>> getAllLeads() {
        return ResponseEntity.ok(leadService.getAllLeadsForManager());
    }

    @PreAuthorize("hasAuthority('ASSIGN_TO_TL')")
    @PostMapping("/assign-lead/{leadId}/{tlId}")
    public ResponseEntity<LeadDTO> assignLead(@PathVariable Long leadId, @PathVariable Long tlId) {
        return ResponseEntity.ok(leadService.assignLead(leadId, tlId));
    }

    @PreAuthorize("hasAuthority('ASSIGN_TO_TL')")
    @PostMapping("/leads/bulk-assign")
    public ResponseEntity<List<LeadDTO>> bulkAssignLeads(@RequestBody java.util.Map<String, Object> body) {
        List<Long> leadIds = ((List<?>) body.get("leadIds")).stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
        Long tlId = Long.valueOf(body.get("tlId").toString());
        return ResponseEntity.ok(leadService.bulkAssignLeads(leadIds, tlId));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @PostMapping("/users")
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(managerService.createUser(userDTO));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @PutMapping("/users/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        return ResponseEntity.ok(managerService.updateUser(id, userDTO));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        managerService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/permissions")
    public ResponseEntity<java.util.List<String>> getAllPermissions() {
        return ResponseEntity.ok(managerService.getAllPermissions());
    }

    @GetMapping("/payments/history")
    public ResponseEntity<List<PaymentDTO>> getPaymentHistory(
            @RequestParam(value = "tlId", required = false) Long tlId,
            @RequestParam(value = "associateId", required = false) Long associateId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "startDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(value = "endDate", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate) {
        return ResponseEntity.ok(leadPaymentService.getFilteredPaymentHistory(tlId, associateId, startDate, endDate, status));
    }

    @PreAuthorize("hasAuthority('VIEW_REPORTS')")
    @GetMapping("/dashboard/stats")
    public ResponseEntity<java.util.Map<String, Object>> getDashboardStats(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "start", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime start,
            @RequestParam(value = "end", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime end) {
        User requester = managerService.getCurrentUser();
        return ResponseEntity.ok(adminService.getDashboardStats(start, end, requester, userId));
    }

    @PreAuthorize("hasAuthority('VIEW_REPORTS')")
    @GetMapping("/reports/member-performance")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getMemberPerformance(
            @RequestParam(value = "start", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime start,
            @RequestParam(value = "end", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime end) {
        User manager = managerService.getCurrentUser();
        return ResponseEntity.ok(adminService.getMemberPerformanceFiltered(start, end, manager));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @PostMapping("/users/{associateId}/assign-supervisor/{supervisorId}")
    public ResponseEntity<UserDTO> assignSupervisor(@PathVariable Long associateId, @PathVariable Long supervisorId) {
        return ResponseEntity.ok(managerService.assignToSupervisor(associateId, supervisorId));
    }

    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @GetMapping("/roles")
    public ResponseEntity<List<com.lms.www.leadmanagement.dto.RoleDTO>> getAllRoles() {
        return ResponseEntity.ok(managerService.getAllRoles());
    }
}
