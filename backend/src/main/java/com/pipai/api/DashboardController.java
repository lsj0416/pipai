package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.domain.RiskChecklistItem;
import com.pipai.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ApiResponse<DashboardService.DashboardSummary> summary(@AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(dashboardService.getSummary(userId));
    }

    @GetMapping("/risks")
    public ApiResponse<List<RiskChecklistItem>> risks(@AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(dashboardService.getRiskItems(userId));
    }

    @PatchMapping("/risks/{id}/resolve")
    public ApiResponse<RiskChecklistItem> resolve(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(dashboardService.resolveItem(id, userId));
    }

    @GetMapping("/growth-scenarios")
    public ApiResponse<List<DashboardService.GrowthScenario>> growthScenarios(
            @AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(dashboardService.getGrowthScenarios(userId));
    }
}
