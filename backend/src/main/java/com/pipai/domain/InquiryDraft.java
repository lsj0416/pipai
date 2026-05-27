package com.pipai.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inquiry_drafts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InquiryDraft {

    public enum Status { DRAFT, SUBMITTED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    // 관련 법령 목록 (콤마 구분)
    @Column(columnDefinition = "text")
    private String relatedLaws;

    // 유사 처분 사례 (RAG 검색 결과)
    @Column(columnDefinition = "text")
    private String precedent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static InquiryDraft create(User user, Conversation conversation,
                                      String subject, String content, String relatedLaws, String precedent) {
        InquiryDraft draft = new InquiryDraft();
        draft.user = user;
        draft.conversation = conversation;
        draft.subject = subject;
        draft.content = content;
        draft.relatedLaws = relatedLaws;
        draft.precedent = precedent;
        draft.status = Status.DRAFT;
        return draft;
    }

    public void submit() {
        this.status = Status.SUBMITTED;
    }

    public void updateContent(String subject, String content, String relatedLaws, String precedent) {
        this.subject = subject;
        this.content = content;
        this.relatedLaws = relatedLaws;
        this.precedent = precedent;
    }
}
