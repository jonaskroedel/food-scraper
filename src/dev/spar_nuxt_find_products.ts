import fs from 'fs';

const FILE = 'spar_lebensmittel_page1.html';

function loadNuxtState(): any {
    const html = fs.readFileSync(FILE, 'utf-8');
    const match = html.match(
        /<script[^>]+type="application\/json"[^>]*data-nuxt-data[^>]*>([\s\S]*?)<\/script>/
    );

    if (!match) {
        throw new Error('Nuxt JSON not found');
    }

    return JSON.parse(match[1]);
}

// rekursive Suche
function findProductLikeObjects(node: any, path: string[] = []) {
    if (!node || typeof node !== 'object') return;

    if (
        node.name &&
        (node.price || node.prices || node.unitPrice || node.badges)
    ) {
        console.log('🟢 PRODUCT CANDIDATE FOUND');
        console.log('Path:', path.join('.'));
        console.dir(node, { depth: 3 });
        console.log('-----------------------------------');
    }

    if (Array.isArray(node)) {
        node.forEach((v, i) => findProductLikeObjects(v, [...path, `[${i}]`]));
    } else {
        for (const key of Object.keys(node)) {
            findProductLikeObjects(node[key], [...path, key]);
        }
    }
}

const nuxtState = loadNuxtState();

console.log('▶ Searching for product-like objects…');
findProductLikeObjects(nuxtState);
