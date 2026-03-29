package com.lms.www.leadmanagement.repository;

import com.lms.www.leadmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    java.util.List<User> findByManager(User manager);
    java.util.List<User> findByRoleName(String roleName);
    java.util.List<User> findBySupervisor(User supervisor);
}
