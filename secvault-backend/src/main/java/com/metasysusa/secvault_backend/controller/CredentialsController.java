package com.metasysusa.secvault_backend.controller;

import com.metasysusa.secvault_backend.dto.CredentialsDTO;
import com.metasysusa.secvault_backend.entity.Credentials;
import com.metasysusa.secvault_backend.service.CredentialsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credentials")
public class CredentialsController {

    private final CredentialsService credentialsService;

    public CredentialsController(CredentialsService credentialsService) {
        this.credentialsService = credentialsService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Credentials credentials) {
        try {
            credentialsService.createCredentials(credentials);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Create failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<CredentialsDTO>> getAll() {
        List<CredentialsDTO> all = credentialsService.getAllCredentials();
        if (all != null && !all.isEmpty()) {
            return new ResponseEntity<>(all, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CredentialsDTO>> getByUserId(@PathVariable Long userId) {
        if (userId == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        List<CredentialsDTO> creds = credentialsService.getByUserId(userId);
        if (creds.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(creds, HttpStatus.OK);
    }

    @PostMapping("/decrypt-password")
    public ResponseEntity<?> decryptPassword(@RequestBody String encryptedPassword) {
        try {
            String decryptedPassword = credentialsService.decryptPassword(encryptedPassword);
            return ResponseEntity.ok(decryptedPassword);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Decrypt failed: " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }


}
