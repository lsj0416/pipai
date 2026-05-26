package com.pipai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pipai.common.exception.ResourceNotFoundException;
import com.pipai.domain.Conversation;
import com.pipai.domain.Message;
import com.pipai.domain.RiskChecklistItem;
import com.pipai.domain.User;
import com.pipai.rag.RagPipeline;
import com.pipai.repository.ConversationRepository;
import com.pipai.repository.MessageRepository;
import com.pipai.repository.RiskRepository;
import com.pipai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final RagPipeline ragPipeline;
    private final RiskRepository riskRepository;
    private final ObjectMapper objectMapper;
    private final ProfileService profileService;

    private static final int MAX_HISTORY = 20;

    private static final Pattern EMP_PATTERN = Pattern.compile(
            "(?:직원|사원|임직원|알바(?:생)?)\\s*(\\d+)\\s*명|" +
            "(\\d+)\\s*명\\s*(?:의)?\\s*(?:직원|사원|임직원|알바(?:생)?)|" +
            "(?:총|약)?\\s*(\\d+)\\s*명\\s*(?:규모|정도|남짓)"
    );

    private static final Map<String, String> BIZ_KEYWORDS = Map.ofEntries(
            Map.entry("음식점", "음식점업"), Map.entry("식당", "음식점업"),
            Map.entry("카페", "음식점업"), Map.entry("커피전문점", "음식점업"),
            Map.entry("제조업", "제조업"), Map.entry("공장", "제조업"),
            Map.entry("소프트웨어", "정보통신업"), Map.entry("앱개발", "정보통신업"),
            Map.entry("병원", "보건업·사회복지서비스업"), Map.entry("의원", "보건업·사회복지서비스업"),
            Map.entry("약국", "보건업·사회복지서비스업"),
            Map.entry("학원", "교육서비스업"),
            Map.entry("쇼핑몰", "소매업"), Map.entry("온라인쇼핑", "소매업"),
            Map.entry("마트", "소매업"), Map.entry("편의점", "소매업"),
            Map.entry("부동산", "부동산업"),
            Map.entry("호텔", "숙박업"), Map.entry("숙박업", "숙박업"),
            Map.entry("보험", "금융업·보험업"), Map.entry("금융업", "금융업·보험업")
    );

    @Transactional(readOnly = true)
    public List<Conversation> listConversations(UUID userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Transactional
    public Conversation createConversation(UUID userId, String title) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        return conversationRepository.save(Conversation.create(user, title));
    }

    @Transactional
    public void deleteConversation(UUID conversationId, UUID userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("대화를 찾을 수 없습니다."));
        if (!conv.getUser().getId().equals(userId)) {
            throw new SecurityException("접근 권한이 없습니다.");
        }
        conversationRepository.delete(conv);
    }

    @Transactional(readOnly = true)
    public List<Message> getMessages(UUID conversationId, UUID userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("대화를 찾을 수 없습니다."));
        if (!conv.getUser().getId().equals(userId)) {
            throw new SecurityException("접근 권한이 없습니다.");
        }
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public Flux<String> sendMessage(UUID conversationId, UUID userId, String userMessage) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("대화를 찾을 수 없습니다."));
        if (!conv.getUser().getId().equals(userId)) {
            throw new SecurityException("접근 권한이 없습니다.");
        }

        // 현재 메시지 저장 전에 이력 조회 (중복 포함 방지)
        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        boolean isFirstMessage = history.isEmpty();
        if (history.size() > MAX_HISTORY) {
            history = history.subList(history.size() - MAX_HISTORY, history.size());
        }

        messageRepository.save(Message.ofUser(conv, userMessage));

        RagPipeline.RagResult ragResult = ragPipeline.generateAnswer(userMessage, userId, history);
        String lawRefsJson = buildLawRefsJson(ragResult.lawRefs());
        User user = userRepository.findById(userId).orElse(null);

        StringBuilder accumulator = new StringBuilder();
        List<String> pendingChecklistEvents = new ArrayList<>();
        List<String> pendingProfileEvents = new ArrayList<>();

        return ragResult.stream()
                .doOnNext(accumulator::append)
                .doOnComplete(() -> {
                    String fullResponse = accumulator.toString();
                    if (!fullResponse.isBlank()) {
                        messageRepository.save(Message.ofAssistant(conv, fullResponse, lawRefsJson));
                        appendHiddenMemoAsync(userId, userMessage, fullResponse);
                        if (isFirstMessage) {
                            generateTitleAsync(conversationId, userMessage);
                        }
                    }
                    if (user != null) {
                        pendingChecklistEvents.addAll(buildChecklistEvents(user, ragResult.lawRefs()));
                    }
                    pendingProfileEvents.addAll(buildProfileSuggestions(userMessage, userId));
                })
                .concatWith(Flux.defer(() ->
                        Flux.fromIterable(pendingChecklistEvents)
                                .concatWith(Flux.fromIterable(pendingProfileEvents))));
    }

    private void generateTitleAsync(UUID convId, String userMessage) {
        String truncated = userMessage.length() > 200 ? userMessage.substring(0, 200) : userMessage;
        ragPipeline.getLlmService().completeText(
                "사용자의 질문을 보고 대화 제목을 만들어 주세요. 규칙: 15자 이내, 핵심 내용만, 구두점·따옴표·대괄호 없이, 한국어.",
                truncated
        ).subscribe(
                title -> {
                    String trimmed = title.trim().replaceAll("[\"'\\[\\]。.!?\\n]", "").strip();
                    if (!trimmed.isBlank()) {
                        String final_ = trimmed.length() > 30 ? trimmed.substring(0, 30) : trimmed;
                        conversationRepository.updateTitle(convId, final_);
                    }
                },
                e -> log.warn("대화 제목 생성 실패 (convId={}): {}", convId, e.getMessage())
        );
    }

    private void appendHiddenMemoAsync(UUID userId, String userMessage, String assistantResponse) {
        String summaryPrompt = "다음 법률 상담 Q&A를 한 문장으로 요약하세요. 핵심 법적 판단만 포함하세요.\nQ: " + userMessage + "\nA: " + assistantResponse;
        ragPipeline.getLlmService().completeText(summaryPrompt, "한 문장 요약:")
                .subscribe(
                        summary -> profileService.appendHiddenMemo(userId, summary),
                        e -> log.warn("히든 메모 요약 실패 (userId={}): {}", userId, e.getMessage())
                );
    }

    private String buildLawRefsJson(List<Map<String, Object>> lawRefs) {
        if (lawRefs == null || lawRefs.isEmpty()) return null;
        try {
            var refs = lawRefs.stream()
                    .map(law -> Map.of(
                            "articleNo", String.valueOf(law.getOrDefault("article_number", "")),
                            "title", String.valueOf(law.getOrDefault("law_name", "")),
                            "summary", String.valueOf(law.getOrDefault("content", ""))
                    ))
                    .toList();
            return objectMapper.writeValueAsString(refs);
        } catch (Exception e) {
            log.warn("법령 참조 JSON 직렬화 실패", e);
            return null;
        }
    }

    private List<String> buildProfileSuggestions(String userMessage, UUID userId) {
        List<String> events = new ArrayList<>();
        var optProfile = profileService.findProfile(userId);

        // 직원 수 미입력 → 메시지에서 추출
        if (optProfile.isEmpty() || optProfile.get().getEmployeeCount() == null) {
            Matcher m = EMP_PATTERN.matcher(userMessage);
            if (m.find()) {
                String raw = m.group(1) != null ? m.group(1)
                        : m.group(2) != null ? m.group(2) : m.group(3);
                if (raw != null) {
                    String event = buildProfileEvent("employeeCount", "직원 수", raw, raw + "명");
                    if (event != null) events.add(event);
                }
            }
        }

        // 업종 미입력 → 메시지에서 키워드 추출
        boolean bizMissing = optProfile.isEmpty() ||
                optProfile.get().getBusinessType() == null ||
                optProfile.get().getBusinessType().isBlank();
        if (bizMissing) {
            for (var entry : BIZ_KEYWORDS.entrySet()) {
                if (userMessage.contains(entry.getKey())) {
                    String event = buildProfileEvent("businessType", "업종", entry.getValue(), entry.getValue());
                    if (event != null) events.add(event);
                    break;
                }
            }
        }

        return events;
    }

    private String buildProfileEvent(String field, String label, String value, String displayValue) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "type", "profile_suggestion",
                    "content", Map.of(
                            "field", field,
                            "label", label,
                            "value", value,
                            "displayValue", displayValue
                    )
            ));
        } catch (Exception e) {
            log.warn("profile_suggestion 이벤트 직렬화 실패", e);
            return null;
        }
    }

    private List<String> buildChecklistEvents(User user, List<Map<String, Object>> lawRefs) {
        List<String> events = new ArrayList<>();
        for (Map<String, Object> law : lawRefs) {
            String lawName = String.valueOf(law.getOrDefault("law_name", ""));
            String articleNo = String.valueOf(law.getOrDefault("article_number", ""));
            String relatedLaw = (lawName + " " + articleNo).trim();
            if (relatedLaw.isBlank() || "null null".equals(relatedLaw)) continue;
            if (riskRepository.existsByUserIdAndRelatedLaw(user.getId(), relatedLaw)) continue;

            String content = String.valueOf(law.getOrDefault("content", ""));
            String title = lawName + " " + articleNo + " 준수 확인";
            String desc = content.length() > 200 ? content.substring(0, 200) + "..." : content;

            RiskChecklistItem item = RiskChecklistItem.create(
                    user, title, desc, RiskChecklistItem.RiskLevel.CHECK_NEEDED, relatedLaw);
            riskRepository.save(item);

            try {
                String event = objectMapper.writeValueAsString(Map.of(
                        "type", "checklist_update",
                        "content", Map.of("itemId", item.getId().toString(), "status", "CHECK_NEEDED")
                ));
                events.add(event);
            } catch (Exception e) {
                log.warn("체크리스트 업데이트 이벤트 직렬화 실패", e);
            }
        }
        return events;
    }
}
