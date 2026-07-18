package com.mislice.domain.support;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/support/contact")
@RequiredArgsConstructor
public class ContactController {

    private final SupportEmailService emailService;

    @PostMapping
    public ResponseEntity<Map<String, String>> submitContactForm(@Valid @RequestBody ContactRequest request) {
        emailService.sendSupportEmail(request);
        return ResponseEntity.ok(Map.of("message", "Your message has been sent successfully. Support team will contact you soon."));
    }
}
