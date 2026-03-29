package com.lms.www.leadmanagement.repository;

import com.lms.www.leadmanagement.entity.Lead;
import com.lms.www.leadmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByAssignedTo(User assignedTo);
    List<Lead> findByAssignedToIn(java.util.Collection<User> users);
    Optional<Lead> findByIdAndAssignedTo(Long id, User assignedTo);
    List<Lead> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    boolean existsByEmailAndMobileAndAssignedTo(String email, String mobile, User assignedTo);
    boolean existsByEmailAndAssignedTo(String email, User assignedTo);
    boolean existsByMobileAndAssignedTo(String mobile, User assignedTo);
    List<Lead> findByCreatedAtBetweenAndAssignedToIn(java.time.LocalDateTime start, java.time.LocalDateTime end, java.util.Collection<User> users);

    @org.springframework.data.jpa.repository.Query("SELECT " +
        "COUNT(l) as total, " +
        "COUNT(CASE WHEN l.status = 'NEW' THEN 1 END) as newCount, " +
        "COUNT(CASE WHEN l.status = 'FOLLOW_UP' THEN 1 END) as followUpCount, " +
        "COUNT(CASE WHEN l.status = 'INTERESTED' THEN 1 END) as interestedCount, " +
        "COUNT(CASE WHEN l.status = 'CONTACTED' THEN 1 END) as contactedCount, " +
        "COUNT(CASE WHEN l.status = 'LOST' THEN 1 END) as lostCount, " +
        "COUNT(CASE WHEN l.status = 'CONVERTED' OR l.status = 'PAID' THEN 1 END) as convertedCount " +
        "FROM Lead l " +
        "WHERE l.assignedTo IN :users AND l.createdAt BETWEEN :start AND :end")
    java.util.Map<String, Long> getSummaryStats(@org.springframework.data.repository.query.Param("users") java.util.Collection<User> users, 
                                               @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start, 
                                               @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query(value = "SELECT DATE(created_at) as date, COUNT(*) as count " +
        "FROM leads " +
        "WHERE assigned_to IN (:userIds) AND created_at BETWEEN :start AND :end " +
        "GROUP BY DATE(created_at)", nativeQuery = true)
    List<java.util.Map<String, Object>> getDailyLeadTrend(@org.springframework.data.repository.query.Param("userIds") java.util.Collection<Long> userIds, 
                                                        @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start, 
                                                        @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);
}
