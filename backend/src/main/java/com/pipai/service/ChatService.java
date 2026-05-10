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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

        messageRepository.save(Message.ofUser(conv, userMessage));

        RagPipeline.RagResult ragResult = ragPipeline.generateAnswer(userMessage, userId);
        String lawRefsJson = buildLawRefsJson(ragResult.lawRefs());
        User user = userRepository.findById(userId).orElse(null);

        StringBuilder accumulator = new StringBuilder();
        List<String> pendingChecklistEvents = new ArrayList<>();

        return ragResult.stream()
                .doOnNext(accumulator::append)
                .doOnComplete(() -> {
                    String fullResponse = accumulator.toString();
                    if (!fullResponse.isBlank()) {
                        messageRepository.save(Message.ofAssistant(conv, fullResponse, lawRefsJson));
                    }
                    if (user != null) {
                        pendingChecklistEvents.addAll(buildChecklistEvents(user, ragResult.lawRefs()));
                    }
                })
                .concatWith(Flux.defer(() -> Flux.fromIterable(pendingChecklistEvents)));
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
