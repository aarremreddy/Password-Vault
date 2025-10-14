package com.metasysusa.secvault_backend.service;

import com.metasysusa.secvault_backend.dto.CredentialsDTO;
import com.metasysusa.secvault_backend.entity.Credentials;
import com.metasysusa.secvault_backend.mapper.CredentialsMapper;
import com.metasysusa.secvault_backend.repository.CredentialsRepository;
import com.metasysusa.secvault_backend.util.AesEncryptor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CredentialsServiceImpl implements CredentialsService {

    private final CredentialsRepository credentialsRepository;
    private final AesEncryptor encryptor;

    public CredentialsServiceImpl(CredentialsRepository credentialsRepository, AesEncryptor encryptor) {
        this.credentialsRepository = credentialsRepository;
        this.encryptor = encryptor;
    }

    @Override
    public Credentials createCredentials(Credentials credentials) {
        try {
            credentials.setPassword(encryptor.encrypt(credentials.getPassword()));
            credentials.setCreatedBy(credentials.getUserId());
            credentials.setUpdatedBy(credentials.getUserId());
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt password", e);
        }
        return credentialsRepository.save(credentials);
    }

    @Override
    public List<CredentialsDTO> getAllCredentials() {
        return credentialsRepository.findAll()
                .stream()
                .map(CredentialsMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CredentialsDTO> getByUserId(Long userId) {
        return credentialsRepository.findByUserId(userId)
                .stream()
                .map(CredentialsMapper::toDto)
                .toList();
    }

    @Override
    public String decryptPassword(String encryptedPassword) throws Exception {
        return encryptor.decrypt(encryptedPassword);
    }

    @Override
    public List<CredentialsDTO> searchCredentialsByUserId(Long userId, String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getByUserId(userId);
        }
        return credentialsRepository.findByUserIdAndSearchTerm(userId, searchTerm.trim())
                .stream()
                .map(CredentialsMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteCredential(Long id, Long userId) {
        Credentials credential = credentialsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Credential not found"));

        if (!credential.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this credential");
        }

        credential.setIsDeleted(true);
        credential.setUpdatedBy(userId);
        credentialsRepository.save(credential);
    }

    @Override
    public Credentials updateCredential(Long id, Credentials updatedCredentials) {
        Credentials existing = credentialsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Credential not found"));

        if (!existing.getUserId().equals(updatedCredentials.getUserId())) {
            throw new RuntimeException("Unauthorized to update this credential");
        }

        try {
            // Update fields only if provided, otherwise keep existing
            if (updatedCredentials.getServiceName() != null) {
                existing.setServiceName(updatedCredentials.getServiceName());
            }
            if (updatedCredentials.getUrl() != null) {
                existing.setUrl(updatedCredentials.getUrl());
            }
            if (updatedCredentials.getUserName() != null) {
                existing.setUserName(updatedCredentials.getUserName());
            }
            if (updatedCredentials.getKeywords() != null) {
                existing.setKeywords(updatedCredentials.getKeywords());
            }

            // Only update password if provided, otherwise keep existing
            if (updatedCredentials.getPassword() != null && !updatedCredentials.getPassword().trim().isEmpty()) {
                existing.setPassword(encryptor.encrypt(updatedCredentials.getPassword()));
            }

            existing.setUpdatedBy(updatedCredentials.getUserId());

            return credentialsRepository.save(existing);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt password", e);
        }
    }

}
