package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.external.LawApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/laws")
@RequiredArgsConstructor
public class LawController {

    private final LawApiClient lawApiClient;

    @GetMapping("/search")
    public ApiResponse<List<LawApiClient.LawChunk>> search(@RequestParam String query) {
        return ApiResponse.ok(lawApiClient.searchLaws(query));
    }
}
