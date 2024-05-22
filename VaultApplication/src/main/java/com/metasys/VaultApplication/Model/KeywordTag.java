package com.metasys.VaultApplication.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "VAULT_KEYWORD_TAGS")
public class KeywordTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String keywordTag;

    @ManyToOne
    @JoinColumn(name = "User_Id")
    private VaultData vaultData;
}
