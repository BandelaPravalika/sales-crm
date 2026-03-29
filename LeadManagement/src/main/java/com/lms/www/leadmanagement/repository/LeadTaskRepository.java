package com.lms.www.leadmanagement.repository;

import com.lms.www.leadmanagement.entity.LeadTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LeadTaskRepository extends JpaRepository<LeadTask, Long> {

    List<LeadTask> findByLeadId(Long leadId);

    List<LeadTask> findByLeadIdAndDueDateBetween(Long leadId, LocalDateTime start, LocalDateTime end);

    List<LeadTask> findByStatusAndDueDateBefore(LeadTask.TaskStatus status, LocalDateTime now);

    List<LeadTask> findByLeadAssignedToIn(java.util.Collection<com.lms.www.leadmanagement.entity.User> users);

    List<LeadTask> findByLeadAssignedToInAndDueDateBetween(java.util.Collection<com.lms.www.leadmanagement.entity.User> users, LocalDateTime start, LocalDateTime end);
}
