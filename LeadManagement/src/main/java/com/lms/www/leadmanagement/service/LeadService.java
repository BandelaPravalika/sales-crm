package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.LeadDTO;
import com.lms.www.leadmanagement.entity.CallRecord;
import com.lms.www.leadmanagement.entity.Lead;
import com.lms.www.leadmanagement.entity.LeadNote;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.CallRecordRepository;
import com.lms.www.leadmanagement.repository.LeadNoteRepository;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import com.lms.www.leadmanagement.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeadService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CallRecordRepository callRecordRepository;

    @Autowired
    private LeadNoteRepository leadNoteRepository;

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Kolkata");

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) principal).getId();
        }
        throw new RuntimeException("User not authenticated");
    }

    @Autowired
    private com.lms.www.leadmanagement.repository.PaymentRepository paymentRepository;

    public Map<String, Object> getLeadStats() {
        Long userId = getCurrentUserId();
        User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        List<Lead> myLeads = leadRepository.findByAssignedTo(currentUser);
        Map<String, Object> stats = new java.util.HashMap<>();

        long total = myLeads.size();
        long convertedCount = myLeads.stream()
                .filter(l -> Lead.Status.PAID.equals(l.getStatus()) || Lead.Status.CONVERTED.equals(l.getStatus())
                        || Lead.Status.EMI.equals(l.getStatus()))
                .count();
        long lostCount = myLeads.stream()
                .filter(l -> Lead.Status.LOST.equals(l.getStatus()) || Lead.Status.NOT_INTERESTED.equals(l.getStatus()))
                .count();

        java.util.List<Long> leadIds = myLeads.stream().map(Lead::getId).collect(Collectors.toList());
        java.math.BigDecimal totalRevenue = java.math.BigDecimal.ZERO;
        if (!leadIds.isEmpty()) {
            List<com.lms.www.leadmanagement.entity.Payment> payments = paymentRepository.findByLeadIdIn(leadIds);
            if (payments != null) {
                totalRevenue = payments.stream()
                        .filter(p -> p.getStatus() != null
                                && (com.lms.www.leadmanagement.entity.Payment.Status.PAID.equals(p.getStatus()) ||
                                        com.lms.www.leadmanagement.entity.Payment.Status.SUCCESS.equals(p.getStatus())
                                        ||
                                        com.lms.www.leadmanagement.entity.Payment.Status.APPROVED
                                                .equals(p.getStatus())))
                        .map(com.lms.www.leadmanagement.entity.Payment::getAmount)
                        .filter(java.util.Objects::nonNull)
                        .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            }
        }

        stats.put("total", total);
        stats.put("convertedCount", convertedCount);
        stats.put("lostCount", lostCount);
        stats.put("totalRevenue", totalRevenue);

        // Backward compatibility
        stats.put("TOTAL", total);
        stats.put("PAID", convertedCount);

        return stats;
    }

    public List<LeadDTO> getMyLeads() {
        Long userId = getCurrentUserId();
        User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        List<Lead> leads = leadRepository.findByAssignedTo(currentUser);

        // If the user is ADMIN, also include UNASSIGNED leads so they can be
        // filtered/assigned
        String role = currentUser.getRole() != null ? currentUser.getRole().getName() : "";
        if ("ADMIN".equals(role)) {
            List<Lead> unassigned = leadRepository.findByAssignedToIsNull();
            leads = new ArrayList<>(leads);
            leads.addAll(unassigned);
        }

        // Always sort by creation date descending
        leads.sort((a, b) -> {
            if (a.getCreatedAt() == null)
                return 1;
            if (b.getCreatedAt() == null)
                return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        return leads.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public LeadDTO getLeadById(Long id) {
        if (id == null)
            throw new RuntimeException("Lead ID is required");
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        return convertToDTO(lead);
    }

    @Transactional
    public LeadDTO createLead(LeadDTO leadDTO) {
        if (leadDTO.getMobile() == null || leadDTO.getMobile().isEmpty()) {
            throw new RuntimeException("Mobile number is required");
        }

        if (leadDTO.getEmail() != null && !leadDTO.getEmail().isEmpty()
                && leadRepository.existsByEmail(leadDTO.getEmail())) {
            throw new RuntimeException("Lead with this email address already exists in the system");
        }

        String cleanMobile = leadDTO.getMobile().replaceAll("[^0-9]", "");
        if (leadRepository.existsByMobile(cleanMobile)) {
            throw new RuntimeException("Lead with this phone number already exists in the system");
        }

        User currentUser = userRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new RuntimeException("Current user not found"));
        Lead lead = Lead.builder()
                .name(leadDTO.getName())
                .email(leadDTO.getEmail())
                .mobile(cleanMobile)
                .college(leadDTO.getCollege())
                .serialNumber(leadDTO.getSerialNumber())
                .status(Lead.Status.NEW)
                .assignedTo(null)
                .createdBy(currentUser)
                .build();
        return convertToDTO(leadRepository.save(lead));
    }

    @Transactional
    public LeadDTO updateStatus(Long id, String status, String note) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        User currentUser = userRepository.findById(getCurrentUserId()).orElse(null);

        lead.setStatus(Lead.Status.valueOf(status.toUpperCase()));
        lead.setNote(note);
        lead.setUpdatedBy(currentUser);

        if (note != null && !note.isEmpty()) {
            LeadNote leadNote = LeadNote.builder()
                    .content(note)
                    .status(status)
                    .lead(lead)
                    .createdBy(currentUser)
                    .createdAt(LocalDateTime.now())
                    .build();
            leadNoteRepository.save(leadNote);
            if (lead.getNotes() == null)
                lead.setNotes(new java.util.ArrayList<>());
            lead.getNotes().add(leadNote);
        }

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
        lead.setUpdatedBy(user);
        if (followUpDate != null && !followUpDate.isEmpty()) {
            lead.setFollowUpDate(LocalDateTime.parse(followUpDate));
            lead.setFollowUpRequired(true);
        }
        leadRepository.save(lead);

        // 2. Persistent History: LeadNote
        if (note != null && !note.isEmpty()) {
            LeadNote leadNote = LeadNote.builder()
                    .content(note)
                    .status(status)
                    .lead(lead)
                    .createdBy(user)
                    .createdAt(LocalDateTime.now())
                    .build();
            leadNoteRepository.save(leadNote);
            if (lead.getNotes() == null)
                lead.setNotes(new java.util.ArrayList<>());
            lead.getNotes().add(leadNote);
        }

        // 3. Persistent Audit: Create CallRecord
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
        return LeadDTO.fromEntity(lead);
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
        subordinateIds.add(manager.getId());

        List<User> subordinates = userRepository.findAllById(subordinateIds);

        List<Lead> leads = leadRepository.findByAssignedToInOrCreatedBy(subordinates, manager);
        leads.sort((a, b) -> {
            if (a.getCreatedAt() == null)
                return 1;
            if (b.getCreatedAt() == null)
                return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });
        return leads.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeadDTO assignLead(Long leadId, Long userId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        if (userId == null || userId == 0) {
            lead.setAssignedTo(null);
            lead.setStatus(Lead.Status.NEW);
            return convertToDTO(leadRepository.save(lead));
        }

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        User requester = getCurrentUser();
        String requesterRole = requester.getRole() != null ? requester.getRole().getName() : "";
        Long reqId = requester.getId();
        Long targetId = targetUser.getId();

        // 1. Admin Bypass: Full System Clearance
        if ("ADMIN".equals(requesterRole)) {
            // No restrictions
        }
        // 2. Manager Protocol: Restricted to Branch Subordinates or Self
        else if ("MANAGER".equals(requesterRole)) {
            boolean isSelf = reqId.equals(targetId);
            boolean isSub = targetUser.getManager() != null && targetUser.getManager().getId().equals(reqId);
            if (!isSelf && !isSub) {
                throw new RuntimeException(
                        "Hierarchy Violation: Branch Managers are restricted to assigning leads within their own identity cluster.");
            }
        }
        // 3. Team Leader Protocol: Restricted to Squad Associates or Self
        else if ("TEAM_LEADER".equals(requesterRole)) {
            boolean isSelf = reqId.equals(targetId);
            boolean isAssoc = targetUser.getSupervisor() != null && targetUser.getSupervisor().getId().equals(reqId);
            if (!isSelf && !isAssoc) {
                throw new RuntimeException(
                        "Hierarchy Violation: Team Leaders are restricted to assigning leads within their own squad nodes.");
            }
        }
        // 4. Default: Unauthorized
        else if (!reqId.equals(targetId)) {
            throw new RuntimeException(
                    "Clearance Denied: Lead assignment requires Administrative or Squad-level permissions.");
        }

        lead.setAssignedTo(targetUser);
        lead.setStatus(Lead.Status.WORKING);
        return convertToDTO(leadRepository.save(lead));
    }

    @Transactional
    public List<LeadDTO> bulkAssignLeads(List<Long> leadIds, Long userId) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        User requester = getCurrentUser();
        String requesterRole = requester.getRole() != null ? requester.getRole().getName() : "";
        Long reqId = requester.getId();
        Long targetId = targetUser.getId();

        // Hierarchy Clearance Validation
        if (!"ADMIN".equals(requesterRole)) {
            if ("MANAGER".equals(requesterRole)) {
                boolean isSelf = reqId.equals(targetId);
                boolean isSub = targetUser.getManager() != null && targetUser.getManager().getId().equals(reqId);
                if (!isSelf && !isSub)
                    throw new RuntimeException(
                            "Hierarchy Violation: Only branch subordinates are eligible for bulk assignment.");
            } else if ("TEAM_LEADER".equals(requesterRole)) {
                boolean isSelf = reqId.equals(targetId);
                boolean isAssoc = targetUser.getSupervisor() != null
                        && targetUser.getSupervisor().getId().equals(reqId);
                if (!isSelf && !isAssoc)
                    throw new RuntimeException(
                            "Hierarchy Violation: Only squad associates are eligible for bulk assignment.");
            } else if (!reqId.equals(targetId)) {
                throw new RuntimeException(
                        "Clearance Denied: Lead assignment protocol requires elevated administrative status.");
            }
        }

        List<Lead> leads = leadRepository.findAllById(leadIds);
        leads.forEach(l -> {
            l.setAssignedTo(targetUser);
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

        if (leadDTO.getName() != null)
            lead.setName(leadDTO.getName());
        if (leadDTO.getEmail() != null)
            lead.setEmail(leadDTO.getEmail());
        if (leadDTO.getMobile() != null)
            lead.setMobile(leadDTO.getMobile());
        if (leadDTO.getCollege() != null)
            lead.setCollege(leadDTO.getCollege());
        if (leadDTO.getSerialNumber() != null)
            lead.setSerialNumber(leadDTO.getSerialNumber());
        if (leadDTO.getNote() != null)
            lead.setNote(leadDTO.getNote());

        return convertToDTO(leadRepository.save(lead));
    }

    @Transactional
    public LeadDTO updateNote(Long id, String note) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        User currentUser = userRepository.findById(getCurrentUserId()).orElse(null);

        lead.setNote(note);
        lead.setUpdatedBy(currentUser);

        if (note != null && !note.isEmpty()) {
            LeadNote leadNote = LeadNote.builder()
                    .content(note)
                    .status(lead.getStatus() != null ? lead.getStatus().name() : "NEW")
                    .lead(lead)
                    .createdBy(currentUser)
                    .createdAt(LocalDateTime.now())
                    .build();
            leadNoteRepository.save(leadNote);
            if (lead.getNotes() == null)
                lead.setNotes(new java.util.ArrayList<>());
            lead.getNotes().add(leadNote);
        }

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
        java.util.Set<User> subordinates = new java.util.HashSet<>();
        if (user.getSubordinates() != null)
            subordinates.addAll(user.getSubordinates());
        if (user.getManagedAssociates() != null)
            subordinates.addAll(user.getManagedAssociates());
        subordinates.add(user);
        return subordinates.stream()
                .map(com.lms.www.leadmanagement.dto.UserDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
