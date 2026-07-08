package com.mislice.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                String uid = null;
                String email = null;
                try {
                    // Verify the Firebase ID Token
                    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                    uid = decodedToken.getUid();
                    email = decodedToken.getEmail();
                } catch (Exception e) {
                    // Fallback to custom JWT for Demo Accounts
                    try {
                        uid = jwtService.extractUid(token);
                    } catch (Exception jwtEx) {
                        log.warn("Firebase & Custom JWT verification failed: {}", jwtEx.getMessage());
                    }
                }

                if (uid != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = null;
                    try {
                        // First try loading by Firebase/Custom UID
                        userDetails = userDetailsService.loadUserByUid(uid);
                    } catch (Exception e) {
                        // Fallback: If user is not yet indexed by UID but exists by email
                        if (email != null) {
                            try {
                                userDetails = userDetailsService.loadUserByUsername(email);
                            } catch (Exception ex) {
                                log.debug("User details not found for email: {}", email);
                            }
                        }
                    }

                    if (userDetails != null) {
                        var authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            } catch (Exception e) {
                log.warn("Unexpected authentication error: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }
}
