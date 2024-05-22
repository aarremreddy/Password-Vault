package com.metasys.VaultApplication.Repo;

import com.metasys.VaultApplication.Model.VaultData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VaultRepo extends JpaRepository<VaultData, Long> {
}
