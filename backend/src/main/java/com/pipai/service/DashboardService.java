package com.pipai.service;

import com.pipai.domain.RiskChecklistItem;
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

    public record DashboardSummary(Map<String, Long> riskCounts, List<RiskChecklistItem> recentItems) {}

    @Transactional(readOnly = true)
    public DashboardSummary getSummary(UUID userId) {
        List<RiskChecklistItem> items = riskRepository.findByUserIdOrderByLevelAscCreatedAtDesc(userId);
        Map<String, Long> counts = items.stream()
                .collect(Collectors.groupingBy(i -> i.getLevel().name(), Collectors.counting()));
        return new DashboardSummary(counts, items);
    }

    @Transactional(readOnly = true)
    public List<RiskChecklistItem> getRiskItems(UUID userId) {
        return riskRepository.findByUserIdOrderByLevelAscCreatedAtDesc(userId);
    }

    @Transactional
    public RiskChecklistItem resolveItem(UUID itemId, UUID userId) {
        RiskChecklistItem item = riskRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("리스크 항목을 찾을 수 없습니다."));
        if (!item.getUser().getId().equals(userId)) {
            throw new SecurityException("접근 권한이 없습니다.");
        }
        item.resolve();
        return item;
    }
}
