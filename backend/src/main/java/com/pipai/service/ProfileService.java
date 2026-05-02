package com.pipai.service;

import com.pipai.common.exception.ResourceNotFoundException;
import com.pipai.domain.CompanyProfile;
import com.pipai.domain.User;
import com.pipai.repository.ProfileRepository;
import com.pipai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;

    public record ProfileData(String businessType, Integer employeeCount, String annualRevenue,
                              String personalDataItems, Boolean hasPrivacyPolicy, String sensitiveDataTypes) {}

    @Transactional(readOnly = true)
    public CompanyProfile getProfile(UUID userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("프로필이 존재하지 않습니다."));
    }

    @Transactional
    public CompanyProfile upsertProfile(UUID userId, ProfileData data) {
        return profileRepository.findByUserId(userId).map(profile -> {
            profile.update(data.businessType(), data.employeeCount(), data.annualRevenue(),
                    data.personalDataItems(), data.hasPrivacyPolicy(), data.sensitiveDataTypes());
            return profile;
        }).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
            CompanyProfile profile = CompanyProfile.create(user);
            profile.update(data.businessType(), data.employeeCount(), data.annualRevenue(),
                    data.personalDataItems(), data.hasPrivacyPolicy(), data.sensitiveDataTypes());
            return profileRepository.save(profile);
        });
    }
}
