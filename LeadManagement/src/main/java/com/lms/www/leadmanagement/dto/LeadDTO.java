package com.lms.www.leadmanagement.dto;

import com.lms.www.leadmanagement.entity.Lead;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadDTO {
    private Long id;
    private String name;
    private String email;
    private String mobile;
    private String status;
    private Long assignedToId;
    private String assignedToName;
    private String paymentLink;
    private String note;
    private String paymentOrderId;
    private String rejectionReason;
    private String rejectionNote;
    private Boolean followUpRequired;
    private LocalDateTime followUpDate;
    private String followUpType;
    private String paymentSessionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long updatedById;
    private String updatedByName;

    public static LeadDTO fromEntity(Lead lead) {
        return LeadDTO.builder()
                .id(lead.getId())
                .name(lead.getName())
                .email(lead.getEmail())
                .mobile(lead.getMobile())
                .status(lead.getStatus() != null ? lead.getStatus().name() : "NEW")
                .assignedToId(lead.getAssignedTo() != null ? lead.getAssignedTo().getId() : null)
                .assignedToName(lead.getAssignedTo() != null ? lead.getAssignedTo().getName() : null)
                .paymentLink(lead.getPaymentLink())
                .paymentOrderId(lead.getPaymentOrderId())
                .note(lead.getNote())
                .rejectionReason(lead.getRejectionReason())
                .rejectionNote(lead.getRejectionNote())
                .followUpRequired(lead.getFollowUpRequired())
                .followUpDate(lead.getFollowUpDate())
                .followUpType(lead.getFollowUpType())
                .paymentSessionId(lead.getPaymentSessionId())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .updatedById(lead.getUpdatedBy() != null ? lead.getUpdatedBy().getId() : null)
                .updatedByName(lead.getUpdatedBy() != null ? lead.getUpdatedBy().getName() : null)
                .build();
    }
}
