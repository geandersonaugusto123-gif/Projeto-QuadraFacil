package com.projeto.util;

import com.projeto.exception.ValidacaoException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public final class PasswordUtil {
    private static final String ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final String HASH_PREFIX = "pbkdf2_sha256";
    private static final int ITERATIONS = 65536;
    private static final int KEY_LENGTH = 256;
    private static final int SALT_BYTES = 16;
    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordUtil() {
    }

    public static String gerarHash(String senha) {
        ValidationUtil.senhaValida(senha);
        byte[] salt = new byte[SALT_BYTES];
        RANDOM.nextBytes(salt);
        byte[] hash = calcularHash(senha.toCharArray(), salt, ITERATIONS);

        return HASH_PREFIX + "$" + ITERATIONS + "$"
                + Base64.getEncoder().encodeToString(salt) + "$"
                + Base64.getEncoder().encodeToString(hash);
    }

    public static boolean verificarSenha(String senhaDigitada, String senhaArmazenada) {
        if (senhaDigitada == null || senhaArmazenada == null || senhaArmazenada.trim().isEmpty()) {
            return false;
        }

        String[] partes = senhaArmazenada.split("\\$");
        if (partes.length != 4 || !HASH_PREFIX.equals(partes[0])) {
            return false;
        }

        int iterations;
        byte[] salt;
        byte[] hashArmazenado;
        try {
            iterations = Integer.parseInt(partes[1]);
            salt = Base64.getDecoder().decode(partes[2]);
            hashArmazenado = Base64.getDecoder().decode(partes[3]);
        } catch (IllegalArgumentException ex) {
            return false;
        }

        byte[] hashDigitado = calcularHash(senhaDigitada.toCharArray(), salt, iterations);

        return MessageDigest.isEqual(hashArmazenado, hashDigitado);
    }

    private static byte[] calcularHash(char[] senha, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(senha, salt, iterations, KEY_LENGTH);
            SecretKeyFactory factory = SecretKeyFactory.getInstance(ALGORITHM);
            return factory.generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException ex) {
            throw new ValidacaoException("Nao foi possivel processar a senha.");
        }
    }
}
