package com.metasysusa.secvault_backend.mapper;

import com.metasysusa.secvault_backend.dto.CredentialsDTO;
import com.metasysusa.secvault_backend.entity.Credentials;

public class CredentialsMapper {

    public static CredentialsDTO toDto(Credentials credentials) {
        CredentialsDTO dto = new CredentialsDTO();
        dto.setUserId(credentials.getUserId());
        dto.setServiceName(credentials.getServiceName());
        dto.setServiceUrl(credentials.getUrl());
        dto.setUserName(credentials.getUserName());
        dto.setKeywords(credentials.getKeywords());
        dto.setPassword(credentials.getPassword());
        return dto;
    }
}
