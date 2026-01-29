import 'dotenv/config';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`❌ Missing required env var: ${name}`);
    }
    return value;
}

export const ENV = {
    nodeEnv: process.env.NODE_ENV ?? 'development',

    db: {
        host: requireEnv('DB_HOST'),
        port: Number(process.env.DB_PORT ?? 5432),
        name: requireEnv('DB_NAME'),
        user: requireEnv('DB_USER'),
        pass: requireEnv('DB_PASS'),
        ssl: process.env.DB_SSL === 'true',
    },
};