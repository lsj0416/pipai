package com.pipai.api;

import com.pipai.api.dto.ProfileDto;
import com.pipai.common.ApiResponse;
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

    @GetMapping
    public ApiResponse<ProfileDto> getProfile(@AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(ProfileDto.from(profileService.getProfile(userId)));
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
    public ApiResponse<ProfileDto> upsertProfile(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody ProfileDto.ProfileRequest req) {
        return ApiResponse.ok(ProfileDto.from(profileService.upsertProfile(userId, toProfileData(req))));
    }

    private ProfileService.ProfileData toProfileData(ProfileDto.ProfileRequest req) {
        ProfileDto.Overview overview = req.overview() != null
                ? req.overview()
                : new ProfileDto.Overview(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        ProfileDto.Destruction destruction = req.destruction() != null ? req.destruction() : new ProfileDto.Destruction(null, null);
        ProfileDto.EmploymentRetention employment = req.employmentRetention() != null ? req.employmentRetention() : new ProfileDto.EmploymentRetention(null, null);
        ProfileDto.PartnerContactHandling partner = req.partnerContactHandling() != null ? req.partnerContactHandling() : new ProfileDto.PartnerContactHandling(null, null);
        ProfileDto.PrivacyPolicyCompleteness policy = req.privacyPolicyCompleteness() != null ? req.privacyPolicyCompleteness() : new ProfileDto.PrivacyPolicyCompleteness(null);
        ProfileDto.DelegationGovernance governance = req.delegationGovernance() != null ? req.delegationGovernance() : new ProfileDto.DelegationGovernance(null, null, null);
        ProfileDto.CloudHosting cloud = req.cloudHosting() != null ? req.cloudHosting() : new ProfileDto.CloudHosting(null, null);
        ProfileDto.CctvControls cctv = req.cctvControls() != null ? req.cctvControls() : new ProfileDto.CctvControls(null, null);
        ProfileDto.SecurityControls security = req.securityControls() != null ? req.securityControls() : new ProfileDto.SecurityControls(null, null, null, null);

        return new ProfileService.ProfileData(
                overview.businessType(),
                overview.employeeCount(),
                overview.annualRevenue(),
                overview.personalDataItems(),
                overview.hasPrivacyPolicy(),
                overview.sensitiveDataTypes(),
                overview.collectionMethods(),
                overview.collectionPurposes(),
                overview.delegationStatus(),
                overview.delegateeTypes(),
                overview.overseasTransferStatus(),
                overview.overseasTransferCountry(),
                overview.cctvOperationStatus(),
                overview.systemStatus(),
                overview.encryptionStatus(),
                destruction.policyStatus(),
                destruction.methods(),
                employment.documentRetention(),
                employment.formerEmployeeDestructionTiming(),
                partner.dbRegistration(),
                partner.retentionPolicy(),
                policy.includedItems(),
                governance.disclosureStatus(),
                governance.auditStatus(),
                governance.educationStatus(),
                cloud.serverLocation(),
                cloud.overseasServerCountry(),
                cctv.externalProvision(),
                cctv.accessControl(),
                security.encryptedDataItems(),
                security.accessControlSeparation(),
                security.retiredAccessRevocation(),
                security.accessChangeHistoryStatus()
        );
    }
}
