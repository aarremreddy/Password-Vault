package com.metasysusa.secvault_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "credentials")
public class Credentials {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uniqueidentifier")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "service_name", nullable = false, length = 150)
    private String serviceName;

    @Column(name = "service_url", nullable = false, length = 300)
    private String serviceUrl;

    @Column(name = "login_name", nullable = false, length = 150)
    private String loginName;

    @Column(name = "secret_ciphertext", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String secretCiphertext;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String keywords;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_datetime", nullable = false, updatable = false)
    private LocalDateTime createdDatetime;

    @UpdateTimestamp
    @Column(name = "updated_datetime", nullable = false)
    private LocalDateTime updatedDatetime;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;
}
