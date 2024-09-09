package com.metasys.VaultApplication.Repo;

import com.metasys.VaultApplication.Model.VaultData;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VaultRepo extends JpaRepository<VaultData, Long> {
    @Modifying
    @Query(value = "UPDATE vault_entries SET isactive = 0 where user_id = :id", nativeQuery = true)
    void setIsActiveById(@Param("id") long id);

    @Query(value = "SELECT ve.connection_details, ve.notes, ve.user_name, ve.isactive, ve.user_id, ve.password FROM vault_entries ve WHERE ve.user_id IN :userIds", nativeQuery = true)
    List<Object[]> findEntriesByUserId(@Param("userIds") List<Long> userIds);

    @Transactional
    default VaultData updateOrInsert(VaultData vaultData) {
        return save(vaultData);
    }
}
