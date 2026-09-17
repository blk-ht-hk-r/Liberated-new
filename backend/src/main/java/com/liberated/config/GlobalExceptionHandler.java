package com.liberated.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Central error handling + logging. Extends {@link ResponseEntityExceptionHandler}
 * so standard Spring MVC failures (bean validation, unreadable JSON, missing
 * params, wrong method) keep their correct 4xx status instead of being caught by
 * the catch-all below and turned into 500s.
 *
 * <p>Known business errors ({@link ResponseStatusException}) are logged at WARN
 * with their status and their reason is placed in {@code message} (Spring Boot
 * hides it by default) so the mobile app can surface it. Anything unexpected is
 * logged at ERROR with a full stack trace. Every response echoes the current
 * requestId so a client-reported error can be matched to a server log line.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        HttpStatusCode status = ex.getStatusCode();
        String reason = ex.getReason() != null ? ex.getReason() : "Request failed";
        log.warn("Request failed [{}]: {}", status.value(), reason);
        return build(status, reason);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatusCode status, String message) {
        // LinkedHashMap (not Map.of) so a missing requestId won't throw on null.
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("message", message);
        body.put("error", message);
        body.put("requestId", MDC.get("requestId"));
        return ResponseEntity.status(status).body(body);
    }
}
