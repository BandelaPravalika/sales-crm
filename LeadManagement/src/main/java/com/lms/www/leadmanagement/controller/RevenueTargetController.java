package com.lms.www.leadmanagement.controller;

import com.lms.www.leadmanagement.entity.RevenueTarget;
import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.RevenueTargetRepository;
import com.lms.www.leadmanagement.repository.UserRepository;
import com.lms.www.leadmanagement.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/targets")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class RevenueTargetController {

    @Autowired
    private RevenueTargetRepository targetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ManagerService managerService;

    @PostMapping("/set")
    public ResponseEntity<?> setTarget(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        Integer month = Integer.valueOf(payload.get("month").toString());
        Integer year = Integer.valueOf(payload.get("year").toString());

        User targetUser = userRepository.findById(userId).orElseThrow();
        
        RevenueTarget target = targetRepository.findByUserIdAndMonthAndYear(userId, month, year)
                .orElse(RevenueTarget.builder().user(targetUser).month(month).year(year).build());
        
        target.setTargetAmount(amount);
        return ResponseEntity.ok(targetRepository.save(target));
    }
}
