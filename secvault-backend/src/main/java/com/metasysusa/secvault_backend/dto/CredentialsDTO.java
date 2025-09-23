package com.metasysusa.secvault_backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CredentialsDTO {
    private Long userId;
    private String serviceName;
    private String serviceUrl;
    private String loginName;
    private String keywords;
    private Boolean isDeleted;
    private String password;
    private LocalDateTime createdDatetime;
    private LocalDateTime updatedDatetime;
}
