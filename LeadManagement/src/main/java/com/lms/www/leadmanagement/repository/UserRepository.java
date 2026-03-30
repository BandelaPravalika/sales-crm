package com.lms.www.leadmanagement.repository;

import com.lms.www.leadmanagement.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ AUTH
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // =========================
    // HIERARCHY (OPTIMIZED)
    // =========================

    // Manager → Team Leaders
    List<User> findByManager(User manager);

    List<User> findByManagerId(Long managerId);

    Page<User> findByManagerId(Long managerId, Pageable pageable);

    // TL → Associates
    List<User> findBySupervisor(User supervisor);

    List<User> findBySupervisorId(Long supervisorId);

    Page<User> findBySupervisorId(Long supervisorId, Pageable pageable);

    // =========================
    // ROLE FILTER
    // =========================
    List<User> findByRoleName(String roleName);

    // =========================
    // TEAM VALIDATION (CRITICAL)
    // =========================

    @Query("SELECT u FROM User u WHERE u.id = :targetId AND (" +
            "u.manager.id = :managerId OR u.supervisor.id = :managerId)")
    Optional<User> findIfInMyTeam(@Param("managerId") Long managerId,
            @Param("targetId") Long targetId);

    // =========================
    // BULK TEAM FETCH (IMPORTANT)
    // =========================

    @Query("SELECT u FROM User u WHERE u.manager.id = :managerId " +
            "OR u.supervisor.id IN (" +
            "SELECT tl.id FROM User tl WHERE tl.manager.id = :managerId)")
    List<User> findFullTeam(@Param("managerId") Long managerId);
}