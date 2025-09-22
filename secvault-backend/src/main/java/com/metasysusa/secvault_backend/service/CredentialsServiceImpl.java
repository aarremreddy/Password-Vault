package com.metasysusa.secvault_backend.service;

import com.metasysusa.secvault_backend.dto.CredentialsDTO;
import com.metasysusa.secvault_backend.entity.Credentials;
import com.metasysusa.secvault_backend.mapper.CredentialsMapper;
import com.metasysusa.secvault_backend.repository.CredentialsRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CredentialsServiceImpl implements CredentialsService {

    private final CredentialsRepository credentialsRepository;

    public CredentialsServiceImpl(CredentialsRepository credentialsRepository) {
        this.credentialsRepository = credentialsRepository;
    }

    @Override
    public Credentials createCredentials(Credentials credentials) {
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

}
