package com.lms.www.leadmanagement.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhook")
@Slf4j
public class WebhookController {

    @PostMapping("/payment")
    public ResponseEntity<String> webhook(@RequestBody String payload) {
        log.info(">>> Received Cashfree Webhook Payload: {}", payload);
        System.out.println(payload);
        return ResponseEntity.ok("OK");
    }
}
