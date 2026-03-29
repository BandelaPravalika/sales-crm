package com.lms.www.leadmanagement.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.HashMap;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class CashfreeServiceImpl implements CashfreeService {

    @Value("${cashfree.client-id}")
    private String clientId;

    @Value("${cashfree.client-secret}")
    private String clientSecret;

    @Value("${cashfree.environment:SANDBOX}")
    private String environment;

    @Value("${cashfree.webhook-secret}")
    private String webhookSecret;

    @Value("${app.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate;

    private String getBaseUrl() {
        if ("PRODUCTION".equalsIgnoreCase(environment)) {
            return "https://api.cashfree.com/pg";
        }
        return "https://sandbox.cashfree.com/pg";
    }

    @Override
    public java.util.Map<String, String> createOrder(String orderId, BigDecimal amount, String customerId, String email,
            String phone) {
        String url = getBaseUrl() + "/orders";

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-client-id", clientId);
        headers.set("x-client-secret", clientSecret);
        headers.set("x-api-version", "2023-08-01");
        headers.set("Content-Type", "application/json");

        Map<String, Object> customerDetails = new HashMap<>();
        customerDetails.put("customer_id", customerId);
        customerDetails.put("customer_phone", phone);
        customerDetails.put("customer_email", email);
        customerDetails.put("customer_name", "Customer " + customerId);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("order_id", orderId);
        Map<String, Object> request = new java.util.HashMap<>();
        request.put("order_id", orderId);
        request.put("order_amount", amount);
        request.put("order_currency", "INR");
        request.put("order_expiry_time", OffsetDateTime.now(ZoneOffset.UTC).plusHours(24)
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        request.put("customer_details", customerDetails);

        // Use the injected base URL for both redirect and real-time webhook notification
        request.put("order_meta", Map.of(
            "return_url", baseUrl + "/payment-success?order_id={order_id}",
            "notify_url", baseUrl + "/api/payment/webhook"
        ));
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            HttpMethod postMethod = HttpMethod.POST;
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    postMethod,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> body = response.getBody();
            log.info(">>> Cashfree Create Order RAW Response: {}", body);

            if (body != null && body.containsKey("payment_session_id")) {
                Map<String, String> result = new HashMap<>();
                result.put("payment_session_id", (String) body.get("payment_session_id"));
                result.put("order_id", orderId);
                // Cashfree v3 returns payment_url for hosted checkout
                if (body.containsKey("payment_url")) {
                    result.put("payment_url", (String) body.get("payment_url"));
                }
                return result;
            } else {
                throw new RuntimeException("Failed to retrieve payment_session_id: " + body);
            }
        } catch (Exception e) {
            log.error("Exception calling Cashfree createOrder API", e);
            throw new RuntimeException("Cashfree API Call Failed: " + e.getMessage());
        }
    }

    @Override
    public java.util.Map<String, Object> getOrderStatus(String orderId) {
        String url = getBaseUrl() + "/orders/" + orderId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-client-id", clientId);
        headers.set("x-client-secret", clientSecret);
        headers.set("x-api-version", "2023-08-01");
        headers.set("Content-Type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            
            return response.getBody();
        } catch (Exception e) {
            log.error("Exception fetching order status from Cashfree: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public boolean verifyWebhookSignature(String signature, String timestamp, String payload) {
        try {
            if (webhookSecret == null || webhookSecret.isEmpty()) {
                log.warn("Webhook secret not configured, skipping signature verification");
                return true;
            }

            String data = timestamp + payload;
            SecretKeySpec secretKey = new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKey);
            byte[] hmacData = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String computedSignature = Base64.getEncoder().encodeToString(hmacData);

            return computedSignature.equals(signature);
        } catch (Exception e) {
            log.error("Error verifying Cashfree webhook signature", e);
            return false;
        }
    }
}
