package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.LeadDTO;
import com.lms.www.leadmanagement.dto.UserDTO;
import com.lms.www.leadmanagement.entity.Lead;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeadService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PreAuthorize("hasAuthority('CREATE_LEADS')")
    public LeadDTO createLead(LeadDTO leadDTO) {
        User currentUser = getCurrentUser();
        Lead lead = Lead.builder()
                .name(leadDTO.getName())
                .email(leadDTO.getEmail())
                .mobile(leadDTO.getMobile())
                .status(Lead.Status.NEW)
                .assignedTo(currentUser)
                .createdBy(currentUser)
                .build();
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    public LeadDTO getLeadById(Long id) {
        return leadRepository.findById(id)
                .map(LeadDTO::fromEntity)
                .orElseThrow(() -> new RuntimeException("Lead not found: " + id));
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    public List<LeadDTO> getMyLeads() {
        User currentUser = getCurrentUser();
        return leadRepository.findByAssignedTo(currentUser).stream()
                .map(LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    public Map<String, Object> getLeadStats() {
        User currentUser = getCurrentUser();
        List<Lead> myLeads = leadRepository.findByAssignedTo(currentUser);
        
        Map<String, Long> counts = myLeads.stream()
                .collect(Collectors.groupingBy(l -> l.getStatus().name(), Collectors.counting()));
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", (long) myLeads.size());
        stats.put("statusCounts", counts);
        return stats;
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    public List<LeadDTO> getAllLeadsForManager() {
        User currentUser = getCurrentUser();
        List<User> subordinates = new ArrayList<>();
        subordinates.add(currentUser); // Manager might have own leads
        collectSubordinates(currentUser, subordinates);
        
        return leadRepository.findByAssignedToIn(subordinates).stream()
                .map(LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getCurrentUserSubordinates() {
        User currentUser = getCurrentUser();
        List<User> subordinates = new ArrayList<>();
        collectSubordinates(currentUser, subordinates);
        return subordinates.stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private void collectSubordinates(User user, List<User> collector) {
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

    @PreAuthorize("hasAuthority('ASSIGN_LEADS') or hasAuthority('ASSIGN_TO_TL')")
    public LeadDTO assignLead(Long leadId, Long userId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User currentUser = getCurrentUser();
        if (!isAuthorizedToAssign(currentUser, user)) {
            throw new AccessDeniedException("You are not authorized to assign leads to this user: " + user.getName());
        }
        
        lead.setAssignedTo(user);
        lead.setUpdatedBy(currentUser);
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @PreAuthorize("hasAuthority('ASSIGN_LEADS') or hasAuthority('ASSIGN_TO_TL')")
    public List<LeadDTO> bulkAssignLeads(List<Long> leadIds, Long userId) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User currentUser = getCurrentUser();
        
        if (!isAuthorizedToAssign(currentUser, targetUser)) {
            throw new AccessDeniedException("You are not authorized to assign leads to this user: " + targetUser.getName());
        }
        
        List<Lead> leads = leadRepository.findAllById(leadIds);
        for (Lead lead : leads) {
            lead.setAssignedTo(targetUser);
            lead.setUpdatedBy(currentUser);
        }
        return leadRepository.saveAll(leads).stream()
                .map(LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private boolean isAuthorizedToAssign(User currentUser, User targetUser) {
        String currentRole = currentUser.getRole().getName();

        if ("ADMIN".equals(currentRole)) {
            return true;
        }

        if ("MANAGER".equals(currentRole)) {
            // Manager can assign to Team Leaders or Associates in their hierarchy
            List<User> subordinates = new ArrayList<>();
            collectSubordinates(currentUser, subordinates);
            return subordinates.contains(targetUser);
        }

        if ("TEAM_LEADER".equals(currentRole)) {
            // Team Leader can only assign to Associates they manage
            return currentUser.getManagedAssociates() != null && currentUser.getManagedAssociates().contains(targetUser);
        }

        return false;
    }

    @PreAuthorize("hasAuthority('UPDATE_LEAD_STATUS')")
    public LeadDTO updateStatus(Long id, String status, String note) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setStatus(Lead.Status.valueOf(status));
        if (note != null) {
            lead.setNote(note);
        }
        lead.setUpdatedBy(getCurrentUser());
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @PreAuthorize("hasAuthority('UPDATE_LEAD_STATUS')")
    public LeadDTO rejectLead(Long id, Map<String, Object> data) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setStatus(Lead.Status.LOST);
        if (data.containsKey("rejectionReason")) {
            lead.setRejectionReason((String) data.get("rejectionReason"));
        }
        if (data.containsKey("rejectionNote")) {
            lead.setRejectionNote((String) data.get("rejectionNote"));
        }
        lead.setUpdatedBy(getCurrentUser());
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @PreAuthorize("hasAuthority('UPDATE_LEAD_STATUS')")
    public LeadDTO recordCallOutcome(Long id, String status, String note, String followUpDate) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        
        if (status != null) lead.setStatus(Lead.Status.valueOf(status));
        if (note != null) lead.setNote(note);
        
        if (followUpDate != null && !followUpDate.trim().isEmpty()) {
            try {
                // Determine format
                if (followUpDate.contains("T")) {
                    lead.setFollowUpDate(LocalDateTime.parse(followUpDate));
                } else {
                    lead.setFollowUpDate(LocalDateTime.parse(followUpDate + "T10:00:00"));
                }
                lead.setFollowUpRequired(true);
            } catch (Exception e) {
                // If parsing fails, just ignore for now
                System.err.println("!!! Failed to parse followUpDate: " + followUpDate);
            }
        }
        
        lead.setUpdatedBy(getCurrentUser());
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @PreAuthorize("hasAuthority('UPDATE_LEAD_STATUS')")
    public LeadDTO updatePaymentLink(Long id, String link) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setPaymentLink(link);
        lead.setUpdatedBy(getCurrentUser());
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @PreAuthorize("hasAuthority('UPDATE_LEAD_STATUS')")
    public LeadDTO updateNote(Long id, String note) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setNote(note);
        lead.setUpdatedBy(getCurrentUser());
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    public Page<LeadDTO> getMyLeads(Pageable pageable) {
        User currentUser = getCurrentUser();
        return leadRepository.findByAssignedToIn(Collections.singletonList(currentUser), pageable)
                .map(LeadDTO::fromEntity);
    }
}
