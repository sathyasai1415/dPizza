package com.mislice.domain.support;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportEmailService {

    private final JavaMailSender mailSender;

    public void sendSupportEmail(ContactRequest request) {
        log.info("Sending support email from {} ({}) under category: {}", request.name(), request.email(), request.category());

        SimpleMailMessage mailMessage = new SimpleMailMessage();
        // Send to our platform support email
        mailMessage.setTo("hello@mislice.online");
        mailMessage.setFrom("support@mislice.online");
        mailMessage.setReplyTo(request.email());
        mailMessage.setSubject("[MiSlice Support] " + request.category() + " Inquiry from " + request.name());

        StringBuilder body = new StringBuilder();
        body.append("New Support Request Received:\n\n");
        body.append("Name: ").append(request.name()).append("\n");
        body.append("Email: ").append(request.email()).append("\n");
        body.append("Category: ").append(request.category()).append("\n");
        if (request.orderNumber() != null && !request.orderNumber().isBlank()) {
            body.append("Order Number: ").append(request.orderNumber()).append("\n");
        }
        body.append("\nMessage:\n");
        body.append(request.message()).append("\n\n");
        body.append("--- End of Message ---");

        mailMessage.setText(body.toString());

        try {
            mailSender.send(mailMessage);
            log.info("Support email successfully sent.");
        } catch (Exception ex) {
            log.error("Failed to send support email: {}", ex.getMessage(), ex);
            throw new RuntimeException("Could not send support email. Please try again later.", ex);
        }
    }
}
