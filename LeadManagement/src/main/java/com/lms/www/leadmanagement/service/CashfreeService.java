package com.lms.www.leadmanagement.service;

import java.math.BigDecimal;

public interface CashfreeService {
    java.util.Map<String, String> createOrder(String orderId, BigDecimal amount, String customerId, String email, String phone);
    boolean verifyWebhookSignature(String signature, String timestamp, String payload);
    java.util.Map<String, Object> getOrderStatus(String orderId);
}
