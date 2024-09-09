package com.metasys.VaultApplication.Service;

import com.metasys.VaultApplication.Model.KeywordTag;
import com.metasys.VaultApplication.Model.VaultData;
import com.metasys.VaultApplication.Repo.KeywordRepo;
import com.metasys.VaultApplication.Repo.VaultRepo;
import jakarta.transaction.Transactional;
import org.jasypt.encryption.StringEncryptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class VaultService {


    private final VaultRepo repo;
    private final KeywordRepo keywordRepo;
    private final StringEncryptor passwordEncoder;

    @Autowired
    public VaultService(VaultRepo repo, KeywordRepo keywordRepo, StringEncryptor stringEncryptor) {
        this.repo = repo;
        this.keywordRepo = keywordRepo;
        this.passwordEncoder = stringEncryptor;
    }

    @Transactional
    public VaultData submitData(VaultData vaultData){
        String encryptedPassword = passwordEncoder.encrypt(vaultData.getPassword());
        vaultData.setPassword(encryptedPassword);
        vaultData.setIsActive(true);
        List<KeywordTag> keywordTags = vaultData.getKeywordTags();
        if (keywordTags != null) {
            for (KeywordTag tag : keywordTags) {
                tag.setVaultData(vaultData);
            }
        }
        vaultData.setKeywordTags(keywordTags);
        VaultData savedVaultData = repo.updateOrInsert(vaultData);
        return savedVaultData;
    }

    public List<VaultData> getAllEntries() {
        List<VaultData> entries = repo.findAll();
        for (VaultData entry: entries) {
            String plainPassword = passwordEncoder.decrypt(entry.getPassword());
            entry.setPassword(plainPassword);
            List<KeywordTag> keywordTags = new ArrayList<>();
            for (Object[] keywordResult: keywordRepo.findKeywordTagsForUserId(entry.getId())) {
                KeywordTag tag = new KeywordTag();
                tag.setId((long) keywordResult[0]);
                tag.setKeywordTag((String) keywordResult[1]);
                keywordTags.add(tag);
            }
            entry.setKeywordTags(keywordTags);
        }
        return entries;
    }

    @Transactional
    public VaultData upsertData(VaultData vaultData) {
        Optional<VaultData> existingData = repo.findById(vaultData.getId());
        if (existingData.isPresent()) {
            VaultData dataToUpdate = existingData.get();
            if (!vaultData.getPassword().equals(dataToUpdate.getPassword())) {
                String encryptedPassword = passwordEncoder.encrypt(vaultData.getPassword());
                dataToUpdate.setPassword(encryptedPassword);
            }
            dataToUpdate.setIsActive(dataToUpdate.getIsActive());
            dataToUpdate.setNotes(vaultData.getNotes());
            dataToUpdate.setConnectionDetails(vaultData.getConnectionDetails());
            dataToUpdate.setId(vaultData.getId());
            dataToUpdate.setUserName(vaultData.getUserName());
            List<KeywordTag> keywordTags = vaultData.getKeywordTags();
            if (keywordTags != null) {
                for (KeywordTag tag : keywordTags) {
                    tag.setVaultData(dataToUpdate);
                }
            }
            dataToUpdate.setKeywordTags(keywordTags);
            return dataToUpdate;
        } else {
            return submitData(vaultData);
        }
    }

    @Transactional
    public VaultData deleteData(Long id) {
        if (repo.existsById(id)) {
            repo.setIsActiveById(id);
            var vaultData = repo.findById(id);
            return vaultData.get();
        } else {
            throw new IllegalArgumentException("VaultData with ID " + id + " does not exist.");
        }
    }

    public List<VaultData> findEntriesByKeywordTag(String keywordTag) {
        List<Long> userIds = keywordRepo.findUserIdsByKeywordTag(keywordTag);

        if (userIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Object[]> results = repo.findEntriesByUserId(userIds);

        List<VaultData> entries = new ArrayList<>();
        for (Object[] result : results) {
            VaultData entry = new VaultData();
            entry.setConnectionDetails((String) result[0]);
            entry.setNotes((String) result[1]);
            entry.setUserName((String) result[2]);
            entry.setIsActive((Boolean) result[3]);
            entry.setId((long) result[4]);
            String plainPassword = passwordEncoder.decrypt((String)result[5]);
            entry.setPassword(plainPassword);
            List<KeywordTag> keywordTags = new ArrayList<>();
            for (Object[] keywordResult: keywordRepo.findKeywordTagsForUserId(entry.getId())) {
                KeywordTag tag = new KeywordTag();
                tag.setId((long) keywordResult[0]);
                tag.setKeywordTag((String) keywordResult[1]);
                keywordTags.add(tag);
            }
            entry.setKeywordTags(keywordTags);
            entries.add(entry);
        }

        return entries;
    }
}



