package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.LeadDTO;
import com.lms.www.leadmanagement.entity.CallRecord;
import com.lms.www.leadmanagement.entity.Lead;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.CallRecordRepository;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import com.lms.www.leadmanagement.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeadService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CallRecordRepository callRecordRepository;

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) principal).getId();
        }
        throw new RuntimeException("User not authenticated");
    }

    public Map<String, Object> getLeadStats() {
        Long userId = getCurrentUserId();
        List<Lead> myLeads = leadRepository.findAll().stream()
                .filter(l -> l.getAssignedTo() != null && l.getAssignedTo().getId().equals(userId))
                .collect(Collectors.toList());
        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("TOTAL", (long) myLeads.size());
        stats.put("INTERESTED", myLeads.stream().filter(l -> Lead.Status.INTERESTED.equals(l.getStatus())).count());
        stats.put("PAID", myLeads.stream().filter(l -> Lead.Status.PAID.equals(l.getStatus())).count());
        stats.put("NOT_INTERESTED", myLeads.stream().filter(l -> Lead.Status.NOT_INTERESTED.equals(l.getStatus())).count());
        return stats;
    }

    public List<LeadDTO> getMyLeads() {
        Long userId = getCurrentUserId();
        return leadRepository.findAll().stream()
                .filter(l -> l.getAssignedTo() != null && l.getAssignedTo().getId().equals(userId))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public LeadDTO getLeadById(java.lang.annotation.Annotation... annotations) { // Generic catch-all for potential lombok/spring issues
        return null;
    }

    public LeadDTO getLeadById(Long id) {
        if (id == null) throw new RuntimeException("Lead ID is required");
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        return convertToDTO(lead);
    }

    @Transactional
    public LeadDTO createLead(LeadDTO leadDTO) {
        User currentUser = userRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new RuntimeException("Current user not found"));
        Lead lead = Lead.builder()
                .name(leadDTO.getName())
                .email(leadDTO.getEmail())
                .mobile(leadDTO.getMobile())
                .status(Lead.Status.NEW)
                .assignedTo(currentUser)
                .build();
        return convertToDTO(leadRepository.save(lead));
    }

    @Transactional
    public LeadDTO updateStatus(Long id, String status, String note) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setStatus(Lead.Status.valueOf(status.toUpperCase()));
        lead.setNote(note);
        return convertToDTO(leadRepository.save(lead));
    }

    @Transactional
    public LeadDTO recordCallOutcome(Long leadId, String status, String note, String followUpDate) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        
        User user = userRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Update Lead State
        lead.setStatus(Lead.Status.valueOf(status.toUpperCase()));
        lead.setNote(note);
        if (followUpDate != null) {
            lead.setFollowUpDate(LocalDateTime.parse(followUpDate));
            lead.setFollowUpRequired(true);
        }
        leadRepository.save(lead);

        // 2. Persistent Audit: Create CallRecord
        CallRecord record = CallRecord.builder()
                .lead(lead)
                .user(user)
                .phoneNumber(lead.getMobile())
                .callType("OUTGOING")
                .status(status)
                .note(note)
                .startTime(LocalDateTime.now(INDIA_ZONE))
                .endTime(LocalDateTime.now(INDIA_ZONE))
                .build();
        callRecordRepository.save(record);

        return convertToDTO(lead);
    }

    private LeadDTO convertToDTO(Lead lead) {
        return LeadDTO.builder()
                .id(lead.getId())
                .name(lead.getName())
                .email(lead.getEmail())
                .mobile(lead.getMobile())
                .status(lead.getStatus() != null ? lead.getStatus().name() : null)
                .note(lead.getNote())
                .paymentLink(lead.getPaymentLink())
                .build();
    }

    @Transactional
    public LeadDTO rejectLead(Long id, Map<String, Object> rejectionData) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setStatus(Lead.Status.LOST);
        lead.setRejectionReason((String) rejectionData.get("reason"));
        return convertToDTO(leadRepository.save(lead));
    }

    public User getCurrentUser() {
        return userRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new RuntimeException("Current user not found"));
    }

    public List<LeadDTO> getAllLeadsForManager() {
        User manager = getCurrentUser();
        List<Long> subordinateIds = userRepository.findSubordinateIds(manager.getId());
        subordinateIds.add(manager.getId()); // Include manager's own leads
        
        return leadRepository.findAll().stream()
                .filter(l -> l.getAssignedTo() != null && subordinateIds.contains(l.getAssignedTo().getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeadDTO assignLead(Long leadId, Long userId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        lead.setAssignedTo(user);
        lead.setStatus(Lead.Status.WORKING);
        return convertToDTO(leadRepository.save(lead));
    }

    @Transactional
    public List<LeadDTO> bulkAssignLeads(List<Long> leadIds, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Lead> leads = leadRepository.findAllById(leadIds);
        leads.forEach(l -> {
            l.setAssignedTo(user);
            l.setStatus(Lead.Status.WORKING);
        });
        return leadRepository.saveAll(leads).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeadDTO updateLead(Long id, LeadDTO leadDTO) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        
        if (leadDTO.getName() != null) lead.setName(leadDTO.getName());
        if (leadDTO.getEmail() != null) lead.setEmail(leadDTO.getEmail());
        if (leadDTO.getMobile() != null) lead.setMobile(leadDTO.getMobile());
        if (leadDTO.getNote() != null) lead.setNote(leadDTO.getNote());
        
        return convertToDTO(leadRepository.save(lead));
    }
 
    @Transactional
    public LeadDTO updateNote(Long id, String note) {

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setNote(note);
        return convertToDTO(leadRepository.save(lead));
    }

    @Transactional
    public LeadDTO updatePaymentLink(Long id, String paymentLink) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setPaymentLink(paymentLink);
        return convertToDTO(leadRepository.save(lead));
    }

    public List<com.lms.www.leadmanagement.dto.UserDTO> getCurrentUserSubordinates() {
        User user = getCurrentUser();
        // Return direct subordinates and managed associates
        java.util.Set<User> subordinates = new java.util.HashSet<>();
        if (user.getSubordinates() != null) subordinates.addAll(user.getSubordinates());
        if (user.getManagedAssociates() != null) subordinates.addAll(user.getManagedAssociates());
        
        // Include the current user to allow self-assignment
        subordinates.add(user);
        
        return subordinates.stream()
                .map(com.lms.www.leadmanagement.dto.UserDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
