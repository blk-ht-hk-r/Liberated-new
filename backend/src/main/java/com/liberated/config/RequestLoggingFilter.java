package com.liberated.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Dev-only (non-prod) request/response logging. Assigns a short requestId to
 * each request, exposes it via MDC (so it prints on every log line - see the
 * {@code logging.pattern.level} override in application.yml) and the
 * {@code X-Request-Id} response header, then logs a one-line summary with
 * method, path, status, latency and the authenticated user id.
 *
 * <p>Registered with the lowest precedence so it runs <em>inside</em> the Spring
 * Security chain: by the time the summary is logged the JWT filter has already
 * resolved the user id, and the requestId is present in MDC for all controller
 * and service logs on the same thread.
 */
@Component
@Profile("!prod")
@Order(Ordered.LOWEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final String REQUEST_ID = "requestId";
    private static final String HEADER = "X-Request-Id";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String requestId = request.getHeader(HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString().substring(0, 8);
        }
        MDC.put(REQUEST_ID, requestId);
        response.setHeader(HEADER, requestId);

        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long took = System.currentTimeMillis() - start;
            log.debug("{} {} -> {} ({} ms) user={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus(),
                    took,
                    currentUserId());
            MDC.remove(REQUEST_ID);
        }
    }

    /** Skip the noisy H2 console frames in local dev. */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return request.getRequestURI().startsWith("/h2-console");
    }

    private String currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long id) {
            return String.valueOf(id);
        }
        return "anonymous";
    }
}
