package com.metasysusa.secvault_backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CredentialsDTO {
    private UUID id;
    private Long userId;
    private String serviceName;
    private String serviceUrl;
    private String loginName;
    private String keywords;
    private Boolean isDeleted;
    private LocalDateTime createdDatetime;
    private LocalDateTime updatedDatetime;
}
