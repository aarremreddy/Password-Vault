package com.metasys.VaultApplication.Controller;

import com.metasys.VaultApplication.Model.AuditDTO;
import com.metasys.VaultApplication.Model.VaultData;
import com.metasys.VaultApplication.Service.AuditService;
import com.metasys.VaultApplication.Service.VaultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/vault")
public class VaultController {

    @Autowired
    private VaultService vaultService;

    @Autowired
    private AuditService auditService;

    @PostMapping
    public VaultData submitVault(@RequestBody VaultData vaultData){
        return vaultService.submitData(vaultData);
    }

    @GetMapping("/all")
    public ResponseEntity<List<VaultData>> getAllEntries() {
        return ResponseEntity.ok(vaultService.getAllEntries());
    }

    @GetMapping("/search")
    public ResponseEntity<List<VaultData>> getEntriesByKeyword(@RequestParam(name = "keyword-tag") String keywordTag) {
        List<VaultData> entries = vaultService.findEntriesByKeywordTag(keywordTag);
        return ResponseEntity.ok(entries);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteVaultData(@PathVariable Long id) {
        vaultService.deleteData(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/update")
    public ResponseEntity<VaultData> upsertVaultEntry(@RequestBody VaultData vaultData) {
        VaultData newVaultData = vaultService.upsertData(vaultData);
        return ResponseEntity.ok(newVaultData);
    }

    @PostMapping("/audit")
    public ResponseEntity<AuditDTO> submitAuditData(@RequestBody AuditDTO auditDTO) {
        AuditDTO savedAuditData = auditService.submitAuditData(auditDTO);
        return ResponseEntity.ok(savedAuditData);
    }
}
