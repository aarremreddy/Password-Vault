package com.metasysusa.secvault_backend.config;

import com.metasysusa.secvault_backend.util.AesEncryptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CryptoConfig {

    @Bean
    public AesEncryptor aesEncryptor() {
        String envKey = System.getenv("SEC_VAULT_SECRET_KEY");
        if (envKey == null) {
            throw new IllegalStateException("SEC_VAULT_SECRET_KEY not set in environment!");
        }
        return new AesEncryptor(envKey);
    }
}
