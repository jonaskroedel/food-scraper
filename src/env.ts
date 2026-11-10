import 'dotenv/config';

export const ENV = {
    nodeEnv: process.env.NODE_ENV ?? 'development',

    db: {
        connectionString: process.env.DATABASE_URL,
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        name: process.env.DB_NAME ?? 'food_compare',
        user: process.env.DB_USER ?? 'postgres',
        pass: process.env.DB_PASS ?? 'postgres',
        ssl: process.env.DB_SSL === 'true',
    },
};
