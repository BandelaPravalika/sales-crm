package com.lms.www.leadmanagement.repository;

import com.lms.www.leadmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByMobile(String mobile);
    List<User> findByRoleName(String roleName);
    List<User> findBySupervisor(User supervisor);
    List<User> findByManager(User manager);

    // Fetch full hierarchy of subordinates using a Recursive CTE (MySQL 8.0+)
    @Query(value = "WITH RECURSIVE Subordinates AS (" +
                   "  SELECT id FROM users WHERE id = :managerId " +
                   "  UNION ALL " +
                   "  SELECT u.id FROM users u " +
                   "  INNER JOIN Subordinates s ON (u.manager_id = s.id OR u.supervisor_id = s.id) " +
                   ") SELECT id FROM Subordinates WHERE id != :managerId",
           nativeQuery = true)
    List<Long> findSubordinateIds(@Param("managerId") Long managerId);
}