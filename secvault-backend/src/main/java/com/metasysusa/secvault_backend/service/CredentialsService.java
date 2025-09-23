package com.metasysusa.secvault_backend.service;

import com.metasysusa.secvault_backend.dto.CredentialsDTO;
import com.metasysusa.secvault_backend.entity.Credentials;
import java.util.List;

public interface CredentialsService {
    Credentials createCredentials(Credentials credentials);
    List<CredentialsDTO> getAllCredentials();
    List<CredentialsDTO> getByUserId(Long userId);
    String decryptPassword(String encryptedPassword) throws Exception;
    List<CredentialsDTO> searchCredentialsByUserId(Long userId, String searchTerm);
    void deleteCredential(Long id, Long userId);
    Credentials updateCredential(Long id, Credentials credentials);
}
