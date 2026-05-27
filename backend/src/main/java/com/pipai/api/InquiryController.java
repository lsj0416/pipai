package com.pipai.api;

import com.pipai.common.ApiResponse;
import com.pipai.domain.InquiryDraft;
import com.pipai.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inquiry")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    record UpdateRequest(String subject, String content) {}

    @PostMapping("/generate/{conversationId}")
    public ApiResponse<InquiryDraft> generate(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(inquiryService.generate(userId, conversationId));
    }

    @GetMapping("/list")
    public ApiResponse<List<InquiryDraft>> list(@AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(inquiryService.listByUser(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<InquiryDraft> get(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(inquiryService.getById(userId, id));
    }

    @PutMapping("/{id}")
    public ApiResponse<InquiryDraft> update(
            @PathVariable UUID id,
            @RequestBody UpdateRequest req,
            @AuthenticationPrincipal UUID userId) {
        return ApiResponse.ok(inquiryService.update(userId, id, req.subject(), req.content()));
    }
}
