package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.entity.Lead;
import com.lms.www.leadmanagement.entity.Payment;
import com.lms.www.leadmanagement.entity.Role;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.LeadTaskRepository;
import com.lms.www.leadmanagement.repository.PaymentRepository;
import com.lms.www.leadmanagement.repository.RoleRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import com.lms.www.leadmanagement.entity.LeadTask;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import com.lms.www.leadmanagement.dto.PaymentDTO;

@Service
@Slf4j
public class LeadPaymentService {

    @Autowired
    private CashfreeService cashfreeService;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeadTaskRepository leadTaskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MailService mailService;

    @Value("${lms.base-url}")
    private String baseUrl;

    @Value("${cashfree.environment:SANDBOX}")
    private String environment;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Transactional
    public java.util.Map<String, String> createPaymentLink(Long leadId, BigDecimal initialAmount, com.lms.www.leadmanagement.dto.PaymentSplitRequest splitRequest) {
        return createPaymentLink(leadId, initialAmount, initialAmount, splitRequest);
    }

    @Transactional
    public java.util.Map<String, String> createPaymentLink(Long leadId, BigDecimal initialAmount, BigDecimal totalAmount, com.lms.www.leadmanagement.dto.PaymentSplitRequest splitRequest) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        log.info(">>> Creating Payment Link for lead {} with initial amount {} and total {}", leadId, initialAmount, totalAmount);

        // Package total is totalAmount if provided, else initialAmount
        BigDecimal packageTotal = (totalAmount != null && totalAmount.compareTo(BigDecimal.ZERO) > 0) ? totalAmount : initialAmount;

        // Reuse Logic: If a RECENT pending payment already exists for this lead with SAME amount, reuse it
        java.time.LocalDateTime thirtyMinAgo = java.time.LocalDateTime.now().minusMinutes(30);
        
        Optional<Payment> existingPending = paymentRepository.findAll().stream()
                .filter(p -> p.getLeadId().equals(leadId) 
                        && p.getAmount().compareTo(initialAmount) == 0 
                        && p.getStatus() == Payment.Status.PENDING
                        && p.getCreatedAt().isAfter(thirtyMinAgo))
                .findFirst();

        if (existingPending.isPresent() && lead.getPaymentLink() != null) {
            log.info(">>> Reusing RECENT payment session for lead {}", leadId);
            return java.util.Map.of(
                "payment_url", lead.getPaymentLink(),
                "payment_session_id", lead.getPaymentSessionId(),
                "order_id", lead.getPaymentOrderId()
            );
        }

        String orderId = "LEAD_" + leadId + "_" + System.currentTimeMillis();
        
        // Call Cashfree to create order
        java.util.Map<String, String> orderData = cashfreeService.createOrder(
                orderId, 
                initialAmount, 
                lead.getId().toString(), 
                lead.getEmail(), 
                lead.getMobile()
        );

        String paymentSessionId = orderData.get("payment_session_id");
        log.info(">>> Extracted Session ID in Service: {}", paymentSessionId);
        
        if (paymentSessionId == null || paymentSessionId.isEmpty()) {
            throw new RuntimeException("Cashfree failed to return payment_session_id: " + orderData);
        }

        // Ensure the session ID is clean and construct the public link
        String cleanSessionId = paymentSessionId.trim();
        String checkoutUrl = String.format("%s/pay/%s?mode=%s", 
                frontendUrl, 
                cleanSessionId, 
                environment.toLowerCase());

        // Save payment record
        Payment payment = Payment.builder()
                .leadId(leadId)
                .amount(initialAmount)
                .totalAmount(packageTotal)
                .status(Payment.Status.PENDING)
                .paymentGatewayId(orderId)
                .build();
        payment = paymentRepository.save(payment);
        log.info(">>> Initial Payment record created with ID: {}", payment.getId());

