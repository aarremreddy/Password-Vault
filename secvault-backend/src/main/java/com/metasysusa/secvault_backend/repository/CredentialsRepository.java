package com.metasysusa.secvault_backend.repository;

import com.metasysusa.secvault_backend.entity.Credentials;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CredentialsRepository extends JpaRepository<Credentials, Long> {
    @Query("SELECT c FROM Credentials c WHERE c.userId = :userId AND c.isDeleted = false")
    List<Credentials> findByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM Credentials c WHERE c.userId = :userId AND c.isDeleted = false AND " +
           "(LOWER(c.serviceName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.url) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.userName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.keywords) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Credentials> findByUserIdAndSearchTerm(@Param("userId") Long userId, @Param("searchTerm") String searchTerm);
}
