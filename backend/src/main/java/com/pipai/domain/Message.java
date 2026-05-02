package com.pipai.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Message {

    public enum Role { USER, ASSISTANT }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    // RAG 참조 법령 조문 (JSON 직렬화)
    @Column(columnDefinition = "text")
    private String lawReferences;

    // AI 면책 문구 포함 여부
    @Column(nullable = false)
    private boolean disclaimerIncluded;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public static Message ofUser(Conversation conversation, String content) {
        Message msg = new Message();
        msg.conversation = conversation;
        msg.role = Role.USER;
        msg.content = content;
        msg.disclaimerIncluded = false;
        return msg;
    }

    public static Message ofAssistant(Conversation conversation, String content, String lawReferences) {
        Message msg = new Message();
        msg.conversation = conversation;
        msg.role = Role.ASSISTANT;
        msg.content = content;
        msg.lawReferences = lawReferences;
        msg.disclaimerIncluded = true;
        return msg;
    }
}
