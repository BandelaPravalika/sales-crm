package com.lms.www.leadmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {
    private Long id;
    private Long userId;
    private String userName;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String status;
    private boolean isAutoCheckout;
    private Double lastLat;
    private Double lastLng;
    private LocalDateTime lastLocationTime;
    
    // Policy-driven fields for Frontend
    private Integer trackingIntervalSec;
    private String shortBreakStartTime;
    private String shortBreakEndTime;
    private String longBreakStartTime;
    private String longBreakEndTime;
    private Integer gracePeriodMinutes;
    private Integer outsideCount;
    private Double officeRadius;
    
    private Integer totalWorkMinutes;
    private String totalWorkHours; // Formatted "5h 30m"

    private Integer totalBreakMinutes;
    private String totalBreakHours; // Formatted "0h 45m"
}