        // Create subsequent pending installments if provided
        java.time.LocalDateTime earliestDueDate = null;
        if (splitRequest != null && splitRequest.getInstallments() != null) {
            for (com.lms.www.leadmanagement.dto.PaymentSplitRequest.InstallmentPart part : splitRequest.getInstallments()) {
                Payment nextPart = Payment.builder()
                        .leadId(leadId)
                        .amount(part.getAmount())
                        .totalAmount(payment.getTotalAmount())
                        .status(Payment.Status.PENDING)
                        .paymentType("EMI_INSTALLMENT")
                        .build();
                
                if (part.getDueDate() != null) {
                    try {
                        java.time.LocalDateTime dueDate = java.time.LocalDateTime.parse(part.getDueDate());
                        nextPart.setDueDate(dueDate);
                        
                        // Create Task for the TaskBoard
                        createLeadTask(lead, dueDate, "EMI Collection for " + lead.getName(), "EMI_COLLECTION");
                        
                        // Track earliest due date for task follow-up
                        if (earliestDueDate == null || dueDate.isBefore(earliestDueDate)) {
                            earliestDueDate = dueDate;
                        }
                    } catch (Exception e) {
                        log.error("Invalid due date format: {}", part.getDueDate());
                    }
                }
                paymentRepository.save(nextPart);
            }
        }

        // Update lead with order ID and public link
        lead.setPaymentOrderId(orderId);
        lead.setPaymentLink(checkoutUrl);
        lead.setPaymentSessionId(paymentSessionId);
        
        // Task Integration: If there are installments, set follow-up date for the TaskBoard
        if (earliestDueDate != null) {
            lead.setFollowUpDate(earliestDueDate);
            lead.setFollowUpRequired(true);
            lead.setFollowUpType("EMI_COLLECTION");
        }
        // lead.setStatus(Lead.Status.INTERESTED); // Removed: Status handled by controller/service trigger
        leadRepository.saveAndFlush(lead);
        log.info(">>> Lead {} status updated to INTERESTED", leadId);

        // Send REAL Email Outreach if email exists
        if (lead.getEmail() != null && !lead.getEmail().trim().isEmpty()) {
            String subject = "Action Required: Your Admission Payment Link for LMS";
            String body = String.format(
                "<h3>Hello %s,</h3>" +
                "<p>Your admission request has been processed. Please complete your payment of <b>₹%s</b> using the link below:</p>" +
                "<p><a href='%s' style='padding: 10px 20px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px;'>Complete Payment Now</a></p>" +
                "<p>This link is valid for 24 hours.</p>" +
                "<p>Best Regards,<br/>LMS Admissions Team</p>",
                lead.getName(), initialAmount, checkoutUrl
            );
            try {
                mailService.sendEmail(lead.getEmail(), subject, body);
                log.info(">>> REAL Email Outreach sent to {}", lead.getEmail());
            } catch (Exception e) {
                log.error(">>> Failed to send email to {}: {}", lead.getEmail(), e.getMessage());
            }
        } else {
            log.info(">>> Skipping email outreach because lead {} has no email address", lead.getId());
        }

