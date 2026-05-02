package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.domain.InquiryDraft;
import com.pipai.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/inquiry")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping("/generate/{conversationId}")
    public ApiResponse<InquiryDraft> generate(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(inquiryService.generate(userId, conversationId));
    }
}
