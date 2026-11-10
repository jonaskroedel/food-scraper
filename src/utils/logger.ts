type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    success: 25,
    warn: 30,
    error: 40,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info';

function shouldLog(level: LogLevel): boolean {
    return (LOG_LEVELS[level] ?? 20) >= (LOG_LEVELS[currentLevel] ?? 20);
}

function timestamp(): string {
    return new Date().toISOString().substring(11, 19);
}

export const logger = {
    debug: (...args: any[]) => {
        if (shouldLog('debug')) {
            console.log(`[${timestamp()}] 🔍 [DEBUG]`, ...args);
        }
    },
    info: (...args: any[]) => {
        if (shouldLog('info')) {
            console.log(`[${timestamp()}] ℹ️ [INFO]`, ...args);
        }
    },
    success: (...args: any[]) => {
        if (shouldLog('success')) {
            console.log(`[${timestamp()}] ✅ [SUCCESS]`, ...args);
        }
    },
    warn: (...args: any[]) => {
        if (shouldLog('warn')) {
            console.warn(`[${timestamp()}] ⚠️ [WARN]`, ...args);
        }
    },
    error: (...args: any[]) => {
        if (shouldLog('error')) {
            console.error(`[${timestamp()}] ❌ [ERROR]`, ...args);
        }
    },
};
