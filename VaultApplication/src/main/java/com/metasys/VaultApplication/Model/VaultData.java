package com.metasys.VaultApplication.Model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.collection.spi.PersistentList;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "VAULT_ENTRIES")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaultData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "User_Id")
    private long id;
    private String userName;
    private String password;
    private String connectionDetails;
    private String notes;
    @Column(name = "isactive", columnDefinition = "boolean default true")
    private Boolean isActive;

    @OneToMany(mappedBy = "vaultData", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KeywordTag> keywordTags;

    public void setKeywordTags(List<KeywordTag> tags) {
        if (tags instanceof PersistentList<KeywordTag>) {
            this.keywordTags = tags;
        } else {
            if (this.keywordTags == null)
                this.keywordTags = new ArrayList<>();
            this.keywordTags.clear();
            this.keywordTags.addAll(tags);
        }
    }
}
