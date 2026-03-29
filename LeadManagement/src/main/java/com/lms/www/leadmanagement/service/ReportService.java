package com.lms.www.leadmanagement.service;

import com.lms.www.leadmanagement.dto.LeadStatsDTO;
import com.lms.www.leadmanagement.dto.ReportFilterDTO;
import com.lms.www.leadmanagement.dto.TimeSeriesStatsDTO;
import com.lms.www.leadmanagement.entity.ReportScope;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.LeadRepository;
import com.lms.www.leadmanagement.repository.PaymentRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
    private UserRepository userRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public LeadStatsDTO getFilteredStats(ReportFilterDTO filter) {
        User loggedInUser = getCurrentUser();
        Collection<User> allowedUsers = determineAllowedUsers(loggedInUser, filter);

        LocalDateTime start = filter.getFromDate() != null ? filter.getFromDate().atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = filter.getToDate() != null ? filter.getToDate().atTime(LocalTime.MAX) : LocalDateTime.now();

        Map<String, Long> statsMap = leadRepository.getSummaryStats(allowedUsers, start, end);

        return LeadStatsDTO.builder()
                .total(statsMap.getOrDefault("total", 0L))
                .newCount(statsMap.getOrDefault("newCount", 0L))
                .followUpCount(statsMap.getOrDefault("followUpCount", 0L))
                .interestedCount(statsMap.getOrDefault("interestedCount", 0L))
                .contactedCount(statsMap.getOrDefault("contactedCount", 0L))
                .lostCount(statsMap.getOrDefault("lostCount", 0L))
                .convertedCount(statsMap.getOrDefault("convertedCount", 0L))
                .build();
    }

    public List<TimeSeriesStatsDTO> getFilteredTrend(ReportFilterDTO filter) {
        User loggedInUser = getCurrentUser();
        Collection<User> allowedUsers = determineAllowedUsers(loggedInUser, filter);
        List<Long> userIds = allowedUsers.stream().map(User::getId).collect(Collectors.toList());

        LocalDateTime start = filter.getFromDate() != null ? filter.getFromDate().atStartOfDay() : LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime end = filter.getToDate() != null ? filter.getToDate().atTime(LocalTime.MAX) : LocalDateTime.now();

        // Fetch daily lead counts
        List<Map<String, Object>> leadTrend = new ArrayList<>();
        try {
            if (userIds != null && !userIds.isEmpty()) {
                leadTrend = leadRepository.getDailyLeadTrend(userIds, start, end);
            }
        } catch (Exception e) {
            System.err.println("!!! FAILED TO FETCH LEAD TREND: " + e.getMessage());
        }
        
        // Fetch daily revenue
        List<com.lms.www.leadmanagement.entity.Payment> payments = new ArrayList<>();
        try {
            if (userIds != null && !userIds.isEmpty()) {
                payments = paymentRepository.findFilteredByUserIds(userIds, start, end);
            }
        } catch (Exception e) {
            System.err.println("!!! FAILED TO FETCH REVENUE TREND: " + e.getMessage());
        }
        
        Map<LocalDate, Long> leadsByDate = new HashMap<>();
        for (Map<String, Object> row : leadTrend) {
            Object dateObj = row.get("date");
            if (dateObj instanceof java.sql.Date) {
                LocalDate date = ((java.sql.Date) dateObj).toLocalDate();
                leadsByDate.put(date, (Long) row.get("count"));
            } else if (dateObj instanceof java.time.LocalDate) {
                leadsByDate.put((LocalDate) dateObj, (Long) row.get("count"));
            }
        }

        Map<LocalDate, BigDecimal> revenueByDate = payments.stream()
                .filter(p -> p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.PAID || p.getStatus() == com.lms.www.leadmanagement.entity.Payment.Status.APPROVED)
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, p -> p.getAmount(), BigDecimal::add)
                ));

        // Generate date sequence for the range
        List<TimeSeriesStatsDTO> result = new ArrayList<>();
        LocalDate current = start.toLocalDate();
        LocalDate stop = end.toLocalDate();
        
        while (!current.isAfter(stop)) {
            result.add(TimeSeriesStatsDTO.builder()
                    .date(current)
                    .leadsCount(leadsByDate.getOrDefault(current, 0L))
                    .revenue(revenueByDate.getOrDefault(current, BigDecimal.ZERO))
                    .build());
            current = current.plusDays(1);
        }

        return result;
    }

    public List<com.lms.www.leadmanagement.dto.LeadDTO> getTodayFollowups(ReportFilterDTO filter) {
        User loggedInUser = getCurrentUser();
        Collection<User> allowedUsers = determineAllowedUsers(loggedInUser, filter);

        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);

        // Fetch leads with follow-up date today assigned to allowed users
        return leadRepository.findAll().stream()
                .filter(l -> l.getFollowUpDate() != null 
                        && !l.getFollowUpDate().isBefore(start) 
                        && !l.getFollowUpDate().isAfter(end)
                        && allowedUsers.stream().anyMatch(u -> u.getId().equals(l.getAssignedTo().getId())))
                .map(com.lms.www.leadmanagement.dto.LeadDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private Collection<User> determineAllowedUsers(User loggedInUser, ReportFilterDTO filter) {
        Set<User> scopeUsers = new HashSet<>();
        
        // Resolve based on Scope
        ReportScope scope = loggedInUser.getReportScope() != null ? loggedInUser.getReportScope() : ReportScope.OWN;
        
        switch (scope) {
            case ALL:
                if (filter.getUserId() != null) {
                    scopeUsers.add(userRepository.findById(filter.getUserId()).orElseThrow());
                } else if (filter.getTeamLeaderId() != null) {
                    User tl = userRepository.findById(filter.getTeamLeaderId()).orElseThrow();
                    scopeUsers.add(tl);
                    collectSubordinates(tl, scopeUsers);
                } else {
                    return userRepository.findAll(); // Full scope
                }
                break;
                
            case TEAM:
                Set<User> myTeam = new HashSet<>();
                myTeam.add(loggedInUser);
                collectSubordinates(loggedInUser, myTeam);
                
                if (filter.getUserId() != null) {
                    User target = userRepository.findById(filter.getUserId()).orElseThrow();
                    if (!myTeam.contains(target)) throw new RuntimeException("Unauthorized scope access");
                    scopeUsers.add(target);
                } else {
                    scopeUsers.addAll(myTeam);
                }
                break;
                
            case OWN:
            default:
                scopeUsers.add(loggedInUser);
                break;
        }
        
        return scopeUsers;
    }

    private void collectSubordinates(User user, Collection<User> collector) {
        if (user.getSubordinates() != null) {
            for (User sub : user.getSubordinates()) {
                collector.add(sub);
                collectSubordinates(sub, collector);
            }
        }
    }
}
