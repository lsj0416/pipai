package com.pipai.service;

import com.pipai.common.exception.ResourceNotFoundException;
import com.pipai.domain.CompanyProfile;
import com.pipai.domain.User;
import com.pipai.repository.ProfileRepository;
import com.pipai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final ProfileDiagnosisService profileDiagnosisService;

    public record ProfileData(String businessType, Integer employeeCount, String annualRevenue,
                              String personalDataItems, Boolean hasPrivacyPolicy, String sensitiveDataTypes,
                              String collectionMethods, String collectionPurposes, String delegationStatus,
                              String delegateeTypes, String overseasTransferStatus, String overseasTransferCountry,
                              String cctvOperationStatus, String systemStatus, String encryptionStatus,
                              String destructionPolicyStatus, String destructionMethods,
                              String employmentDocumentRetention, String formerEmployeeDestructionTiming,
                              String partnerContactDbRegistration, String partnerContactRetention,
                              String privacyPolicyIncludedItems, String delegateeDisclosureStatus,
                              String delegateeAuditStatus, String delegateeEducationStatus,
                              String cloudServerLocation, String overseasServerCountry,
                              String cctvExternalProvision, String cctvAccessControl,
                              String encryptedDataItems, String accessControlSeparation,
                              String retiredAccessRevocation, String accessChangeHistoryStatus,
                              String cpoStatus, String cpoTitle, String operatingChannels, String privacyPolicyUrl,
                              String contractPerType, String marketingStatus, String marketingConsentType,
                              String marketingNightSend, String cctvSignageStatus, String cctvRange,
                              String accessLogStatus, String juminCollectionGround,
                              String provisionStatus, String provisionConsentStatus,
                              String internalPlanStatus, String internalPlanCycle) {}

    @Transactional(readOnly = true)
    public CompanyProfile getProfile(UUID userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("프로필이 존재하지 않습니다."));
    }

    @Transactional(readOnly = true)
    public Optional<CompanyProfile> findProfile(UUID userId) {
        return profileRepository.findByUserId(userId);
    }

    @Transactional
    public void patchField(UUID userId, String field, String value) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        CompanyProfile profile = profileRepository.findByUserId(userId).orElseGet(() ->
                profileRepository.save(CompanyProfile.create(user)));
        profile.patchField(field, value);
        profileDiagnosisService.rediagnose(user, profile);
    }

    @Transactional
    public void patchFieldBatch(UUID userId, Map<String, String> fields) {
        if (fields == null || fields.isEmpty()) return;
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        CompanyProfile profile = profileRepository.findByUserId(userId).orElseGet(() ->
                profileRepository.save(CompanyProfile.create(user)));
        fields.forEach((f, v) -> {
            if (v != null && !v.isBlank()) {
                profile.patchField(f, v);
            }
        });
        profileDiagnosisService.rediagnose(user, profile);
    }

    @Transactional
    public void appendHiddenMemo(UUID userId, String summary) {
        profileRepository.findByUserId(userId).ifPresent(profile ->
                profile.appendHiddenMemo(LocalDate.now() + ": " + summary));
    }

    @Transactional
    public CompanyProfile upsertProfile(UUID userId, ProfileData data) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        CompanyProfile profile = profileRepository.findByUserId(userId).map(existing -> {
            existing.update(data.businessType(), data.employeeCount(), data.annualRevenue(),
                    data.personalDataItems(), data.hasPrivacyPolicy(), data.sensitiveDataTypes(),
                    data.collectionMethods(), data.collectionPurposes(), data.delegationStatus(),
                    data.delegateeTypes(), data.overseasTransferStatus(), data.overseasTransferCountry(),
                    data.cctvOperationStatus(), data.systemStatus(), data.encryptionStatus(),
                    data.destructionPolicyStatus(), data.destructionMethods(),
                    data.employmentDocumentRetention(), data.formerEmployeeDestructionTiming(),
                    data.partnerContactDbRegistration(), data.partnerContactRetention(),
                    data.privacyPolicyIncludedItems(), data.delegateeDisclosureStatus(),
                    data.delegateeAuditStatus(), data.delegateeEducationStatus(),
                    data.cloudServerLocation(), data.overseasServerCountry(),
                    data.cctvExternalProvision(), data.cctvAccessControl(),
                    data.encryptedDataItems(), data.accessControlSeparation(),
                    data.retiredAccessRevocation(), data.accessChangeHistoryStatus(),
                    data.cpoStatus(), data.cpoTitle(), data.operatingChannels(), data.privacyPolicyUrl(),
                    data.contractPerType(), data.marketingStatus(), data.marketingConsentType(),
                    data.marketingNightSend(), data.cctvSignageStatus(), data.cctvRange(),
                    data.accessLogStatus(), data.juminCollectionGround(),
                    data.provisionStatus(), data.provisionConsentStatus(),
                    data.internalPlanStatus(), data.internalPlanCycle());
            return existing;
        }).orElseGet(() -> {
            CompanyProfile newProfile = CompanyProfile.create(user);
            newProfile.update(data.businessType(), data.employeeCount(), data.annualRevenue(),
                    data.personalDataItems(), data.hasPrivacyPolicy(), data.sensitiveDataTypes(),
                    data.collectionMethods(), data.collectionPurposes(), data.delegationStatus(),
                    data.delegateeTypes(), data.overseasTransferStatus(), data.overseasTransferCountry(),
                    data.cctvOperationStatus(), data.systemStatus(), data.encryptionStatus(),
                    data.destructionPolicyStatus(), data.destructionMethods(),
                    data.employmentDocumentRetention(), data.formerEmployeeDestructionTiming(),
                    data.partnerContactDbRegistration(), data.partnerContactRetention(),
                    data.privacyPolicyIncludedItems(), data.delegateeDisclosureStatus(),
                    data.delegateeAuditStatus(), data.delegateeEducationStatus(),
                    data.cloudServerLocation(), data.overseasServerCountry(),
                    data.cctvExternalProvision(), data.cctvAccessControl(),
                    data.encryptedDataItems(), data.accessControlSeparation(),
                    data.retiredAccessRevocation(), data.accessChangeHistoryStatus(),
                    data.cpoStatus(), data.cpoTitle(), data.operatingChannels(), data.privacyPolicyUrl(),
                    data.contractPerType(), data.marketingStatus(), data.marketingConsentType(),
                    data.marketingNightSend(), data.cctvSignageStatus(), data.cctvRange(),
                    data.accessLogStatus(), data.juminCollectionGround(),
                    data.provisionStatus(), data.provisionConsentStatus(),
                    data.internalPlanStatus(), data.internalPlanCycle());
            return profileRepository.save(newProfile);
        });

        profileDiagnosisService.rediagnose(user, profile);
        return profile;
    }
}
