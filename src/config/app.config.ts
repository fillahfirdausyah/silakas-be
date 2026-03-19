export default () => ({
    env: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10) || 8080,
    db: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        name: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
    jwtSecret: process.env.JWT_SECRET,
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        // Short session (rememberMe = false)
        accessExpirationShort: process.env.JWT_ACCESS_EXPIRATION_SHORT || '15m',
        refreshExpirationShort:
            process.env.JWT_REFRESH_EXPIRATION_SHORT || '1h',
        // Long session (rememberMe = true)
        accessExpirationLong: process.env.JWT_ACCESS_EXPIRATION_LONG || '1h',
        refreshExpirationLong: process.env.JWT_REFRESH_EXPIRATION_LONG || '30d',
    },
});
