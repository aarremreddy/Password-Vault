package com.metasys.VaultApplication.Model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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


    @OneToMany(mappedBy = "vaultData", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<KeywordTag> keywordTags;


}
