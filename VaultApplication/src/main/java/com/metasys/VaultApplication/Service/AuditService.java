package com.metasys.VaultApplication.Service;

import com.metasys.VaultApplication.Model.AuditDTO;
import com.metasys.VaultApplication.Repo.AuditRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    @Autowired
    private AuditRepo auditRepo;

    public AuditDTO submitAuditData(AuditDTO auditData) {
        return auditRepo.save(auditData);
    }
}
