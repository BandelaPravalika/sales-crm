package com.lms.www.leadmanagement.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @SuppressWarnings("all")
    public void sendEmail(String to, String subject, String body) {
        log.info("Sending email to {}: {}", to, subject);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true for HTML
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}", to, e);
        }
    }

    public void sendPaymentLink(String to, String paymentUrl) {
        String subject = "Action Required: Your Admission Payment Link for LMS";
        String body = String.format(
            "<h3>Hello!</h3>" +
            "<p>We're excited to have you join our program.</p>" +
            "<p>To complete your admission, please use the secure payment link below:</p>" +
            "<p><a href='%s' style='background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>Pay Now & Complete Admission</a></p>" +
            "<p>Alternatively, copy and paste this link: <br/> %s</p>" +
            "<br/><p>Best regards,<br/>LMS Team</p>",
            paymentUrl, paymentUrl
        );
        sendEmail(to, subject, body);
    }
}
