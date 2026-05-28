package com.pipai.api;

import com.pipai.api.dto.ProfileDto;
import com.pipai.common.ApiResponse;
import com.pipai.service.ProfileService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ApiResponse<ProfileDto> getProfile(@AuthenticationPrincipal UUID userId) {
        log.info("[DIAG] getProfile userId={}", userId);
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
        ProfileDto.CpoInfo cpoInfo = req.cpoInfo() != null ? req.cpoInfo() : new ProfileDto.CpoInfo(null, null);
        ProfileDto.OperatingInfo operatingInfo = req.operatingInfo() != null ? req.operatingInfo() : new ProfileDto.OperatingInfo(null, null);
        ProfileDto.DelegationContracts delegationContracts = req.delegationContracts() != null ? req.delegationContracts() : new ProfileDto.DelegationContracts(null);
        ProfileDto.MarketingInfo marketingInfo = req.marketingInfo() != null ? req.marketingInfo() : new ProfileDto.MarketingInfo(null, null, null);
        ProfileDto.CctvAdditional cctvAdditional = req.cctvAdditional() != null ? req.cctvAdditional() : new ProfileDto.CctvAdditional(null, null);
        ProfileDto.AccessLogInfo accessLogInfo = req.accessLogInfo() != null ? req.accessLogInfo() : new ProfileDto.AccessLogInfo(null);
        ProfileDto.JuminInfo juminInfo = req.juminInfo() != null ? req.juminInfo() : new ProfileDto.JuminInfo(null);
        ProfileDto.ProvisionInfo provisionInfo = req.provisionInfo() != null ? req.provisionInfo() : new ProfileDto.ProvisionInfo(null, null);
        ProfileDto.InternalPlanInfo internalPlanInfo = req.internalPlanInfo() != null ? req.internalPlanInfo() : new ProfileDto.InternalPlanInfo(null, null);

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
                security.accessChangeHistoryStatus(),
                cpoInfo.status(),
                cpoInfo.title(),
                operatingInfo.channels(),
                operatingInfo.privacyPolicyUrl(),
                delegationContracts.contractPerType(),
                marketingInfo.status(),
                marketingInfo.consentType(),
                marketingInfo.nightSend(),
                cctvAdditional.signageStatus(),
                cctvAdditional.range(),
                accessLogInfo.status(),
                juminInfo.collectionGround(),
                provisionInfo.status(),
                provisionInfo.consentStatus(),
                internalPlanInfo.status(),
                internalPlanInfo.cycle()
        );
    }
}
