package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    public record SignupRequest(@Email @NotBlank String email,
                                @NotBlank String password,
                                @NotBlank String name,
                                String title,
                                @NotBlank String contactPhone,
                                boolean termsService,
                                boolean termsPrivacy,
                                boolean termsMarketing,
                                boolean termsAiUsage) {}

    public record LoginRequest(@Email @NotBlank String email,
                               @NotBlank String password) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthService.SignupResult> signup(@Valid @RequestBody SignupRequest req) {
        return ApiResponse.ok(authService.signup(
                req.email(), req.password(), req.name(),
                req.title(), req.contactPhone(),
                req.termsService(), req.termsPrivacy(),
                req.termsMarketing(), req.termsAiUsage()));
    }

    @PostMapping("/login")
    public ApiResponse<AuthService.LoginResult> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(authService.login(req.email(), req.password()));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthService.LoginResult> refresh(@Valid @RequestBody RefreshRequest req) {
        return ApiResponse.ok(authService.refresh(req.refreshToken()));
    }
}
