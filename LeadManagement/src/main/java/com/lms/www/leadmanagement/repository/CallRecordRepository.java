package com.lms.www.leadmanagement.repository;

import com.lms.www.leadmanagement.entity.CallRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface CallRecordRepository extends JpaRepository<CallRecord, Long> {

    List<CallRecord> findByUserIdOrderByStartTimeDesc(Long userId);

    List<CallRecord> findByUserIdInOrderByStartTimeDesc(List<Long> userIds);

    List<CallRecord> findByUserIdAndStartTimeBetweenOrderByStartTimeDesc(Long userId, java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<CallRecord> findByStartTimeBetweenOrderByStartTimeDesc(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @Query("SELECT new map(" +
           "COUNT(c) as totalCalls, " +
           "SUM(CASE WHEN c.status = 'CONNECTED' THEN 1 ELSE 0 END) as connectedCalls, " +
           "AVG(c.duration) as avgDuration) " +
           "FROM CallRecord c")
    Map<String, Object> getGlobalStats();

    @Query("SELECT new map(" +
           "COUNT(c) as totalCalls, " +
           "SUM(CASE WHEN c.status = 'CONNECTED' THEN 1 ELSE 0 END) as connectedCalls, " +
           "AVG(c.duration) as avgDuration) " +
           "FROM CallRecord c WHERE c.user.id = :userId")
    Map<String, Object> getStatsForUser(@Param("userId") Long userId);

    @Query("SELECT new map(" +
           "COUNT(c) as totalCalls, " +
           "SUM(CASE WHEN c.status = 'CONNECTED' THEN 1 ELSE 0 END) as connectedCalls, " +
           "AVG(c.duration) as avgDuration) " +
           "FROM CallRecord c WHERE c.user.id IN :userIds")
    Map<String, Object> getStatsForTeam(@Param("userIds") List<Long> userIds);
}
