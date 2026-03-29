package com.lms.www.leadmanagement.controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/debug")
public class DebugController {

    @GetMapping("/auth")
    public Map<String, Object> debugAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Map<String, Object> response = new HashMap<>();
        if (auth != null) {
            response.put("principal", auth.getName());
            response.put("authorities", auth.getAuthorities());
            response.put("authenticated", auth.isAuthenticated());
        } else {
            response.put("message", "No authentication found in context");
        }
        return response;
    }
}