        // Final response for mobile/frontend
        Map<String, String> response = new java.util.HashMap<>();
        response.put("payment_url", checkoutUrl);
        response.put("payment_session_id", paymentSessionId);
        response.put("order_id", orderId);
        return response;
    }

    @Transactional
    public void markAsPaid(Long leadId) {
        if (leadId == null) throw new IllegalArgumentException("Lead ID cannot be null");
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        
        if (lead.getPaymentOrderId() == null) {
            throw new RuntimeException("No payment link was generated for this lead yet.");
        }
        
        handlePaymentSuccess(lead.getPaymentOrderId());
    }

    @Transactional
    public void handlePaymentSuccess(String orderId) {
        // Use pessimistic lock to prevent concurrent processing
        Payment payment = paymentRepository.findByPaymentGatewayIdWithLock(orderId)
                .orElseThrow(() -> new RuntimeException("Payment record not found for order: " + orderId));

        if (payment.getStatus() == Payment.Status.PAID) {
            log.info(">>> Order {} already processed as PAID, skipping", orderId);
            return;
        }

        payment.setStatus(Payment.Status.PAID);
        paymentRepository.save(payment);

        Lead lead = leadRepository.findById(payment.getLeadId())
                .orElseThrow(() -> new RuntimeException("Lead not found for payment"));

        if (lead.getStatus() == Lead.Status.CONVERTED) {
            log.info(">>> Lead {} already marked as CONVERTED, skipping duplicate processing", lead.getEmail());
            return;
        }

        lead.setStatus(Lead.Status.CONVERTED);
        leadRepository.save(lead);

        log.info(">>> ADMISSION SUCCESSFUL for student {}!", lead.getEmail());
        
        // Send REAL Admission & Invoice Email
        String subject = "Admission Confirmed - Payment Invoice #" + orderId;
        String body = String.format(
            "<h3>Congratulations!</h3>" +
            "<p>Your payment of <b>₹%s</b> was successful.</p>" +
            "<p>We are pleased to confirm your <b>Admission</b>. Your account has been created, and you will receive your login credentials in a separate email shortly.</p>" +
            "<hr/>" +
            "<p><b>Invoice Details:</b><br/>" +
            "Order ID: %s<br/>" +
            "Paid Amount: ₹%s<br/>" +
            "Status: SUCCESS</p>" +
            "<p>Welcome to the community!</p>",
            payment.getAmount(), orderId, payment.getAmount()
        );
        mailService.sendEmail(lead.getEmail(), subject, body);

        // Create USER account with rollback protection
        try {
            createUserFromLead(lead);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.warn(">>> User already exists or being created by another thread for lead: {}", lead.getEmail());
            // We ignore this error to allow the status update to commit
        }
    }

    @Transactional
    public void handlePaymentFailure(String orderId) {
        Payment payment = paymentRepository.findByPaymentGatewayId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment record not found for order: " + orderId));

        if (payment.getStatus() == Payment.Status.PAID) {
            return; // Cannot fail a successful payment
        }

        payment.setStatus(Payment.Status.FAILED);
        paymentRepository.save(payment);

        Lead lead = leadRepository.findById(payment.getLeadId())
                .orElseThrow(() -> new RuntimeException("Lead not found for payment"));

        lead.setStatus(Lead.Status.LOST);
        leadRepository.save(lead);

        log.info(">>> PAYMENT FAILED for lead {}!", lead.getEmail());
    }

    @Transactional
    public PaymentDTO getPaymentStatus(String orderId) {
        Payment payment = paymentRepository.findByPaymentGatewayId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() == Payment.Status.PENDING) {
            log.info(">>> FORCE SYNC for order: {}", orderId);
            try {
                java.util.Map<String, Object> cfOrder = cashfreeService.getOrderStatus(orderId);
                if (cfOrder != null) {
                    log.info(">>> RAW CF RESPONSE for {}: {}", orderId, cfOrder);
                    
                    // Cashfree returns "PAID" or "SUCCESS" for completed orders
                    String cfStatus = (String) cfOrder.get("order_status");
                    log.info(">>> EXTRACTED STATUS for {}: {}", orderId, cfStatus);
                    
                    if ("PAID".equalsIgnoreCase(cfStatus) || "SUCCESS".equalsIgnoreCase(cfStatus)) {
                        log.info(">>> MATCH FOUND: Gateway reports success. Updating local record...");
                        handlePaymentSuccessWithSafety(orderId);
                        // Refresh the payment entity after update
                        payment = paymentRepository.findByPaymentGatewayId(orderId).orElse(payment);
                    } else if ("FAILED".equalsIgnoreCase(cfStatus)) {
                        log.info(">>> MATCH FOUND: Gateway reports failed. Updating local record...");
                        handlePaymentFailure(orderId);
                        payment = paymentRepository.findByPaymentGatewayId(orderId).orElse(payment);
                    }
                } else {
                    log.warn(">>> SYNC DELAY: Gateway returned null for order {}.", orderId);
                }
            } catch (Exception e) {
                log.error(">>> SYNC ERROR for order {}: {}", orderId, e.getMessage());
            }
        }
        
        return convertToDTO(payment);
    }

    /**
     * Specialized wrapper to ensure payment status is committed even if 
     * downstream items (email, user creation) have issues.
     */
    @Transactional
    public void handlePaymentSuccessWithSafety(String orderId) {
        log.info(">>> STARTING SAFE PAYMENT PROCESSING for order: {}", orderId);
        try {
            // First update: Isolate the payment and lead status update
            updateInternalPaymentStatus(orderId, Payment.Status.PAID, Lead.Status.CONVERTED);
            
            // Post-Status Steps: Try email and account creation, but don't fail the payment if they skip
            try {
                Payment payment = paymentRepository.findByPaymentGatewayId(orderId).orElseThrow();
                Lead lead = leadRepository.findById(payment.getLeadId()).orElseThrow();
                
                // Step 2: Email notification
                sendAdmissionSuccessEmail(lead, payment);
                
                // Step 3: Account creation
                createUserFromLead(lead);
                
            } catch (Exception e) {
                log.warn(">>> NOTIFICATION/ACCOUNT WARNING: Payment was successful, but background steps lagged: {}", e.getMessage());
                // We do NOT re-throw here so the @Transactional for status commits
            }
        } catch (Exception e) {
            log.error(">>> CRITICAL ERROR in Safe Payment Processing: {}", e.getMessage());
            throw e; // Re-throw critical DB errors
        }
    }

    @Transactional
    public void updateInternalPaymentStatus(String orderId, Payment.Status pStatus, Lead.Status lStatus) {
        Payment payment = paymentRepository.findByPaymentGatewayIdWithLock(orderId)
                .orElseThrow(() -> new RuntimeException("Payment record not found: " + orderId));
        
        if (payment.getStatus() != pStatus) {
            payment.setStatus(pStatus);
            paymentRepository.save(payment);
        }

        Lead lead = leadRepository.findById(payment.getLeadId())
                .orElseThrow(() -> new RuntimeException("Lead not found for payment"));
        
        if (lead.getStatus() != lStatus) {
            lead.setStatus(lStatus);
            leadRepository.save(lead);
        }
    }

    private void sendAdmissionSuccessEmail(Lead lead, Payment payment) {
        log.info(">>> SENDING ADMISSION EMAIL to {}", lead.getEmail());
        String subject = "Admission Confirmed - Payment Invoice #" + payment.getPaymentGatewayId();
        String body = String.format(
            "<h3>Congratulations!</h3>" +
            "<p>Your payment of <b>₹%s</b> was successful.</p>" +
            "<p>We are pleased to confirm your <b>Admission</b>.</p>" +
            "<hr/>" +
            "<p>Order ID: %s<br/>" +
            "Status: SUCCESS</p>",
            payment.getAmount(), payment.getPaymentGatewayId()
        );
        mailService.sendEmail(lead.getEmail(), subject, body);
    }

    private void createUserFromLead(Lead lead) {
        if (userRepository.existsByEmail(lead.getEmail())) {
            log.info("User already exists for email: {}", lead.getEmail());
            return;
        }

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        Role userRole = roleRepository.findByName("STUDENT").orElseGet(() -> {
            log.info(">>> Role 'STUDENT' missing. Creating on-the-fly...");
            Role newRole = new Role();
            newRole.setName("STUDENT");
            return roleRepository.save(newRole);
        });
        
        User user = User.builder()
                .name(lead.getName())
                .email(lead.getEmail())
                .mobile(lead.getMobile())
                .password(passwordEncoder.encode(tempPassword))
                .role(userRole)
                .build();
        if (user != null) {
            userRepository.save(user);
        }

        // Simulate sending email to user with credentials
        System.out.println(">>> SIMULATED EMAIL SENT to " + lead.getEmail());
        System.out.println(">>> Subject: Your New LMS Account Credentials");
        System.out.println(">>> Body: Your account has been created. Use email: " + lead.getEmail() + " and Password: " + tempPassword);

        log.info("Created USER account for lead {}. Temporary password: {}", lead.getEmail(), tempPassword);
    }

    public List<com.lms.www.leadmanagement.dto.UserDTO> getTeamLeaders() {
        return userRepository.findByRoleName("TEAM_LEADER").stream()
                .map(com.lms.www.leadmanagement.dto.UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PaymentDTO generateInvoice(Long leadId) {
        // Find the most recent SUCCESSFUL payment for this lead
        Payment payment = paymentRepository.findAll().stream()
                .filter(p -> p.getLeadId().equals(leadId) && p.getStatus() == Payment.Status.PAID)
                .sorted(Comparator.comparing(Payment::getCreatedAt).reversed())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No successful payment found for lead: " + leadId));
        
        return convertToDTO(payment);
    }

    public List<PaymentDTO> getFilteredPaymentHistory(Long tlId, Long associateId, java.time.LocalDateTime startDateTime, java.time.LocalDateTime endDateTime, String status) {

        List<Long> leadIds = null;
        
        if (associateId != null) {
            User associate = userRepository.findById(associateId)
                    .orElseThrow(() -> new RuntimeException("Associate not found"));
            leadIds = leadRepository.findByAssignedTo(associate).stream()
                    .map(Lead::getId)
                    .collect(Collectors.toList());
        } else if (tlId != null) {
            User tl = userRepository.findById(tlId)
                    .orElseThrow(() -> new RuntimeException("TL not found"));
            
            // Get leads assigned directly to TL + all subordinates
            List<User> subordinates = new ArrayList<>();
            subordinates.add(tl); // TL might have leads
            collectSubordinates(tl, subordinates);
            
            leadIds = leadRepository.findAll().stream()
                    .filter(l -> l.getAssignedTo() != null && subordinates.contains(l.getAssignedTo()))
                    .map(Lead::getId)
                    .collect(Collectors.toList());
        }

        if (leadIds != null && leadIds.isEmpty()) return Collections.emptyList();

        List<Payment> payments;
        if (leadIds != null) {
            Payment.Status pStatus = (status != null && !status.isEmpty()) ? Payment.Status.valueOf(status.toUpperCase()) : null;
            payments = paymentRepository.findFiltered(leadIds, startDateTime, endDateTime, pStatus);
        } else {
            payments = paymentRepository.findByCreatedAtBetween(startDateTime != null ? startDateTime : LocalDateTime.now().minusDays(365), endDateTime != null ? endDateTime : LocalDateTime.now());
        }

        return payments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private void collectSubordinates(User user, List<User> collector) {
        List<User> subs = userRepository.findBySupervisor(user);
        for (User sub : subs) {
            if (!collector.contains(sub)) { // Prevent circularity just in case
                collector.add(sub);
                collectSubordinates(sub, collector);
            }
        }
    }

    public List<PaymentDTO> getFilteredPaymentHistoryForTL(String tlEmail, java.time.LocalDateTime startDateTime, java.time.LocalDateTime endDateTime, String status) {
        User tl = userRepository.findByEmail(tlEmail)
                .orElseThrow(() -> new RuntimeException("TL not found"));

        List<Long> leadIds = leadRepository.findByAssignedTo(tl).stream()
                .map(Lead::getId)
                .collect(Collectors.toList());
                
        if (leadIds.isEmpty()) return Collections.emptyList();
        
        Payment.Status pStatus = (status != null && !status.isEmpty()) ? Payment.Status.valueOf(status.toUpperCase()) : null;
        return paymentRepository.findFiltered(leadIds, startDateTime, endDateTime, pStatus).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentDTO> getPaymentHistoryForAdmin() {
        return getFilteredPaymentHistory(null, null, null, null, null);
    }

    public List<PaymentDTO> getPaymentHistoryForManager(String managerEmail) {
        return getFilteredPaymentHistory(null, null, null, null, null);
    }

    public List<PaymentDTO> getPaymentHistoryForTL(String tlEmail) {
        return getFilteredPaymentHistoryForTL(tlEmail, null, null, null);
    }

    @Transactional
    public PaymentDTO updatePaymentStatus(Long paymentId, String status, String method, String note, java.math.BigDecimal actualPaidAmount, String nextDueDateStr) {
        if (paymentId == null) throw new IllegalArgumentException("Payment ID cannot be null");
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        User currentUser = getCurrentUser();
        
        if (status != null) {
            payment.setStatus(Payment.Status.valueOf(status.toUpperCase()));
        }
        if (method != null) {
            payment.setPaymentMethod(method);
        }
        
        payment.setUpdatedAt(java.time.LocalDateTime.now());
        payment.setUpdatedBy(currentUser);
        Payment saved = paymentRepository.save(payment);

        // If marked as PAID, check if we should convert the lead
        if (saved.getStatus() == Payment.Status.PAID) {
            
            // Check for partial payment
            if (actualPaidAmount != null && actualPaidAmount.compareTo(java.math.BigDecimal.ZERO) > 0 && actualPaidAmount.compareTo(payment.getAmount()) < 0) {
                // Partial payment
                java.math.BigDecimal remainingBalance = payment.getAmount().subtract(actualPaidAmount);
                saved.setAmount(actualPaidAmount);
                saved.setPaymentType("INSTALLMENT");
                paymentRepository.save(saved);

                // Create new pending payment for the remainder
                Payment nextInstallment = Payment.builder()
                        .leadId(payment.getLeadId())
                        .amount(remainingBalance)
                        .totalAmount(payment.getTotalAmount())
                        .status(Payment.Status.PENDING)
                        .paymentType("EMI_INSTALLMENT")
                        .build();
                        
                if (nextDueDateStr != null && !nextDueDateStr.isEmpty()) {
                    try {
                        java.time.LocalDateTime dDate = java.time.LocalDateTime.parse(nextDueDateStr);
                        nextInstallment.setDueDate(dDate);
                        
                        // Update Lead's follow-up date and status to point to this installment
                        Lead lead = leadRepository.findById(payment.getLeadId()).orElse(null);
                        if (lead != null) {
                            lead.setFollowUpDate(dDate);
                            lead.setFollowUpRequired(true);
                            lead.setFollowUpType("EMI_COLLECTION");
                            lead.setStatus(Lead.Status.EMI); // Ensure status remains EMI for partials
                            leadRepository.save(lead);
                            
                            // Generate Task record
                            createLeadTask(lead, dDate, "EMI Collection - Partial Payment remainder", "EMI_COLLECTION");
                        }
                    } catch (Exception e) {
                        log.error("Failed to parse next due date {}", nextDueDateStr);
                    }
                }
                paymentRepository.save(nextInstallment);
            } else {
                // FULL PAYMENT - Convert Lead and complete current tasks
                Lead lead = leadRepository.findById(saved.getLeadId()).orElse(null);
                if (lead != null) {
                    lead.setStatus(Lead.Status.CONVERTED);
                    lead.setFollowUpRequired(false);
                    leadRepository.save(lead);
                    
                    // Mark pending tasks for this lead as completed
                    try {
                        List<LeadTask> pendingTasks = leadTaskRepository.findByLeadId(lead.getId()).stream()
                                .filter(t -> t.getStatus() == LeadTask.TaskStatus.PENDING)
                                .collect(java.util.stream.Collectors.toList());
                        for (LeadTask task : pendingTasks) {
                            task.setStatus(LeadTask.TaskStatus.COMPLETED);
                        }
                        leadTaskRepository.saveAll(pendingTasks);
                        log.info(">>> Marked {} pending tasks as COMPLETED for converted lead {}", pendingTasks.size(), lead.getId());
                    } catch (Exception e) {
                        log.warn(">>> Task cleanup failed for lead {}: {}", lead.getId(), e.getMessage());
                    }

                    if (saved.getPaymentGatewayId() != null) {
                        handlePaymentSuccessWithSafety(saved.getPaymentGatewayId());
                    } else {
                        // Manual SUCCESS lifecycle - usually no gateway ID
                        try {
                            sendAdmissionSuccessEmail(lead, saved);
                            createUserFromLead(lead);
                        } catch (Exception e) {
                            log.warn(">>> Background tasks failed for manual payment: {}", e.getMessage());
                        }
                    }
                }
            }
        }

        return convertToDTO(saved);
    }

    private User getCurrentUser() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    private PaymentDTO convertToDTO(Payment payment) {
        Lead lead = leadRepository.findById(payment.getLeadId()).orElse(null);
        PaymentDTO dto = PaymentDTO.fromEntity(payment);
        
        if (lead != null) {
            dto.setLeadName(lead.getName());
            dto.setLeadEmail(lead.getEmail());
            // Added to help with real-time identification in History table
            if (lead.getAssignedTo() != null) {
                // We'll set the TL name if available
                dto.setAssignedTlName(lead.getAssignedTo().getName());
            }
        }
        return dto;
    }

    @Transactional
    public void splitPayment(Long existingPaymentId, com.lms.www.leadmanagement.dto.PaymentSplitRequest splitRequest) {
        Payment original = paymentRepository.findById(existingPaymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        if (original.getStatus() == Payment.Status.PAID) {
            throw new RuntimeException("Cannot split a completed payment");
        }

        // Create new parts based on the request
        Lead lead = leadRepository.findById(original.getLeadId()).orElse(null);

        for (int i = 0; i < splitRequest.getInstallments().size(); i++) {
            com.lms.www.leadmanagement.dto.PaymentSplitRequest.InstallmentPart part = splitRequest.getInstallments().get(i);
            java.time.LocalDateTime dDate = part.getDueDate() != null ? java.time.LocalDateTime.parse(part.getDueDate()) : null;

            if (i == 0) {
                // First part updates the original record
                original.setAmount(part.getAmount());
                if (dDate != null) {
                    original.setDueDate(dDate);
                    if (lead != null) {
                        createLeadTask(lead, dDate, "Split EMI Part 1", "EMI_COLLECTION");
                    }
                }
                paymentRepository.save(original);
            } else {
                // Subsequent parts create new records
                Payment newPart = Payment.builder()
                        .leadId(original.getLeadId())
                        .amount(part.getAmount())
                        .totalAmount(original.getTotalAmount())
                        .status(Payment.Status.PENDING)
                        .paymentType("EMI_INSTALLMENT")
                        .build();
                if (dDate != null) {
                    newPart.setDueDate(dDate);
                    if (lead != null) {
                        createLeadTask(lead, dDate, "Split EMI Part " + (i + 1), "EMI_COLLECTION");
                    }
                }
                paymentRepository.save(newPart);
            }
        }
        
        // Update lead follow-up status to point to the earliest due date if relevant
        if (lead != null && splitRequest.getInstallments().size() > 0) {
            String firstDueDate = splitRequest.getInstallments().get(0).getDueDate();
            if (firstDueDate != null) {
                lead.setFollowUpDate(java.time.LocalDateTime.parse(firstDueDate));
                lead.setFollowUpRequired(true);
                lead.setFollowUpType("EMI_COLLECTION");
                lead.setStatus(Lead.Status.EMI);
                leadRepository.save(lead);
            }
        }
    }

    @Transactional
    public com.lms.www.leadmanagement.dto.PaymentDTO updatePaymentStatus(Long id, java.util.Map<String, String> payload) {
        String newStatus = payload.get("status");
        String method = payload.get("paymentMethod");
        String note = payload.get("note");
        String actualAmountStr = payload.get("actualPaidAmount");
        String nextDueDateStr = payload.get("nextDueDate");

        java.math.BigDecimal actualPaidAmount = null;
        if (actualAmountStr != null && !actualAmountStr.isEmpty()) {
            try {
                actualPaidAmount = new java.math.BigDecimal(actualAmountStr);
            } catch (Exception e) {
                log.error("Invalid actualPaidAmount: {}", actualAmountStr);
            }
        }

        return updatePaymentStatus(id, newStatus, method, note, actualPaidAmount, nextDueDateStr);
    }

    private void createLeadTask(Lead lead, java.time.LocalDateTime dueDate, String title, String type) {
        if (dueDate == null) return;
        
        LeadTask task = LeadTask.builder()
                .lead(lead)
                .title(title)
                .description("Automated task for " + title)
                .dueDate(dueDate)
                .status(LeadTask.TaskStatus.PENDING)
                .taskType(type)
                .build();
        leadTaskRepository.save(task);
        log.info(">>> Created LeadTask for lead {} with type {} for date {}", lead.getId(), type, dueDate);
    }
}
