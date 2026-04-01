package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.LeadDTO;
import com.lms.www.leadmanagement.dto.RoleDTO;
import com.lms.www.leadmanagement.dto.UserDTO;
import com.lms.www.leadmanagement.entity.Permission;
import com.lms.www.leadmanagement.entity.ReportScope;
import com.lms.www.leadmanagement.entity.Role;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.entity.AttendanceShift;
import com.lms.www.leadmanagement.repository.AttendanceShiftRepository;
import com.lms.www.leadmanagement.repository.PermissionRepository;
import com.lms.www.leadmanagement.repository.RoleRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.*;
import java.util.stream.Collectors;
import java.util.regex.Pattern;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Service
@Transactional
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    public User getCurrentUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()
                .getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Autowired
    private LeadRepository leadRepository;

    public List<LeadDTO> getUnassignedLeads() {
        return leadRepository.findByAssignedToIsNull().stream()
                .map(LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private MailService mailService;

    @Autowired
    private LeadService leadService;

    @Autowired
    private AttendanceShiftRepository attendanceShiftRepository;

    public List<UserDTO> getGlobalTeamTree() {
        // Find top level users (Managers/Admins with no supervisor/manager)
        List<User> roots = userRepository.findAll().stream()
                .filter(u -> (u.getManager() == null && u.getSupervisor() == null) || "ADMIN".equals(u.getRole().getName()))
                .collect(Collectors.toList());
        
        // Use a set to avoid duplicates since some Admins might have no supervisor but we still want them as roots if unassigned
        Set<User> uniqueRoots = new HashSet<>(roots);
        
        return uniqueRoots.stream()
                .map(UserDTO::fromEntityWithTree)
                .collect(Collectors.toList());
    }

    public LeadDTO assignLead(Long leadId, Long tlId) {
        return leadService.assignLead(leadId, tlId);
    }

    public List<LeadDTO> bulkAssignLeads(List<Long> leadIds, Long tlId) {
        return leadService.bulkAssignLeads(leadIds, tlId);
    }

    public UserDTO createManager(UserDTO userDTO) {
        Role managerRole = roleRepository.findByName("MANAGER")
                .orElseThrow(() -> new RuntimeException("Role MANAGER not found"));
        User user = User.builder()
                .name(userDTO.getName())
                .email(userDTO.getEmail())
                .mobile(userDTO.getMobile())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .role(managerRole)
                .build();
        return UserDTO.fromEntity(userRepository.save(user));
    }

    public List<RoleDTO> getAllRoles() {
        System.out.println("LOG: Admin/Manager fetching all roles...");
        return roleRepository.findAll().stream()
                .map(r -> RoleDTO.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .permissions(r.getPermissions() != null
                                ? r.getPermissions().stream().map(Permission::getName).collect(Collectors.toList())
                                : java.util.Collections.emptyList())
                        .build())
                .collect(Collectors.toList());
    }

    public RoleDTO createRole(RoleDTO roleDTO) {
        java.util.Set<Permission> perms = (roleDTO.getPermissions() != null)
                ? roleDTO.getPermissions().stream()
                        .map(p -> permissionRepository.findByName(p)
                                .orElseThrow(() -> new RuntimeException("Permission not found: " + p)))
                        .collect(Collectors.toSet())
                : new java.util.HashSet<>();

        Role role = roleRepository.findByName(roleDTO.getName().toUpperCase())
                .orElse(Role.builder().name(roleDTO.getName().toUpperCase()).build());

        role.setPermissions(perms);
        Role saved = roleRepository.save(role);

        return RoleDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .permissions(saved.getPermissions() != null
                        ? saved.getPermissions().stream().map(Permission::getName).collect(Collectors.toList())
                        : java.util.Collections.emptyList())
                .build();
    }

    public java.util.List<String> getAllPermissions() {
        System.out.println("LOG: Admin/Manager fetching all permissions...");
        return permissionRepository.findAll().stream()
                .map(com.lms.www.leadmanagement.entity.Permission::getName)
                .collect(Collectors.toList());
    }

    public UserDTO createUser(UserDTO userDTO) {
        // 1. Null/Empty Validation
        String email = (userDTO.getEmail() != null) ? userDTO.getEmail().trim() : "";
        String password = userDTO.getPassword();
        String name = (userDTO.getName() != null) ? userDTO.getName().trim() : "";

        if (email.isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (password == null || password.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters long");
        }
        if (name.isEmpty()) {
            throw new RuntimeException("Name is required");
        }
        
        // 2. Email Format Validation
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new RuntimeException("Invalid email format: " + email);
        }

        // 3. Email Uniqueness
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists: " + email);
        }

        Role role = roleRepository.findByName(userDTO.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found: " + userDTO.getRole()));

        // Assign default report scope based on role
        ReportScope scope = ReportScope.OWN;
        if ("ADMIN".equals(role.getName()) || "MANAGER".equals(role.getName())) {
            scope = ReportScope.ALL;
        } else if ("TEAM_LEADER".equals(role.getName())) {
            scope = ReportScope.TEAM;
        }

        User user = User.builder()
                .name(name)
                .email(email.toLowerCase())
                .mobile(userDTO.getMobile())
                .password(passwordEncoder.encode(password))
                .role(role)
                .reportScope(scope)
                .build();
        User savedUser = userRepository.save(user);
        
        // Send Credentials to Mail
        System.out.println(">>> ATTEMPTING TO SEND CREDENTIALS EMAIL TO: " + savedUser.getEmail());
        try {
            mailService.sendUserCredentials(savedUser.getEmail(), password, savedUser.getName());
            System.out.println(">>> EMAIL SENT SUCCESSFULLY TO: " + savedUser.getEmail());
        } catch (Exception e) {
            System.err.println(">>> CRITICAL ERROR: FAILED TO SEND USER CREDENTIALS EMAIL TO " + savedUser.getEmail());
            System.err.println(">>> ERROR MESSAGE: " + e.getMessage());
            e.printStackTrace();
        }

        return UserDTO.fromEntity(savedUser);
    }

    public Page<UserDTO> getAllUsers(Pageable pageable) {
        System.out.println("LOG: Admin fetching paginated users directory...");
        return userRepository.findAll(pageable)
                .map(UserDTO::fromEntity);
    }

    public Page<LeadDTO> getAllLeads(Pageable pageable) {
        System.out.println("LOG: Admin fetching paginated system leads oversight...");
        return leadRepository.findAll(pageable)
                .map(LeadDTO::fromEntity);
    }

    public java.util.Map<String, Long> getLeadStats() {
        System.out.println("LOG: Admin fetching lead statistics...");
        return leadRepository.findAll().stream()
                .filter(l -> l.getStatus() != null)
                .collect(Collectors.groupingBy(l -> l.getStatus().name(), Collectors.counting()));
    }

    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        if (userDTO.getName() != null)
            user.setName(userDTO.getName());
        if (userDTO.getMobile() != null)
            user.setMobile(userDTO.getMobile());

        if (userDTO.getRole() != null) {
            Role role = roleRepository.findByName(userDTO.getRole())
                    .orElseThrow(() -> new RuntimeException("Role not found: " + userDTO.getRole()));
            user.setRole(role);
        }

        if (userDTO.getManagerId() != null) {
            User manager = userRepository.findById(userDTO.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found"));
            user.setManager(manager);
        }

        if (userDTO.getReportScope() != null) {
            // Basic validation: Associates cannot have elevated scopes
            if ("ASSOCIATE".equals(user.getRole().getName()) &&
                    userDTO.getReportScope() != ReportScope.OWN) {
                throw new RuntimeException("Associates are restricted to OWN report scope");
            }
            user.setReportScope(userDTO.getReportScope());
        }

        if (userDTO.getSupervisorId() != null) {
            User supervisor = userRepository.findById(userDTO.getSupervisorId())
                    .orElseThrow(() -> new RuntimeException("Supervisor not found: " + userDTO.getSupervisorId()));
            user.setSupervisor(supervisor);
        } else if (userDTO.getRole() != null && "ASSOCIATE".equals(user.getRole().getName())) {
            // If it's an associate and supervisor is explicitly null, we might want to unassign
            // user.setSupervisor(null);
        }

        if (userDTO.getShiftId() != null) {
            AttendanceShift shift = attendanceShiftRepository.findById(userDTO.getShiftId())
                    .orElseThrow(() -> new RuntimeException("Shift not found: " + userDTO.getShiftId()));
            user.setShift(shift);
        } else {
            user.setShift(null);
        }

        if (userDTO.getPermissions() != null) {
            System.out.println(">>> Updating permissions for user: " + user.getEmail());
            System.out.println(">>> New Permissions Request: " + userDTO.getPermissions());

            java.util.Set<Permission> direct = new java.util.HashSet<>();
            for (String p : userDTO.getPermissions()) {
                permissionRepository.findByName(p).ifPresent(direct::add);
            }

            boolean exactMatch = false;
            if (user.getRole() != null && user.getRole().getPermissions() != null) {
                java.util.Set<String> rps = user.getRole().getPermissions().stream().map(Permission::getName)
                        .collect(Collectors.toSet());
                if (rps.size() == direct.size() && rps.containsAll(userDTO.getPermissions())) {
                    exactMatch = true;
                }
            }

            if (!exactMatch) {
                System.out.println(">>> Applying DIRECT overrides: "
                        + direct.stream().map(Permission::getName).collect(Collectors.toList()));
                user.setDirectPermissions(direct);
            } else {
                System.out.println(">>> Permissions match Role defaults, clearing direct overrides.");
                user.getDirectPermissions().clear();
            }
        }

        return UserDTO.fromEntity(userRepository.save(user));
    }

    public void deactivateUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        
        // Soft delete: toggle active state to preserve historical data
        user.setActive(!user.isActive());
        userRepository.save(user);
    }

    public Map<String, Object> getDashboardStats(LocalDateTime start, LocalDateTime end,
            User requester, Long targetUserId) {
        if (start == null) {
            start = java.time.LocalDate.now().atStartOfDay();
        }
        if (end == null) {
            end = LocalDateTime.now();
        }

        java.util.Map<String, Object> stats = new java.util.HashMap<>();

        java.util.List<User> visibleUsers = new java.util.ArrayList<>();

        // Scope-based user collection
        com.lms.www.leadmanagement.entity.ReportScope scope = requester.getReportScope();
        if (scope == null && requester.getRole() != null) {
            String roleName = requester.getRole().getName();
            if ("ADMIN".equals(roleName) || "MANAGER".equals(roleName)) {
                scope = ReportScope.ALL;
            } else if ("TEAM_LEADER".equals(roleName)) {
                scope = ReportScope.TEAM;
            } else {
                scope = ReportScope.OWN;
            }
        }
        if (scope == null)
            scope = com.lms.www.leadmanagement.entity.ReportScope.OWN;

        if (targetUserId != null) {
            User target = userRepository.findById(targetUserId).orElse(null);
            if (target != null) {
                boolean allowed = false;
                if (scope == ReportScope.ALL) {
                    allowed = true;
                } else if (scope == ReportScope.TEAM && requester != null) {
                    List<User> subs = new ArrayList<>();
                    subs.add(requester);
                    collectSubordinates(requester, subs);
                    if (subs.stream().anyMatch(u -> u.getId().equals(targetUserId))) {
                        allowed = true;
                    }
                } else if (scope == ReportScope.OWN && requester != null) {
                    if (requester.getId().equals(targetUserId)) {
                        allowed = true;
                    }
                }

                if (allowed) {
                    visibleUsers.add(target);
                } else if (requester != null) {
                    visibleUsers.add(requester);
                }
            }
        } else {
            switch (scope) {
                case OWN:
                    if (requester != null)
                        visibleUsers.add(requester);
                    break;
                case TEAM:
                    if (requester != null) {
                        visibleUsers.add(requester);
                        collectSubordinates(requester, visibleUsers);
                    }
                    break;
                case ALL:
                    visibleUsers = null; // No filter for 'ALL'
                    break;
            }
        }

        List<com.lms.www.leadmanagement.entity.Lead> leads;
        if (visibleUsers != null) {
            if (visibleUsers.isEmpty()) {
                leads = new java.util.ArrayList<>();
            } else {
                leads = leadRepository.findByCreatedAtBetweenAndAssignedToIn(start, end, visibleUsers);
            }
        } else {
            leads = leadRepository.findByCreatedAtBetween(start, end);
        }

        Map<String, Long> leadStatsMap = leads.stream()
                .filter(l -> l.getStatus() != null)
                .collect(Collectors.groupingBy(l -> l.getStatus().name(), Collectors.counting()));
        leadStatsMap.put("TOTAL", (long) leads.size());
        stats.put("leadStats", leadStatsMap);

        // New stats for calls and interest
        long callsToday = leads.stream()
                .filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.CONTACTED).count();
        long interestedToday = leads.stream()
                .filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.INTERESTED).count();
        long lostToday = leads.stream().filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.LOST
                || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.NOT_INTERESTED).count();
        long convertedToday = leads.stream()
                .filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.PAID
                        || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.CONVERTED
                        || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.EMI
                        || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.SUCCESS)
                .count();

        stats.put("callsToday", callsToday);
        stats.put("interestedToday", interestedToday);
        stats.put("lostToday", lostToday);
        stats.put("convertedToday", convertedToday);

        java.util.List<com.lms.www.leadmanagement.entity.Payment> payments;
        if (visibleUsers != null) {
            if (leads.isEmpty()) {
                payments = new java.util.ArrayList<>();
            } else {
                List<Long> leadIds = leads.stream().map(com.lms.www.leadmanagement.entity.Lead::getId)
                        .collect(Collectors.toList());
                payments = paymentRepository.findFiltered(leadIds, start, end, null);
            }
        } else {
            payments = paymentRepository.findByCreatedAtBetween(start, end);
        }

        BigDecimal totalPayments = payments.stream()
                .filter(p -> p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.PAID
                        || p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.APPROVED
                        || p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.SUCCESS)
                .map(com.lms.www.leadmanagement.entity.Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalPayments", totalPayments);

        BigDecimal pendingRevenue = payments.stream()
                .filter(p -> p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.PENDING)
                .map(com.lms.www.leadmanagement.entity.Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("pendingRevenue", pendingRevenue);

        // New stats for payment types
        long partPayments = payments.stream().filter(p -> "EMI_INSTALLMENT".equals(p.getPaymentType())).count();
        long fullPayments = payments.stream().filter(p -> "FULL".equals(p.getPaymentType())).count();

        stats.put("partPayments", partPayments);
        stats.put("fullPayments", fullPayments);
        return stats;
    }

    public java.util.List<java.util.Map<String, Object>> getMemberPerformanceFiltered(java.time.LocalDateTime start,
            java.time.LocalDateTime end, User requester) {
        if (start == null)
            start = LocalDate.now().atStartOfDay();
        if (end == null)
            end = LocalDateTime.now();

        final LocalDateTime fStart = start;
        final LocalDateTime fEnd = end;

        java.util.List<User> userList = new java.util.ArrayList<>();

        // Use identical scope logic for performance reports
        com.lms.www.leadmanagement.entity.ReportScope scope = requester.getReportScope();
        if (scope == null && requester.getRole() != null) {
            String roleName = requester.getRole().getName();
            if ("ADMIN".equals(roleName) || "MANAGER".equals(roleName)) {
                scope = ReportScope.ALL;
            } else if ("TEAM_LEADER".equals(roleName)) {
                scope = ReportScope.TEAM;
            } else {
                scope = ReportScope.OWN;
            }
        }
        if (scope == null)
            scope = com.lms.www.leadmanagement.entity.ReportScope.OWN;

        switch (scope) {
            case OWN:
                if (requester != null)
                    userList.add(requester);
                break;
            case TEAM:
                if (requester != null) {
                    userList.add(requester);
                    collectSubordinates(requester, userList);
                }
                break;
            case ALL:
                userList = userRepository.findAll();
                break;
        }

        return userList.stream()
                .filter(u -> u.getRole() != null && !"ADMIN".equals(u.getRole().getName()))
                .map(u -> {
                    java.util.Map<String, Object> uStats = new java.util.HashMap<>();
                    uStats.put("userId", u.getId());
                    uStats.put("username", u.getName());
                    uStats.put("role", u.getRole() != null ? u.getRole().getName() : "UNASSIGNED");

                    @SuppressWarnings("null")
                    java.util.List<com.lms.www.leadmanagement.entity.Lead> uLeads = leadRepository.findByAssignedTo(u);
                    long totalLeads = uLeads.size();
                    long interestedLeads = uLeads.stream()
                            .filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.INTERESTED
                                    || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.EMI
                                    || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.UNDER_REVIEW)
                            .count();
                    long convertedLeads = uLeads.stream()
                            .filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.CONVERTED
                                    || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.PAID
                                    || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.SUCCESS
                                    || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.EMI)
                            .count();
                    long lostLeads = uLeads.stream()
                            .filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.LOST
                                    || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.NOT_INTERESTED)
                            .count();
                    long callsMade = uLeads.stream()
                            .filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.CONTACTED
                                    && l.getUpdatedAt() != null
                                    && !l.getUpdatedAt().isBefore(fStart) && !l.getUpdatedAt().isAfter(fEnd))
                            .count();

                    uStats.put("totalLeads", totalLeads);
                    uStats.put("interestedLeads", interestedLeads);
                    uStats.put("convertedLeads", convertedLeads);
                    uStats.put("lostLeads", lostLeads);
                    uStats.put("callsMade", callsMade);

                    return uStats;
                })
                .collect(Collectors.toList());
    }

    private void collectSubordinates(User user, java.util.List<User> collector) {
        // Collect managerial subordinates
        if (user.getSubordinates() != null) {
            for (User sub : user.getSubordinates()) {
                if (!collector.contains(sub)) {
                    collector.add(sub);
                    collectSubordinates(sub, collector);
                }
            }
        }
        // Collect supervisory associates (Team Leader -> Associates)
        if (user.getManagedAssociates() != null) {
            for (User assoc : user.getManagedAssociates()) {
                if (!collector.contains(assoc)) {
                    collector.add(assoc);
                    collectSubordinates(assoc, collector);
                }
            }
        }
    }

    public List<UserDTO> getAssociatesByTl(Long tlId) {
        if (tlId == null) throw new IllegalArgumentException("tlId cannot be null");
        User tl = userRepository.findById(tlId)
                .orElseThrow(() -> new RuntimeException("Team Leader not found"));
        return userRepository.findBySupervisor(tl).stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
