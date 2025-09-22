package com.metasysusa.secvault_backend.repository;

import com.metasysusa.secvault_backend.entity.Credentials;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CredentialsRepository extends JpaRepository<Credentials, UUID> {
    List<Credentials> findByUserId(Long userId);
}
