package com.lms.www.leadmanagement.repository;

import com.lms.www.leadmanagement.entity.Lead;
import com.lms.www.leadmanagement.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    Optional<Lead> findByMobile(String mobile);
    boolean existsByMobile(String mobile);
    boolean existsByEmail(String email);

    List<Lead> findByAssignedTo(User assignedTo);
    List<Lead> findByAssignedToIsNull();

    List<Lead> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Lead> findByCreatedAtBetweenAndAssignedToIn(
            LocalDateTime start,
            LocalDateTime end,
            Collection<User> users);

    Page<Lead> findByAssignedToIn(
            Collection<User> users,
            Pageable pageable);

    @Query("SELECT l FROM Lead l WHERE l.assignedTo IN :users")
    List<Lead> findByAssignedToIn(@Param("users") Collection<User> users);

    Page<Lead> findByAssignedToInAndCreatedAtBetween(
            Collection<User> users,
            LocalDateTime start,
            LocalDateTime end,
            Pageable pageable);

    Optional<Lead> findByIdAndAssignedTo(Long id, User assignedTo);

    boolean existsByEmailAndAssignedTo(String email, User assignedTo);

    boolean existsByMobileAndAssignedTo(String mobile, User assignedTo);

    @Query("SELECT new map(" +
            "count(l) as total, " +
            "coalesce(sum(case when l.status = 'NEW' then 1 else 0 end), 0) as newCount, " +
            "coalesce(sum(case when l.status = 'INTERESTED' then 1 else 0 end), 0) as interestedCount, " +
            "coalesce(sum(case when l.status = 'CONTACTED' then 1 else 0 end), 0) as contactedCount, " +
            "coalesce(sum(case when l.status = 'FOLLOW_UP' then 1 else 0 end), 0) as followUpCount, " +
            "coalesce(sum(case when l.status IN ('CONVERTED', 'PAID', 'EMI', 'CLOSED') then 1 else 0 end), 0) as convertedCount, " +
            "coalesce(sum(case when l.status IN ('LOST', 'NOT_INTERESTED', 'PAYMENT_FAILED') then 1 else 0 end), 0) as lostCount) " +
            "FROM Lead l WHERE l.assignedTo IN :users AND l.createdAt BETWEEN :start AND :end")
    Map<String, Long> getSummaryStats(
            @Param("users") Collection<User> users,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT new map(" +
            "count(l) as total, " +
            "coalesce(sum(case when l.status = 'NEW' then 1 else 0 end), 0) as newCount, " +
            "coalesce(sum(case when l.status = 'INTERESTED' then 1 else 0 end), 0) as interestedCount, " +
            "coalesce(sum(case when l.status = 'CONTACTED' then 1 else 0 end), 0) as contactedCount, " +
            "coalesce(sum(case when l.status = 'FOLLOW_UP' then 1 else 0 end), 0) as followUpCount, " +
            "coalesce(sum(case when l.status IN ('CONVERTED', 'PAID', 'EMI', 'CLOSED') then 1 else 0 end), 0) as convertedCount, " +
            "coalesce(sum(case when l.status IN ('LOST', 'NOT_INTERESTED', 'PAYMENT_FAILED') then 1 else 0 end), 0) as lostCount) " +
            "FROM Lead l WHERE l.createdAt BETWEEN :start AND :end")
    Map<String, Long> getGlobalSummaryStats(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT new map(cast(l.createdAt as localdate) as date, count(l) as count) " +
            "FROM Lead l WHERE l.assignedTo.id IN :userIds AND l.createdAt BETWEEN :start AND :end " +
            "GROUP BY cast(l.createdAt as localdate) ORDER BY cast(l.createdAt as localdate)")
    List<Map<String, Object>> getDailyLeadTrend(
            @Param("userIds") Collection<Long> userIds,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT new map(cast(l.createdAt as localdate) as date, count(l) as count) " +
            "FROM Lead l WHERE l.createdAt BETWEEN :start AND :end " +
            "GROUP BY cast(l.createdAt as localdate) ORDER BY cast(l.createdAt as localdate)")
    List<Map<String, Object>> getGlobalDailyLeadTrend(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT new map(cast(l.createdAt as localdate) as date, count(l) as count) " +
            "FROM Lead l WHERE l.assignedTo.id IN :userIds AND l.createdAt BETWEEN :start AND :end " +
            "AND (l.status = 'LOST' OR l.status = 'NOT_INTERESTED') " +
            "GROUP BY cast(l.createdAt as localdate) ORDER BY cast(l.createdAt as localdate)")
    List<Map<String, Object>> getDailyLostTrend(
            @Param("userIds") Collection<Long> userIds,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT new map(cast(l.createdAt as localdate) as date, count(l) as count) " +
            "FROM Lead l WHERE l.createdAt BETWEEN :start AND :end " +
            "AND (l.status = 'LOST' OR l.status = 'NOT_INTERESTED') " +
            "GROUP BY cast(l.createdAt as localdate) ORDER BY cast(l.createdAt as localdate)")
    List<Map<String, Object>> getGlobalDailyLostTrend(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}