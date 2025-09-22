package com.metasysusa.secvault_backend.mapper;

import com.metasysusa.secvault_backend.dto.CredentialsDTO;
import com.metasysusa.secvault_backend.entity.Credentials;

public class CredentialsMapper {

    public static CredentialsDTO toDto(Credentials credentials) {
        CredentialsDTO dto = new CredentialsDTO();
        dto.setId(credentials.getId());
        dto.setUserId(credentials.getUserId());
        dto.setServiceName(credentials.getServiceName());
        dto.setServiceUrl(credentials.getServiceUrl());
        dto.setLoginName(credentials.getLoginName());
        dto.setKeywords(credentials.getKeywords());
        dto.setIsDeleted(credentials.getIsDeleted());
        dto.setCreatedDatetime(credentials.getCreatedDatetime());
        dto.setUpdatedDatetime(credentials.getUpdatedDatetime());
        return dto;
    }
}
