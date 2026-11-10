import { pg } from './pg';
import { logger } from '../utils/logger';

interface DbState {
    available: boolean;
    lastChecked: number;
    lastError: string | null;
    cooldownMs: number;
}

const dbState: DbState = {
    available: true,
    lastChecked: 0,
    lastError: null,
    cooldownMs: 30000, // 30 seconds cooldown before retrying an unreachable DB
};

export function isDbAvailable(): boolean {
    if (process.env.DB_OFFLINE === 'true') {
        return false;
    }

    if (!dbState.available) {
        // If still in cooldown, don't attempt to reconnect yet
        if (Date.now() - dbState.lastChecked < dbState.cooldownMs) {
            return false;
        }
    }

    return true;
}

export function recordDbSuccess(): void {
    dbState.available = true;
    dbState.lastChecked = Date.now();
    dbState.lastError = null;
}

export function recordDbFailure(errorMsg: string): void {
    dbState.available = false;
    dbState.lastChecked = Date.now();
    dbState.lastError = errorMsg;
}

export async function checkDb(timeoutMs: number = 2000): Promise<boolean> {
    if (process.env.DB_OFFLINE === 'true') {
        recordDbFailure('DB_OFFLINE is set to true');
        return false;
    }

    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Connection check timeout')), timeoutMs)
        );

        const queryPromise = pg.query('SELECT 1 AS ok');
        const res: any = await Promise.race([queryPromise, timeoutPromise]);

        if (res.rows[0]?.ok === 1) {
            recordDbSuccess();
            return true;
        }

        recordDbFailure('Unexpected response from database');
        return false;
    } catch (err: any) {
        recordDbFailure(err.message);
        return false;
    }
}
