package com.lms.www.leadmanagement.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CashfreeWebhookDTO {

    @JsonProperty("event_time")
    private String eventTime;

    private String type;

    private DataPayload data;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DataPayload {
        private OrderPayload order;
        private PaymentPayload payment;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OrderPayload {
        @JsonProperty("order_id")
        private String orderId;
        
        @JsonProperty("order_amount")
        private Double orderAmount;
        
        @JsonProperty("order_status")
        private String orderStatus;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PaymentPayload {
        @JsonProperty("cf_payment_id")
        private String cfPaymentId;
        
        @JsonProperty("payment_status")
        private String paymentStatus;
        
        @JsonProperty("payment_amount")
        private Double paymentAmount;
    }
}
