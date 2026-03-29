package com.lms.www.leadmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.www.leadmanagement.dto.CashfreeWebhookDTO;
import com.lms.www.leadmanagement.service.CashfreeService;
import com.lms.www.leadmanagement.service.LeadPaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookController {

    private final CashfreeService cashfreeService;
    private final LeadPaymentService leadPaymentService;
    private final ObjectMapper objectMapper;

    @PostMapping("/webhook")
    public ResponseEntity<String> handleCashfreeWebhook(
            @RequestHeader("x-webhook-signature") String signature,
            @RequestHeader("x-webhook-timestamp") String timestamp,
            @RequestBody String payload) {

        log.info(">>> HIT CORRECT WEBHOOK");
        log.info(">>> Received Cashfree Webhook: {}", payload);

        if (!cashfreeService.verifyWebhookSignature(signature, timestamp, payload)) {
            log.warn(">>> Invalid Webhook Signature!");
            return ResponseEntity.status(401).body("Invalid signature");
        }

        try {
            CashfreeWebhookDTO webhookData = objectMapper.readValue(payload, CashfreeWebhookDTO.class);
            String orderId = webhookData.getData().getOrder().getOrderId();
            String status = webhookData.getData().getPayment().getPaymentStatus();
            String eventType = webhookData.getType();

            log.info(">>> Webhook Event: {} | Order: {} | Status: {}", eventType, orderId, status);

            if ("PAYMENT_SUCCESS_WEBHOOK".equals(eventType) && "SUCCESS".equalsIgnoreCase(status)) {
                log.info(">>> SUCCESS PAYMENT TRIGGERED for orderId: {}", orderId);
                leadPaymentService.handlePaymentSuccessWithSafety(orderId);
            } else if ("PAYMENT_FAILED_WEBHOOK".equals(eventType) || "FAILED".equalsIgnoreCase(status)) {
                log.info(">>> FAILED PAYMENT for orderId: {}", orderId);
                leadPaymentService.handlePaymentFailure(orderId);
            }

            return ResponseEntity.ok("Handled");
        } catch (Exception e) {
            log.error(">>> Error parsing webhook payload", e);
            return ResponseEntity.status(400).body("Error parsing payload");
        }
    }
}
