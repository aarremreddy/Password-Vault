package com.metasysusa.secvault_backend.dto;

import lombok.Data;

@Data
public class CredentialsDTO {
    private Long userId;
    private String serviceName;
    private String url;
    private String userName;
    private String keywords;
    private String password;
}
