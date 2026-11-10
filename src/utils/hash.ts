import crypto from 'node:crypto';

export function md5(data: string | Buffer | object): string {
    const str = typeof data === 'object' && !Buffer.isBuffer(data) ? JSON.stringify(data) : data;
    return crypto.createHash('md5').update(str).digest('hex');
}

export function sha256(data: string | Buffer | object): string {
    const str = typeof data === 'object' && !Buffer.isBuffer(data) ? JSON.stringify(data) : data;
    return crypto.createHash('sha256').update(str).digest('hex');
}

export function createProductFingerprint(brand: string | null | undefined, name: string): string {
    const b = (brand ?? '').trim().toLowerCase();
    const n = name.trim().toLowerCase().replace(/\s+/g, ' ');
    return sha256(`${b}:::${n}`);
}
