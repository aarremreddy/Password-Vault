package com.metasysusa.secvault_backend.util;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.IvParameterSpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

public class AesEncryptor {
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";

    private final SecretKeySpec secretKey;
    private final SecureRandom secureRandom;

    public AesEncryptor(String base64Key) {
        // Key must be 32 bytes (256-bit) for AES-256
        byte[] decodedKey = Base64.getDecoder().decode(base64Key);
        if (decodedKey.length != 32) {
            throw new IllegalArgumentException("AES-256 key must be exactly 32 bytes");
        }
        this.secretKey = new SecretKeySpec(decodedKey, ALGORITHM);
        this.secureRandom = new SecureRandom();
    }

    public String encrypt(String plainText) throws Exception {
        // Generate random IV for each encryption
        byte[] iv = new byte[16];
        secureRandom.nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);
        byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

        // Prepend IV to encrypted data
        byte[] encryptedWithIv = new byte[iv.length + encrypted.length];
        System.arraycopy(iv, 0, encryptedWithIv, 0, iv.length);
        System.arraycopy(encrypted, 0, encryptedWithIv, iv.length, encrypted.length);

        return Base64.getEncoder().encodeToString(encryptedWithIv);
    }

    public String decrypt(String encryptedBase64) throws Exception {
        byte[] encryptedWithIv = Base64.getDecoder().decode(encryptedBase64);

        // Extract IV from first 16 bytes
        byte[] iv = new byte[16];
        System.arraycopy(encryptedWithIv, 0, iv, 0, 16);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        // Extract encrypted data
        byte[] encrypted = new byte[encryptedWithIv.length - 16];
        System.arraycopy(encryptedWithIv, 16, encrypted, 0, encrypted.length);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);
        byte[] decrypted = cipher.doFinal(encrypted);
        return new String(decrypted, StandardCharsets.UTF_8);
    }
}

