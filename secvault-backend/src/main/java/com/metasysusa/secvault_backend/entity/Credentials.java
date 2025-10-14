package com.metasysusa.secvault_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "credentials")
public class Credentials {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "service_name", nullable = false, length = 150)
    private String serviceName;

    @Column(name = "url", nullable = false, length = 300)
    private String url;

    @Column(name = "user_name", nullable = false, length = 150)
    private String userName;

    @Column(name = "password", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String password;

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
