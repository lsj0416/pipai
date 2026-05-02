package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.domain.CompanyProfile;
import com.pipai.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    public record ProfileRequest(
            String businessType,
            Integer employeeCount,
            String annualRevenue,
            String personalDataItems,
            Boolean hasPrivacyPolicy,
            String sensitiveDataTypes) {}

    @GetMapping
    public ApiResponse<CompanyProfile> getProfile(@AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(profileService.getProfile(userId));
    }

    @PutMapping
    public ApiResponse<CompanyProfile> upsertProfile(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody ProfileRequest req) {
        var data = new ProfileService.ProfileData(req.businessType(), req.employeeCount(),
                req.annualRevenue(), req.personalDataItems(), req.hasPrivacyPolicy(), req.sensitiveDataTypes());
        return ApiResponse.ok(profileService.upsertProfile(userId, data));
    }
}
