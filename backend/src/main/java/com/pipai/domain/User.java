package com.pipai.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(of = {"id", "email", "name"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String title;

    @Column(length = 20)
    private String contactPhone;

    @Column(nullable = false)
    private boolean termsService = false;

    @Column(nullable = false)
    private boolean termsPrivacy = false;

    @Column(nullable = false)
    private boolean termsMarketing = false;

    @Column(nullable = false)
    private boolean termsAiUsage = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static User create(String email, String encodedPassword, String name,
                              String title, String contactPhone,
                              boolean termsService, boolean termsPrivacy,
                              boolean termsMarketing, boolean termsAiUsage) {
        User user = new User();
        user.email = email;
        user.password = encodedPassword;
        user.name = name;
        user.title = title;
        user.contactPhone = contactPhone;
        user.termsService = termsService;
        user.termsPrivacy = termsPrivacy;
        user.termsMarketing = termsMarketing;
        user.termsAiUsage = termsAiUsage;
        return user;
    }
}
