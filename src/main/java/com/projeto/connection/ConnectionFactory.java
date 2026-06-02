package com.projeto.connection;

import com.projeto.exception.BancoDadosException;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public final class ConnectionFactory {
    private static final Properties PROPERTIES = carregarProperties();

    private ConnectionFactory() {
    }

    static {
        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException ex) {
            throw new BancoDadosException("Driver JDBC do PostgreSQL nao encontrado.", ex);
        }
    }

    public static Connection getConnection() {
        try {
            return DriverManager.getConnection(getUrl(), getUser(), getPassword());
        } catch (SQLException ex) {
            throw new BancoDadosException("Nao foi possivel conectar ao banco de dados.", ex);
        }
    }

    private static Properties carregarProperties() {
        Properties properties = new Properties();
        try (InputStream input = ConnectionFactory.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (IOException ex) {
            throw new BancoDadosException("Nao foi possivel ler o arquivo db.properties.", ex);
        }
        return properties;
    }

    private static String getUrl() {
        return getConfig("db.url", "AGENDAMENTO_DB_URL", "agendamento.db.url");
    }

    private static String getUser() {
        return getConfig("db.user", "AGENDAMENTO_DB_USER", "agendamento.db.user");
    }

    private static String getPassword() {
        return getConfig("db.password", "AGENDAMENTO_DB_PASSWORD", "agendamento.db.password");
    }

    private static String getConfig(String propertyKey, String envKey, String systemKey) {
        String systemValue = System.getProperty(systemKey);
        if (systemValue != null && !systemValue.trim().isEmpty()) {
            return systemValue;
        }

        String envValue = System.getenv(envKey);
        if (envValue != null && !envValue.trim().isEmpty()) {
            return envValue;
        }

        return PROPERTIES.getProperty(propertyKey);
    }
}
