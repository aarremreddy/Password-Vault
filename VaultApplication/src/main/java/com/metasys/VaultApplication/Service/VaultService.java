package com.metasys.VaultApplication.Service;

import com.metasys.VaultApplication.Model.KeywordTag;
import com.metasys.VaultApplication.Model.VaultData;
import com.metasys.VaultApplication.Repo.VaultRepo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VaultService {

    @Autowired
    private VaultRepo repo;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    @Transactional
    public VaultData submitData(VaultData vaultData){
        String encryptedPassword = passwordEncoder.encode(vaultData.getPassword());

        vaultData.setPassword(encryptedPassword);

        VaultData savedVaultData = repo.save(vaultData);

        List<KeywordTag> keywordTags = savedVaultData.getKeywordTags();
        if (keywordTags != null) {
            for (KeywordTag tag : keywordTags) {
                tag.setVaultData(savedVaultData);
            }
        }

        return savedVaultData;
    }


}
