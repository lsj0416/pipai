package com.pipai.service;

import com.pipai.common.exception.ResourceNotFoundException;
import com.pipai.domain.CompanyProfile;
import com.pipai.domain.Conversation;
import com.pipai.domain.InquiryDraft;
import com.pipai.domain.Message;
import com.pipai.domain.User;
import com.pipai.rag.EmbeddingService;
import com.pipai.rag.LlmService;
import com.pipai.rag.VectorSearchService;
import com.pipai.repository.ConversationRepository;
import com.pipai.repository.InquiryDraftRepository;
import com.pipai.repository.MessageRepository;
import com.pipai.repository.ProfileRepository;
import com.pipai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InquiryService {

    private static final String SYSTEM_PROMPT = """
            당신은 개인정보보호법 전문가입니다. 아래 대화 내용을 바탕으로 개인정보보호위원회나 전문 변호사에게 제출할 수 있는 법적 문의글을 작성해주세요.

            다음 형식을 정확히 따르세요:

            제목: [문의 제목 — 핵심 이슈를 간결하게]

            [문의 내용 — 사업체 상황, 개인정보 처리 현황, 우려 사항, 질문을 법적 용어로 구조화하여 3~5단락으로 작성]

            관련 법령: [관련 법령 조문을 콤마로 구분하여 나열, 예: 개인정보보호법 제15조, 제17조]
            """;

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final InquiryDraftRepository inquiryDraftRepository;
    private final LlmService llmService;
    private final EmbeddingService embeddingService;
    private final VectorSearchService vectorSearchService;
    private final ProfileRepository profileRepository;

    @Transactional
    public InquiryDraft generate(UUID userId, UUID conversationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("대화를 찾을 수 없습니다."));

        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        if (messages.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "대화 내용이 없어 문의글을 생성할 수 없습니다.");
        }

        String conversationText = buildConversationText(messages);
        String generated = llmService.completeText(SYSTEM_PROMPT,
                "다음 대화를 바탕으로 문의글을 작성해주세요:\n\n" + conversationText).block();

        if (generated == null || generated.isBlank()) {
            generated = "제목: 개인정보보호법 관련 문의\n\n문의 내용을 생성할 수 없습니다. 직접 작성해 주세요.\n\n관련 법령: ";
        }

        String subject = parseSubject(generated);
        String content = parseContent(generated);
        String relatedLaws = parseRelatedLaws(generated);

        String precedent = null;
        try {
            Optional<CompanyProfile> profileOpt = profileRepository.findByUserId(userId);
            String businessType = profileOpt.map(CompanyProfile::getBusinessType).orElse(null);
            float[] vector = embeddingService.embed(conversationText);
            List<Map<String, Object>> cases = vectorSearchService.searchCases(vector, businessType, 1);
            precedent = formatPrecedent(cases);
        } catch (Exception e) {
            log.warn("처분 사례 RAG 검색 실패, precedent=null로 처리: {}", e.getMessage());
        }

        Optional<InquiryDraft> existing = inquiryDraftRepository.findByConversationId(conversationId);
        if (existing.isPresent()) {
            existing.get().updateContent(subject, content, relatedLaws, precedent);
            return inquiryDraftRepository.save(existing.get());
        }

        return inquiryDraftRepository.save(InquiryDraft.create(user, conv, subject, content, relatedLaws, precedent));
    }

    private String buildConversationText(List<Message> messages) {
        StringBuilder sb = new StringBuilder();
        for (Message msg : messages) {
            String role = msg.getRole() == Message.Role.USER ? "사용자" : "AI 어시스턴트";
            sb.append(role).append(": ").append(msg.getContent()).append("\n\n");
        }
        return sb.toString();
    }

    private String parseSubject(String text) {
        if (text == null || text.isBlank()) return "개인정보보호법 관련 문의";
        for (String line : text.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("제목:")) {
                String subject = trimmed.substring(3).trim();
                return subject.isBlank() ? "개인정보보호법 관련 문의" : subject;
            }
        }
        return "개인정보보호법 관련 문의";
    }

    private String parseContent(String text) {
        if (text == null || text.isBlank()) return "";
        String[] lines = text.split("\n");
        StringBuilder sb = new StringBuilder();
        boolean inContent = false;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("제목:")) {
                inContent = true;
                continue;
            }
            if (trimmed.startsWith("관련 법령:")) {
                break;
            }
            if (inContent) {
                sb.append(line).append("\n");
            }
        }
        String result = sb.toString().trim();
        return result.isBlank() ? text : result;
    }

    private String formatPrecedent(List<Map<String, Object>> cases) {
        if (cases == null || cases.isEmpty()) return null;
        Map<String, Object> c = cases.get(0);
        String title = String.valueOf(c.getOrDefault("title", ""));
        String violationType = String.valueOf(c.getOrDefault("violation_type", ""));
        Object fineAmount = c.get("fine_amount");
        if (title.isBlank()) return null;
        StringBuilder sb = new StringBuilder(title);
        if (!violationType.isBlank()) sb.append(" — ").append(violationType);
        if (fineAmount != null) sb.append(", 과징금 ").append(fineAmount).append("원");
        return sb.toString();
    }

    private String parseRelatedLaws(String text) {
        if (text == null || text.isBlank()) return null;
        for (String line : text.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("관련 법령:")) {
                String laws = trimmed.substring(6).trim();
                return laws.isBlank() ? null : laws;
            }
        }
        return null;
    }
}
