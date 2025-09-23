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

}
