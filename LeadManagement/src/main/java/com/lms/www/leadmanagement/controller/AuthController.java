package com.lms.www.leadmanagement.controller;

import com.lms.www.leadmanagement.dto.AuthResponse;
import com.lms.www.leadmanagement.dto.LoginRequest;
import com.lms.www.leadmanagement.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.authenticateUser(loginRequest));
    }

    @GetMapping("/me")
    public ResponseEntity<com.lms.www.leadmanagement.dto.UserDTO> getMe() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }
}
