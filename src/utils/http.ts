import { sleep } from './sleep';
import { logger } from './logger';

export interface RequestOptions extends RequestInit {
    retries?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
}

const DEFAULT_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function fetchWithRetry(url: string, options: RequestOptions = {}): Promise<Response> {
    const {
        retries = 5,
        retryDelayMs = 1000,
        timeoutMs = 15000,
        headers,
        ...rest
    } = options;

    const mergedHeaders = {
        'User-Agent': DEFAULT_USER_AGENT,
        'Accept-Language': 'de-AT,de;q=0.9,en-US;q=0.8,en;q=0.7',
        ...headers,
    };

    let attempt = 0;
    while (attempt <= retries) {
        attempt++;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(url, {
                ...rest,
                headers: mergedHeaders,
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (res.ok) {
                return res;
            }

            // Retry on rate limit (429) or server errors (5xx)
            if ([429, 500, 502, 503, 504].includes(res.status) && attempt <= retries) {
                let waitTime = retryDelayMs * Math.pow(2, attempt - 1);

                if (res.status === 429) {
                    const retryHeader = res.headers.get('retry-after');
                    if (retryHeader) {
                        const seconds = parseInt(retryHeader, 10);
                        if (!isNaN(seconds)) {
                            waitTime = (seconds + 1) * 1000;
                        }
                    } else {
                        // Default backoff on 429 if no header provided
                        waitTime = Math.max(10000, waitTime * 4);
                    }
                    logger.warn(`⏳ Rate Limit (HTTP 429) erreicht. Server verlangt Pause: Warte ${Math.round(waitTime / 1000)}s vor nächstem Versuch (Versuch ${attempt}/${retries})...`);
                } else {
                    logger.warn(`HTTP ${res.status} für ${url}. Wiederhole in ${waitTime}ms (Versuch ${attempt}/${retries})...`);
                }

                await sleep(waitTime);
                continue;
            }

            return res;
        } catch (err: any) {
            clearTimeout(timeout);
            if (attempt <= retries) {
                const waitTime = retryDelayMs * Math.pow(2, attempt - 1);
                logger.warn(`Fetch error for ${url}: ${err.message}. Retrying in ${waitTime}ms...`);
                await sleep(waitTime);
                continue;
            }
            throw err;
        }
    }

    throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

export async function fetchJson<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const res = await fetchWithRetry(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText} for ${url}`);
    }

    return (await res.json()) as T;
}
