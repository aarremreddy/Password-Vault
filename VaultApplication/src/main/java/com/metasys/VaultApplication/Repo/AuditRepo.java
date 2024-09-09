package com.metasys.VaultApplication.Repo;

import com.metasys.VaultApplication.Model.AuditDTO;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditRepo extends JpaRepository<AuditDTO, Long> { }
