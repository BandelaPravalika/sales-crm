package com.lms.www.leadmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    
    // Attendance
    private long presentCount;
    private long absentCount;
    private long lateCount;
    
    // Revenue
    private BigDecimal dailyRevenue;
    private BigDecimal monthlyRevenue;
    private BigDecimal expectedRevenue;
    
    // Follow-ups
    private long todayFollowups;
    private long pendingFollowups;
    
    // Target Metrics
    private BigDecimal monthlyTarget;
    private Double targetAchievement; // Percentage
}
