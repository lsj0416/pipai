package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.domain.CompanyProfile;
import com.pipai.service.ProfileService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
            String sensitiveDataTypes,
            String collectionMethods) {}

    @GetMapping
    public ApiResponse<CompanyProfile> getProfile(@AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(profileService.getProfile(userId));
    }

    public record FieldPatchRequest(@NotBlank String field, @NotBlank String value) {}

    @PatchMapping("/field")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void patchField(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody FieldPatchRequest req) {
        profileService.patchField(userId, req.field(), req.value());
    }

    @PutMapping
    public ApiResponse<CompanyProfile> upsertProfile(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody ProfileRequest req) {
        var data = new ProfileService.ProfileData(req.businessType(), req.employeeCount(),
                req.annualRevenue(), req.personalDataItems(), req.hasPrivacyPolicy(), req.sensitiveDataTypes(),
                req.collectionMethods());
        return ApiResponse.ok(profileService.upsertProfile(userId, data));
    }
}
