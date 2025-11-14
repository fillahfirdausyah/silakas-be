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
});
