package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.LeadDTO;
import com.lms.www.leadmanagement.dto.RoleDTO;
import com.lms.www.leadmanagement.dto.UserDTO;
import com.lms.www.leadmanagement.entity.Permission;
import com.lms.www.leadmanagement.entity.Role;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.PermissionRepository;
import com.lms.www.leadmanagement.repository.RoleRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PermissionRepository permissionRepository;

    public User getCurrentUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public UserDTO createManager(UserDTO userDTO) {
        Role managerRole = roleRepository.findByName("MANAGER").orElseThrow(() -> new RuntimeException("Role MANAGER not found"));
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
                    .map(p -> permissionRepository.findByName(p).orElseThrow(() -> new RuntimeException("Permission not found: " + p)))
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
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email already exists: " + userDTO.getEmail());
        }

        Role role = roleRepository.findByName(userDTO.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found: " + userDTO.getRole()));
        
        // Assign default report scope based on role
        com.lms.www.leadmanagement.entity.ReportScope scope = com.lms.www.leadmanagement.entity.ReportScope.OWN;
        if ("ADMIN".equals(role.getName()) || "MANAGER".equals(role.getName())) {
            scope = com.lms.www.leadmanagement.entity.ReportScope.ALL;
        } else if ("TEAM_LEADER".equals(role.getName())) {
            scope = com.lms.www.leadmanagement.entity.ReportScope.TEAM;
        }

        User user = User.builder()
                .name(userDTO.getName())
                .email(userDTO.getEmail())
                .mobile(userDTO.getMobile())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .role(role)
                .reportScope(scope)
                .build();
        return UserDTO.fromEntity(userRepository.save(user));
    }

    public List<UserDTO> getAllUsers() {
        System.out.println("LOG: Admin fetching all users directory...");
        return userRepository.findAll().stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<LeadDTO> getAllLeads() {
        System.out.println("LOG: Admin fetching all system leads oversight...");
        return leadRepository.findAll().stream()
                .map(LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public java.util.Map<String, Long> getLeadStats() {
        System.out.println("LOG: Admin fetching lead statistics...");
        return leadRepository.findAll().stream()
                .filter(l -> l.getStatus() != null)
                .collect(Collectors.groupingBy(l -> l.getStatus().name(), Collectors.counting()));
    }

    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        
        if (userDTO.getName() != null) user.setName(userDTO.getName());
        if (userDTO.getMobile() != null) user.setMobile(userDTO.getMobile());
        
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
                userDTO.getReportScope() != com.lms.www.leadmanagement.entity.ReportScope.OWN) {
                throw new RuntimeException("Associates are restricted to OWN report scope");
            }
            user.setReportScope(userDTO.getReportScope());
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
                java.util.Set<String> rps = user.getRole().getPermissions().stream().map(Permission::getName).collect(Collectors.toSet());
                if (rps.size() == direct.size() && rps.containsAll(userDTO.getPermissions())) {
                    exactMatch = true;
                }
            }
            
            if (!exactMatch) {
                System.out.println(">>> Applying DIRECT overrides: " + direct.stream().map(Permission::getName).collect(Collectors.toList()));
                user.setDirectPermissions(direct);
            } else {
                System.out.println(">>> Permissions match Role defaults, clearing direct overrides.");
                user.getDirectPermissions().clear();
            }
        }

        return UserDTO.fromEntity(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        // Remove relationships if necessary
        userRepository.delete(user);
    }

    public java.util.Map<String, Object> getDashboardStats(java.time.LocalDateTime start, java.time.LocalDateTime end, User requester, Long targetUserId) {
        if (start == null) {
            start = java.time.LocalDate.now().atStartOfDay();
        }
        if (end == null) {
            end = java.time.LocalDateTime.now();
        }

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        
        java.util.List<User> visibleUsers = new java.util.ArrayList<>();
        
        // Scope-based user collection
        com.lms.www.leadmanagement.entity.ReportScope scope = (requester != null && requester.getReportScope() != null) 
            ? requester.getReportScope() 
            : com.lms.www.leadmanagement.entity.ReportScope.ALL;

        if (targetUserId != null) {
            User target = userRepository.findById(targetUserId).orElse(null);
            if (target != null) {
                boolean allowed = false;
                if (scope == com.lms.www.leadmanagement.entity.ReportScope.ALL) {
                    allowed = true;
                } else if (scope == com.lms.www.leadmanagement.entity.ReportScope.TEAM && requester != null) {
                    List<User> subs = new ArrayList<>();
                    subs.add(requester);
                    collectSubordinates(requester, subs);
                    if (subs.stream().anyMatch(u -> u.getId().equals(targetUserId))) {
                        allowed = true;
                    }
                } else if (scope == com.lms.www.leadmanagement.entity.ReportScope.OWN && requester != null) {
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
                    if (requester != null) visibleUsers.add(requester);
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

        java.util.List<com.lms.www.leadmanagement.entity.Lead> leads;
        if (visibleUsers != null) {
            leads = leadRepository.findByCreatedAtBetweenAndAssignedToIn(start, end, visibleUsers);
        } else {
            leads = leadRepository.findByCreatedAtBetween(start, end);
        }

        Map<String, Long> leadStatsMap = leads.stream()
                .filter(l -> l.getStatus() != null)
                .collect(Collectors.groupingBy(l -> l.getStatus().name(), Collectors.counting()));
        leadStatsMap.put("TOTAL", (long) leads.size());
        stats.put("leadStats", leadStatsMap);
        
        // New stats for calls and interest
        long callsToday = leads.stream().filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.CONTACTED).count();
        long interestedToday = leads.stream().filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.INTERESTED).count();
        long lostToday = leads.stream().filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.LOST || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.NOT_INTERESTED).count();
        long convertedToday = leads.stream().filter(l -> l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.PAID || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.CONVERTED || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.EMI).count();
        
        stats.put("callsToday", callsToday);
        stats.put("interestedToday", interestedToday);
        stats.put("lostToday", lostToday);
        stats.put("convertedToday", convertedToday);
        
        java.util.List<com.lms.www.leadmanagement.entity.Payment> payments;
        if (visibleUsers != null) {
            List<Long> leadIds = leads.stream().map(com.lms.www.leadmanagement.entity.Lead::getId).collect(Collectors.toList());
            payments = paymentRepository.findFiltered(leadIds, start, end, null);
        } else {
            payments = paymentRepository.findByCreatedAtBetween(start, end);
        }
        
        java.math.BigDecimal totalPayments = payments.stream()
                .filter(p -> p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.PAID || p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.APPROVED)
                .map(com.lms.www.leadmanagement.entity.Payment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        stats.put("totalPayments", totalPayments);

        java.math.BigDecimal pendingRevenue = payments.stream()
                .filter(p -> p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.PENDING)
                .map(com.lms.www.leadmanagement.entity.Payment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        stats.put("pendingRevenue", pendingRevenue);
        
        // New stats for payment types
        long partPayments = payments.stream().filter(p -> "EMI_INSTALLMENT".equals(p.getPaymentType())).count();
        long fullPayments = payments.stream().filter(p -> "FULL".equals(p.getPaymentType())).count();
        
        stats.put("partPayments", partPayments);
        stats.put("fullPayments", fullPayments);
        return stats;
    }

    public java.util.List<java.util.Map<String, Object>> getMemberPerformanceFiltered(java.time.LocalDateTime start, java.time.LocalDateTime end, User requester) {
        if (start == null) start = java.time.LocalDate.now().atStartOfDay();
        if (end == null) end = java.time.LocalDateTime.now();

        final java.time.LocalDateTime fStart = start;
        final java.time.LocalDateTime fEnd = end;

        java.util.List<User> userList = new java.util.ArrayList<>();
        
        // Use identical scope logic for performance reports
        com.lms.www.leadmanagement.entity.ReportScope scope = (requester != null && requester.getReportScope() != null) 
            ? requester.getReportScope() 
            : com.lms.www.leadmanagement.entity.ReportScope.OWN;

        switch (scope) {
            case OWN:
                if (requester != null) userList.add(requester);
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
                                    || l.getStatus() == com.lms.www.leadmanagement.entity.Lead.Status.PAID)
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
        if (user.getSubordinates() != null) {
            for (User sub : user.getSubordinates()) {
                collector.add(sub);
                collectSubordinates(sub, collector);
            }
        }
    }

    public List<UserDTO> getAssociatesByTl(Long tlId) {
        User tl = userRepository.findById(tlId)
            .orElseThrow(() -> new RuntimeException("Team Leader not found"));
        return userRepository.findBySupervisor(tl).stream()
            .map(UserDTO::fromEntity)
            .collect(Collectors.toList());
    }
}
