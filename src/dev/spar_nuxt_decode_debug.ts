import fs from 'fs';

const FILE = 'spar_lebensmittel_page1.html';

function loadNuxtState(): any[] {
    const html = fs.readFileSync(FILE, 'utf-8');
    const match = html.match(
        /<script[^>]+type="application\/json"[^>]*data-nuxt-data[^>]*>([\s\S]*?)<\/script>/
    );

    if (!match) throw new Error('Nuxt JSON not found');

    return JSON.parse(match[1]);
}

// Auflösen von Referenzen
function resolve(node: any, state: any[], depth = 0): any {
    if (depth > 5) return '[MaxDepth]';

    if (typeof node === 'number' && state[node] !== undefined) {
        return resolve(state[node], state, depth + 1);
    }

    if (Array.isArray(node)) {
        return node.map(v => resolve(v, state, depth + 1));
    }

    if (node && typeof node === 'object') {
        const out: any = {};
        for (const [k, v] of Object.entries(node)) {
            out[k] = resolve(v, state, depth + 1);
        }
        return out;
    }

    return node;
}

const nuxtState = loadNuxtState();

console.log('▶ Decoding top-level entries…\n');

// wir schauen uns gezielt state + data an
const rootObject = nuxtState[1]; // { data, state, once, ... }

for (const key of ['data', 'state']) {
    const idx = rootObject[key];
    if (typeof idx === 'number') {
        console.log(`\n===== DECODED ${key.toUpperCase()} =====`);
        const decoded = resolve(nuxtState[idx], nuxtState);
        console.dir(decoded, { depth: 6, maxArrayLength: 20 });
    }
}
