package com.metasysusa.secvault_backend.repository;

import com.metasysusa.secvault_backend.entity.Credentials;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CredentialsRepository extends JpaRepository<Credentials, Long> {
    List<Credentials> findByUserId(Long userId);
}
