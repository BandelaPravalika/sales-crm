package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.LeadDTO;
import com.lms.www.leadmanagement.entity.Lead;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.lms.www.leadmanagement.entity.Payment;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LeadService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.lms.www.leadmanagement.repository.PaymentRepository paymentRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    public Map<String, Object> getLeadStats() {
        User user = getCurrentUser();
        List<Lead> leads = getScopedLeadsInternal(user);
        
        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("TOTAL", (long) leads.size());
        stats.put("NEW", leads.stream().filter(l -> Lead.Status.NEW == l.getStatus()).count());
        stats.put("FOLLOW_UP", leads.stream().filter(l -> Lead.Status.FOLLOW_UP == l.getStatus()).count());
        stats.put("INTERESTED", leads.stream().filter(l -> Lead.Status.INTERESTED == l.getStatus()).count());
        stats.put("PAID", leads.stream().filter(l -> Lead.Status.PAID == l.getStatus()).count());
        stats.put("CLOSED", leads.stream().filter(l -> Lead.Status.CLOSED == l.getStatus()).count());
        
        return stats;
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    public List<LeadDTO> getMyLeads() {
        User user = getCurrentUser();
        return getScopedLeadsInternal(user).stream()
                .map(LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private List<Lead> getScopedLeadsInternal(User user) {
        switch (user.getReportScope() != null ? user.getReportScope() : com.lms.www.leadmanagement.entity.ReportScope.OWN) {
            case OWN:
                return leadRepository.findByAssignedTo(user);
            case TEAM:
                java.util.List<User> team = new java.util.ArrayList<>();
                team.add(user);
                collectSubordinates(user, team);
                return leadRepository.findByAssignedToIn(team);
            case ALL:
                return leadRepository.findAll();
            default:
                return leadRepository.findByAssignedTo(user);
        }
    }

    private void collectSubordinates(User user, java.util.List<User> collector) {
        if (user.getSubordinates() != null) {
            for (User sub : user.getSubordinates()) {
                collector.add(sub);
                collectSubordinates(sub, collector);
            }
        }
    }

    private void checkLeadAccess(Lead lead, User user) {
        if (user.getRole() != null && "ADMIN".equals(user.getRole().getName())) return;
        if (user.getReportScope() == com.lms.www.leadmanagement.entity.ReportScope.ALL) return;
        
        if (user.getReportScope() == com.lms.www.leadmanagement.entity.ReportScope.OWN) {
            if (!lead.getAssignedTo().getId().equals(user.getId())) {
                throw new RuntimeException("Unauthorized access to this lead");
            }
        } else if (user.getReportScope() == com.lms.www.leadmanagement.entity.ReportScope.TEAM) {
            java.util.List<User> team = new java.util.ArrayList<>();
            team.add(user);
            collectSubordinates(user, team);
            if (!team.stream().anyMatch(u -> u.getId().equals(lead.getAssignedTo().getId()))) {
                throw new RuntimeException("Unauthorized access to lead outside your team");
            }
        }
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    public LeadDTO getLeadById(Long id) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        checkLeadAccess(lead, getCurrentUser());
        return LeadDTO.fromEntity(lead);
    }

    public LeadDTO createLead(LeadDTO leadDTO) {
        User creator = getCurrentUser();
        User assignedTo = creator;
        
        if (leadDTO.getAssignedToId() != null) {
            assignedTo = userRepository.findById(leadDTO.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("Assigned user not found"));
        }

        // Duplicate Check: Same Email AND Same Mobile + Same Assigned TL
        if (leadRepository.existsByEmailAndMobileAndAssignedTo(leadDTO.getEmail(), leadDTO.getMobile(), assignedTo)) {
            throw new RuntimeException("Lead with same email and mobile already exists for this Team Leader");
        }

        Lead lead = Lead.builder()
                .name(leadDTO.getName())
                .email(leadDTO.getEmail())
                .mobile(leadDTO.getMobile())
                .status(Lead.Status.NEW)
                .note(leadDTO.getNote())
                .createdBy(creator)
                .assignedTo(assignedTo)
                .build();

        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @PreAuthorize("hasAuthority('VIEW_LEADS')")
    public List<LeadDTO> getAllLeadsForManager() {
        return leadRepository.findAll().stream()
                .map(LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @PreAuthorize("hasAnyAuthority('ASSIGN_TO_TL', 'ASSIGN_TO_ASSOCIATE')")
    public LeadDTO assignLead(Long leadId, Long tlId) {
        Lead lead = leadRepository.findById(leadId).orElseThrow(() -> new RuntimeException("Lead not found"));
        User tl = userRepository.findById(tlId).orElseThrow(() -> new RuntimeException("Team Leader not found"));
        lead.setAssignedTo(tl);
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @Transactional
    @PreAuthorize("hasAnyAuthority('ASSIGN_TO_TL', 'ASSIGN_TO_ASSOCIATE')")
    public List<LeadDTO> bulkAssignLeads(List<Long> leadIds, Long tlId) {
        User tl = userRepository.findById(tlId).orElseThrow(() -> new RuntimeException("Team Leader not found"));
        List<Lead> leads = leadRepository.findAllById(leadIds);
        leads.forEach(l -> l.setAssignedTo(tl));
        return leadRepository.saveAll(leads).stream()
                .map(LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }
    @Transactional
    public LeadDTO updateStatus(Long id, String status, String note) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        User currentUser = getCurrentUser();

        if (status != null) {
            lead.setStatus(Lead.Status.valueOf(status.toUpperCase()));
        }
        if (note != null) {
            lead.setNote(note);
        }
        lead.setUpdatedBy(currentUser);
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @Transactional
    public LeadDTO updateNote(Long id, String note) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setNote(note);
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @Transactional
    public LeadDTO updatePaymentLink(Long id, String link) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setPaymentLink(link);
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }


    public java.util.List<com.lms.www.leadmanagement.dto.UserDTO> getCurrentUserSubordinates() {
        User currentUser = getCurrentUser();
        return currentUser.getSubordinates().stream()
                .map(com.lms.www.leadmanagement.dto.UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeadDTO rejectLead(Long id, java.util.Map<String, Object> rejectionData) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        User currentUser = getCurrentUser();
        lead.setStatus(Lead.Status.NOT_INTERESTED);
        lead.setUpdatedBy(currentUser);
        lead.setRejectionReason((String) rejectionData.get("reason"));
        lead.setRejectionNote((String) rejectionData.get("note"));
        lead.setFollowUpRequired((Boolean) rejectionData.get("followUpRequired"));
        if (rejectionData.get("followUpDate") != null) {
            lead.setFollowUpDate(java.time.LocalDateTime.parse((String) rejectionData.get("followUpDate")));
        }
        lead.setFollowUpType((String) rejectionData.get("followUpType"));
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }

    @Transactional
    public LeadDTO recordCallOutcome(Long id, String status, String note, String followUpDate) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        User currentUser = getCurrentUser();

        if (status != null) {
            lead.setStatus(Lead.Status.valueOf(status.toUpperCase()));
        }
        if (note != null) {
            lead.setNote(note);
        }
        if (followUpDate != null && !followUpDate.isEmpty()) {
            lead.setFollowUpDate(java.time.LocalDateTime.parse(followUpDate));
            lead.setFollowUpRequired(true);
        } else {
            lead.setFollowUpRequired(false);
        }
        
        lead.setUpdatedBy(currentUser);
        return LeadDTO.fromEntity(leadRepository.save(lead));
    }
    public java.util.Map<String, Long> getLeadStats(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        java.util.List<Lead> leads;
        if (start == null || end == null) {
            leads = leadRepository.findAll();
        } else {
            leads = leadRepository.findByCreatedAtBetween(start, end);
        }
        return leads.stream()
                .collect(java.util.stream.Collectors.groupingBy(l -> l.getStatus().name(), java.util.stream.Collectors.counting()));
    }

    public java.math.BigDecimal getTotalPayments(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        java.util.List<com.lms.www.leadmanagement.entity.Payment> payments;
        if (start == null || end == null) {
            payments = paymentRepository.findAll();
        } else {
            payments = paymentRepository.findByCreatedAtBetween(start, end);
        }
        return payments.stream()
                .map(com.lms.www.leadmanagement.entity.Payment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
    }
}
