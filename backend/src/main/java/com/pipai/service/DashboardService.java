package com.pipai.service;

import com.pipai.api.dto.DashboardRiskItemDto;
import com.pipai.domain.CompanyProfile;
import com.pipai.domain.RiskChecklistItem;
import com.pipai.repository.ProfileRepository;
import com.pipai.repository.RiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final RiskRepository riskRepository;
    private final ProfileRepository profileRepository;

    private static final List<String> PROFILE_CODES = List.of(
            "B-01", "B-02", "B-03", "B-04", "B-05", "B-06", "B-07", "B-08", "B-09", "B-10", "B-11",
            "A-02", "A-04", "A-05", "A-06", "A-07", "A-08", "A-09", "A-11", "A-13",
            "A-14", "A-16", "A-17", "A-19", "A-20", "A-21", "A-22", "A-25"
    );

    public record DashboardSummary(Map<String, Long> riskCounts, List<DashboardRiskItemDto> recentItems, boolean profileReady) {}
    public record GrowthRowData(String title, String law, String severity, boolean applies) {}
    public record GrowthScenario(String id, String label, List<GrowthRowData> rows) {}

    @Transactional(readOnly = true)
    public DashboardSummary getSummary(UUID userId) {
        CompanyProfile profile = profileRepository.findByUserId(userId).orElse(null);
        List<RiskChecklistItem> items = getVisibleItems(userId);
        Map<String, Long> counts = items.stream()
                .filter(item -> !item.isResolved() && item.getLevel() != RiskChecklistItem.RiskLevel.EXEMPT)
                .collect(Collectors.groupingBy(i -> i.getLevel().name(), Collectors.counting()));
        return new DashboardSummary(
                counts,
                items.stream().map(DashboardRiskItemDto::from).toList(),
                profile != null && profile.isDiagnosisReady()
        );
    }

    @Transactional(readOnly = true)
    public List<DashboardRiskItemDto> getRiskItems(UUID userId) {
        return getVisibleItems(userId).stream().map(DashboardRiskItemDto::from).toList();
    }

    @Transactional
    public DashboardRiskItemDto resolveItem(UUID itemId, UUID userId) {
        RiskChecklistItem item = riskRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("리스크 항목을 찾을 수 없습니다."));
        if (!item.getUser().getId().equals(userId)) {
            throw new SecurityException("접근 권한이 없습니다.");
        }
        item.resolve();
        return DashboardRiskItemDto.from(item);
    }

    @Transactional(readOnly = true)
    public List<GrowthScenario> getGrowthScenarios(UUID userId) {
        CompanyProfile profile = profileRepository.findByUserId(userId).orElse(null);
        Integer empCount = profile != null ? profile.getEmployeeCount() : null;
        String revenue = (profile != null && profile.getAnnualRevenue() != null)
                ? profile.getAnnualRevenue() : "";

        boolean emp10Reached = empCount != null && empCount >= 10;
        boolean highRevenue = revenue.contains("10억") && !revenue.contains("10억 미만")
                || revenue.contains("50억") || revenue.contains("100억") || revenue.contains("이상");

        return List.of(
                new GrowthScenario("emp10", "직원 10명 초과 시", List.of(
                        new GrowthRowData("개인정보보호책임자(CPO) 지정",
                                "개인정보보호법 제31조", "medium", true),
                        new GrowthRowData("내부관리계획 수립",
                                "개인정보보호법 제29조", "medium", true),
                        new GrowthRowData("개인정보 영향평가",
                                "개인정보보호법 제33조", "safe",
                                emp10Reached && empCount >= 10000)
                )),
                new GrowthScenario("rev1b", "매출 10억 초과 시", List.of(
                        new GrowthRowData("개인정보보호 인증(ISMS-P) 검토",
                                "정보통신망법 제47조의3", "medium", !highRevenue),
                        new GrowthRowData("연 1회 이상 임직원 교육",
                                "개인정보보호법 제28조", "medium", true)
                ))
        );
    }

    private List<RiskChecklistItem> getVisibleItems(UUID userId) {
        return riskRepository.findByUserIdOrderByLevelAscCreatedAtDesc(userId).stream()
                .filter(item -> item.getSourceType() == RiskChecklistItem.SourceType.CHAT
                        || PROFILE_CODES.contains(item.getDiagnosisCode()))
                .toList();
    }
}
