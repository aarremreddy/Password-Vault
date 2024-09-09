package com.metasys.VaultApplication.Controller;

import com.metasys.VaultApplication.Model.UserDTO;
import com.metasys.VaultApplication.Repo.LoginRepo;
import org.apache.catalina.User;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoginController {

    @Autowired
    private LoginRepo userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<String> login(@Validated @RequestBody UserDTO user) {
        UserDTO storedUser = userRepository.findByUsername(user.getUsername());

        if (storedUser != null && passwordEncoder.matches(user.getPassword(), storedUser.getPassword())) {
            return ResponseEntity.ok("Login successful");
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }
    }

    @GetMapping("temp")
    public String temp() {
        return "Hellu";
    }
}
