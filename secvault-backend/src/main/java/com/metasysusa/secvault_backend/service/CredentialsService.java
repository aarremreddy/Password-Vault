package com.metasysusa.secvault_backend.service;

import com.metasysusa.secvault_backend.dto.CredentialsDTO;
import com.metasysusa.secvault_backend.entity.Credentials;
import java.util.List;

public interface CredentialsService {
    Credentials createCredentials(Credentials credentials);
    List<CredentialsDTO> getAllCredentials();
    List<CredentialsDTO> getByUserId(Long userId);
}
