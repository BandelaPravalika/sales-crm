package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.ReportFilterDTO;
import com.lms.www.leadmanagement.dto.TimeSeriesStatsDTO;
import com.lms.www.leadmanagement.dto.LeadStatsDTO;
import com.lms.www.leadmanagement.dto.LeadDTO;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.entity.Role;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.PaymentRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in user not found"));
    }

    private Collection<User> determineAllowedUsers(User loggedInUser, ReportFilterDTO filter) {
        Set<User> users = new HashSet<>();
        
        // If filter specifies a User or TL, and we have access, use that
        if (filter.getUserId() != null) {
            userRepository.findById(filter.getUserId()).ifPresent(users::add);
        } else if (filter.getTeamLeaderId() != null) {
            userRepository.findById(filter.getTeamLeaderId()).ifPresent(tl -> {
                users.add(tl);
                if (tl.getSubordinates() != null) users.addAll(tl.getSubordinates());
                if (tl.getManagedAssociates() != null) users.addAll(tl.getManagedAssociates());
            });
        } else {
            // Default: current user + their hierarchy
            users.add(loggedInUser);
            if (loggedInUser.getSubordinates() != null) users.addAll(loggedInUser.getSubordinates());
            if (loggedInUser.getManagedAssociates() != null) users.addAll(loggedInUser.getManagedAssociates());
        }
        
        return users;
    }

    @PreAuthorize("hasAuthority('VIEW_REPORTS')")
    public LeadStatsDTO getFilteredStats(ReportFilterDTO filter) {
        User loggedInUser = getCurrentUser();
        Collection<User> allowedUsers = determineAllowedUsers(loggedInUser, filter);
        
        LocalDateTime start = filter.getFromDate() != null ? filter.getFromDate().atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = filter.getToDate() != null ? filter.getToDate().atTime(LocalTime.MAX) : LocalDateTime.now();
        
        Map<String, Long> stats = leadRepository.getSummaryStats(allowedUsers, start, end);
        
        return LeadStatsDTO.builder()
                .total(stats.getOrDefault("total", 0L))
                .newCount(stats.getOrDefault("newCount", 0L))
                .interestedCount(stats.getOrDefault("interestedCount", 0L))
                .contactedCount(stats.getOrDefault("contactedCount", 0L))
                .followUpCount(stats.getOrDefault("followUpCount", 0L))
                .convertedCount(stats.getOrDefault("convertedCount", 0L))
                .lostCount(stats.getOrDefault("lostCount", 0L))
                .build();
    }

    @PreAuthorize("hasAuthority('VIEW_REPORTS')")
    public List<TimeSeriesStatsDTO> getFilteredTrend(ReportFilterDTO filter) {
        User loggedInUser = getCurrentUser();
        Collection<User> allowedUsers = determineAllowedUsers(loggedInUser, filter);
        List<Long> userIds = allowedUsers.stream().map(User::getId).collect(Collectors.toList());

        LocalDateTime start = filter.getFromDate() != null ? filter.getFromDate().atStartOfDay() : LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime end = filter.getToDate() != null ? filter.getToDate().atTime(LocalTime.MAX) : LocalDateTime.now();

        // Fetch daily lead counts (Generated)
        List<Map<String, Object>> leadTrend = new ArrayList<>();
        if (!userIds.isEmpty()) {
            leadTrend = leadRepository.getDailyLeadTrend(userIds, start, end);
        }
        
        // Fetch daily lost counts
        List<Map<String, Object>> lostTrend = new ArrayList<>();
        if (!userIds.isEmpty()) {
            lostTrend = leadRepository.getDailyLostTrend(userIds, start, end);
        }
        
        // Fetch daily revenue (Amount)
        List<com.lms.www.leadmanagement.entity.Payment> payments = new ArrayList<>();
        if (!userIds.isEmpty()) {
            payments = paymentRepository.findFilteredByUserIds(userIds, start, end);
        }
        
        Map<LocalDate, Long> leadsByDate = new HashMap<>();
        for (Map<String, Object> row : leadTrend) {
            Object dateObj = row.get("date");
            LocalDate date = null;
            if (dateObj instanceof java.sql.Date) date = ((java.sql.Date) dateObj).toLocalDate();
            else if (dateObj instanceof java.time.LocalDate) date = (java.time.LocalDate) dateObj;
            
            if (date != null) leadsByDate.put(date, (Long) row.get("count"));
        }

        Map<LocalDate, Long> lostByDate = new HashMap<>();
        for (Map<String, Object> row : lostTrend) {
            Object dateObj = row.get("date");
            LocalDate date = null;
            if (dateObj instanceof java.sql.Date) date = ((java.sql.Date) dateObj).toLocalDate();
            else if (dateObj instanceof java.time.LocalDate) date = (java.time.LocalDate) dateObj;
            
            if (date != null) lostByDate.put(date, (Long) row.get("count"));
        }

        Map<LocalDate, BigDecimal> revenueByDate = payments.stream()
                .filter(p -> p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.PAID || p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.APPROVED)
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, p -> p.getAmount(), BigDecimal::add)
                ));

        List<TimeSeriesStatsDTO> result = new ArrayList<>();
        LocalDate current = start.toLocalDate();
        LocalDate stop = end.toLocalDate();
        
        while (!current.isAfter(stop)) {
            result.add(TimeSeriesStatsDTO.builder()
                    .date(current)
                    .leadsCount(leadsByDate.getOrDefault(current, 0L))
                    .lostCount(lostByDate.getOrDefault(current, 0L))
                    .revenue(revenueByDate.getOrDefault(current, BigDecimal.ZERO))
                    .build());
            current = current.plusDays(1);
        }

        return result;
    }

    @PreAuthorize("hasAuthority('VIEW_REPORTS')")
    public List<LeadDTO> getTodayFollowups(ReportFilterDTO filter) {
        User loggedInUser = getCurrentUser();
        Collection<User> allowedUsers = determineAllowedUsers(loggedInUser, filter);
        
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        return leadRepository.findAll().stream()
                .filter(l -> l.getFollowUpDate() != null && 
                            !l.getFollowUpDate().isBefore(startOfDay) && 
                            !l.getFollowUpDate().isAfter(endOfDay) &&
                            allowedUsers.contains(l.getAssignedTo()))
                .map(LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
