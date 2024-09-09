package com.metasys.VaultApplication.Service;

import com.metasys.VaultApplication.Model.UserDTO;
import com.metasys.VaultApplication.Repo.LoginRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;


@Service
public class PasswordHasher {

    @Autowired
    private LoginRepo userRepository;

    private BCryptPasswordEncoder passwordEncoder;

    public void hashPasswordsInDatabase() {
        // Retrieve all users from the database
        Iterable<UserDTO> users = userRepository.findAll();

        // Iterate over each user and hash their password
        for (UserDTO user : users) {
            String hashedPassword = passwordEncoder.encode(user.getPassword());
            user.setPassword(hashedPassword);
            userRepository.save(user); // Update the user record with the hashed password
        }
    }
}
