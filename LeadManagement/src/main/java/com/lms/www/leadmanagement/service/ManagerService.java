package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.UserDTO;
import com.lms.www.leadmanagement.entity.Permission;
import com.lms.www.leadmanagement.entity.Role;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.PermissionRepository;
import com.lms.www.leadmanagement.repository.RoleRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ManagerService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PermissionRepository permissionRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserDTO createTeamLeader(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email already exists: " + userDTO.getEmail());
        }
        Role tlRole = roleRepository.findByName("TEAM_LEADER").orElseThrow(() -> new RuntimeException("Role TEAM_LEADER not found"));
        User manager = getCurrentUser();
        User user = User.builder()
                .name(userDTO.getName())
                .email(userDTO.getEmail())
                .mobile(userDTO.getMobile())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .role(tlRole)
                .manager(manager)
                .build();
        return UserDTO.fromEntity(userRepository.save(user));
    }

    public List<UserDTO> getAllManagedUsers() {
        User manager = getCurrentUser();
        // Sync any users created by this manager that might be missing the manager link
        syncOrphanedSubordinates(manager);
        
        List<User> subordinates = userRepository.findByManager(manager);
        
        // Include the manager themselves in the list so they are visible and selectable in the UI
        java.util.List<User> allVisible = new java.util.ArrayList<>();
        allVisible.add(manager);
        allVisible.addAll(subordinates);
        
        return allVisible.stream()
                .filter(u -> u.getRole() != null && !u.getRole().getName().equals("ADMIN"))
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private void syncOrphanedSubordinates(User manager) {
        // Find users without a manager but with roles that should belong to someone
        List<User> orphans = userRepository.findAll().stream()
                .filter(u -> u.getManager() == null && u.getRole() != null && !u.getRole().getName().equals("ADMIN"))
                .filter(u -> !u.getId().equals(manager.getId())) // Avoid setting a user as their own manager (Infinite Recursion Fix)
                .collect(Collectors.toList());
        
        if (!orphans.isEmpty()) {
            orphans.forEach(u -> u.setManager(manager));
            userRepository.saveAll(orphans);
        }
    }

    public UserDTO createUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email already exists: " + userDTO.getEmail());
        }
        Role role = roleRepository.findByName(userDTO.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found: " + userDTO.getRole()));

        User supervisor = null;
        Long supId = userDTO.getSupervisorId();
        if (supId != null) {
            supervisor = userRepository.findById(supId).orElseThrow(() -> new RuntimeException("Supervisor not found"));
        }

        User manager = getCurrentUser();
        User user = User.builder()
                .name(userDTO.getName())
                .email(userDTO.getEmail())
                .mobile(userDTO.getMobile())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .role(role)
                .manager(manager)
                .supervisor(supervisor)
                .build();
        return UserDTO.fromEntity(userRepository.save(user));
    }

    public UserDTO assignToSupervisor(Long associateId, Long supervisorId) {
        User associate = userRepository.findById(associateId).orElseThrow(() -> new RuntimeException("Associate not found"));
        User supervisor = userRepository.findById(supervisorId).orElseThrow(() -> new RuntimeException("Supervisor not found"));
        
        // Ensure both belong to the current manager
        User currentManager = getCurrentUser();
        if (!associate.getManager().getId().equals(currentManager.getId()) || 
            !supervisor.getManager().getId().equals(currentManager.getId())) {
            throw new RuntimeException("Unauthorized: User does not belong to your team");
        }

        associate.setSupervisor(supervisor);
        return UserDTO.fromEntity(userRepository.save(associate));
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

        if (userDTO.getSupervisorId() != null) {
            Long editSupId = userDTO.getSupervisorId();
            User supervisor = userRepository.findById(editSupId)
                    .orElseThrow(() -> new RuntimeException("Supervisor not found: " + editSupId));
            user.setSupervisor(supervisor);
        } else if (userDTO.getSupervisorId() == null && user.getRole() != null && "ASSOCIATE".equals(user.getRole().getName())) {
            // Optional: Handle explicitly unassigning?
            // user.setSupervisor(null); 
        }
        
        if (userDTO.getPermissions() != null) {
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
                user.setDirectPermissions(direct);
            } else {
                user.getDirectPermissions().clear();
            }
        }

        return UserDTO.fromEntity(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    public List<String> getAllPermissions() {
        return permissionRepository.findAll().stream().map(Permission::getName).collect(Collectors.toList());
    }

    public List<com.lms.www.leadmanagement.dto.RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(r -> com.lms.www.leadmanagement.dto.RoleDTO.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .permissions(r.getPermissions() != null 
                            ? r.getPermissions().stream().map(Permission::getName).collect(Collectors.toList())
                            : java.util.Collections.emptyList())
                        .build())
                .collect(Collectors.toList());
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
}
