package com.mislice.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> defaultBuckets = new ConcurrentHashMap<>();

    @Value("${mislice.rate-limit.auth-requests-per-minute:10}")
    private int authLimit;

    @Value("${mislice.rate-limit.default-requests-per-minute:120}")
    private int defaultLimit;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip static resources, actuator, etc.
        if (!path.startsWith("/api/v1/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = getClientIp(request);
        boolean isAuthEndpoint = path.contains("/api/v1/auth/login") 
                || path.contains("/api/v1/auth/register")
                || path.contains("/api/v1/auth/demo-login");

        Bucket bucket;
        if (isAuthEndpoint) {
            bucket = authBuckets.computeIfAbsent(ip, k -> createNewBucket(authLimit));
        } else {
            bucket = defaultBuckets.computeIfAbsent(ip, k -> createNewBucket(defaultLimit));
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\": 429, \"error\": \"TOO_MANY_REQUESTS\", \"message\": \"Too many requests. Please try again later.\", \"path\": \"" + path + "\"}");
        }
    }

    private Bucket createNewBucket(int limit) {
        Refill refill = Refill.intervally(limit, Duration.ofMinutes(1));
        Bandwidth limitBandwidth = Bandwidth.classic(limit, refill);
        return Bucket.builder()
                .addLimit(limitBandwidth)
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
