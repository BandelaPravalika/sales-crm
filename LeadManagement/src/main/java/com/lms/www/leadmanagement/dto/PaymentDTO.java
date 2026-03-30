package com.lms.www.leadmanagement.dto;

import com.lms.www.leadmanagement.entity.Payment;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentDTO {
    private Long id;
    private Long leadId;
    private String leadName;
    private String leadEmail;
    private BigDecimal amount;
    private BigDecimal totalAmount;
    private java.time.LocalDateTime date;
    private String paymentMethod;
    private String paymentType;
    private java.time.LocalDateTime dueDate;
    private String status;
    private String paymentGatewayId;
    private String receiptUrl;
    private String assignedTlName;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private Long updatedById;

    public static PaymentDTO fromEntity(com.lms.www.leadmanagement.entity.Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .leadId(payment.getLeadId())
                .amount(payment.getAmount())
                .totalAmount(payment.getTotalAmount())
                .date(payment.getDate())
                .paymentMethod(payment.getPaymentMethod())
                .paymentType(payment.getPaymentType())
                .dueDate(payment.getDueDate())
                .status(payment.getStatus() != null ? payment.getStatus().name() : "PENDING")
                .paymentGatewayId(payment.getPaymentGatewayId())
                .receiptUrl(payment.getReceiptUrl())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .updatedById(payment.getUpdatedBy() != null ? payment.getUpdatedBy().getId() : null)
                .build();
    }
}
