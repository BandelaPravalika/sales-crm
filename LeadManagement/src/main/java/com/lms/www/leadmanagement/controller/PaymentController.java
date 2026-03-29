package com.lms.www.leadmanagement.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
public class PaymentController {

    @Autowired
    private com.lms.www.leadmanagement.service.LeadPaymentService leadPaymentService;

    /**
     * Handles the redirect from Cashfree after a successful payment.
     * Bounces the user to the frontend success page.
     */
    @GetMapping("/payment-success")
    public void paymentSuccessRedirect(HttpServletResponse response, @RequestParam String order_id) throws IOException {
        String frontendUrl = "http://localhost:3000/payment-success?order_id=" + order_id;
        response.sendRedirect(frontendUrl);
    }

    @GetMapping("/api/payments/status")
    public org.springframework.http.ResponseEntity<com.lms.www.leadmanagement.dto.PaymentDTO> getPaymentStatus(@RequestParam String order_id) {
        return org.springframework.http.ResponseEntity.ok(leadPaymentService.getPaymentStatus(order_id));
    }

    @GetMapping("/api/public/payments/invoice")
    public org.springframework.http.ResponseEntity<com.lms.www.leadmanagement.dto.PaymentDTO> getPublicInvoice(@RequestParam String order_id) {
        // First verify payment status/gateway sync
        com.lms.www.leadmanagement.dto.PaymentDTO status = leadPaymentService.getPaymentStatus(order_id);
        if (!"PAID".equals(status.getStatus())) {
            throw new RuntimeException("Invoice not available for unpaid orders");
        }
        return org.springframework.http.ResponseEntity.ok(status);
    }

    @org.springframework.web.bind.annotation.PutMapping("/api/payments/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('UPDATE_STATUS') or hasAuthority('ADMIN')")
    public org.springframework.http.ResponseEntity<Void> updatePaymentStatus(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestParam String status,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String paymentMethod,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String note,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String actualPaidAmount,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String nextDueDate) {
        
        java.util.Map<String, String> payload = new java.util.HashMap<>();
        payload.put("status", status);
        payload.put("paymentMethod", paymentMethod);
        payload.put("note", note);
        payload.put("actualPaidAmount", actualPaidAmount);
        payload.put("nextDueDate", nextDueDate);
        
        leadPaymentService.updatePaymentStatus(id, payload);
        return org.springframework.http.ResponseEntity.ok().build();
    }

    @org.springframework.web.bind.annotation.PostMapping("/api/payments/{id}/split")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('SEND_PAYMENT') or hasAuthority('ADMIN')")
    public org.springframework.http.ResponseEntity<Void> splitPayment(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestBody com.lms.www.leadmanagement.dto.PaymentSplitRequest splitRequest) {
        leadPaymentService.splitPayment(id, splitRequest);
        return org.springframework.http.ResponseEntity.ok().build();
    }
}
