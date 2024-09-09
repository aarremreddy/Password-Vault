package com.metasys.VaultApplication.Repo;

import com.metasys.VaultApplication.Model.UserDTO;
import com.metasys.VaultApplication.Model.VaultData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginRepo extends JpaRepository<UserDTO, Long> {
    UserDTO findByUsername(String username);
}

