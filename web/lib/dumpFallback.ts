import fs from 'node:fs';
import path from 'node:path';
import { normalizeBillaHit } from '../../src/scrapers/billa/billa.normalize';
import { normalizeHoferHit } from '../../src/scrapers/hofer/hofer.normalize';
import { normalizeLidlHit } from '../../src/scrapers/lidl/lidl.normalize';
import { normalizeSize } from '../../src/normalizer/sizeNormalizer';
import { isBio } from '../../src/normalizer/productMatcher';
import type { Product, Offer, ProductBadge } from '../../src/types/product';
import type { NormalizedProduct } from '../../src/scrapers/scraperTypes';

let cachedProducts: Product[] | null = null;

function loadAllDumpItems(): NormalizedProduct[] {
    const items: NormalizedProduct[] = [];
    const rootDir = process.cwd();

    // 1. SPAR
    try {
        const sparPath = path.join(rootDir, 'spar_raw_dump.json');
        if (fs.existsSync(sparPath)) {
            const raw = JSON.parse(fs.readFileSync(sparPath, 'utf8'));
            for (const hit of raw) {
                if (hit.name) {
                    const norm = normalizeSize(hit.sizeText, hit.price, hit.basePrice, hit.baseUnit);
                    items.push({
                        chain: 'SPAR',
                        externalId: String(hit.externalId || Math.random()),
                        brand: hit.brand ?? null,
                        name: hit.name,
                        sizeText: hit.sizeText ?? null,
                        price: hit.price ?? null,
                        currency: hit.currency ?? 'EUR',
                        normalizedQuantity: norm.quantity,
                        normalizedUnit: norm.unit,
                        pricePerBase: norm.pricePerBase,
                        productUrl: hit.productUrl ?? 'https://www.spar.at',
                        imageUrl: hit.imageUrl ?? null,
                        badges: hit.badges ?? [],
                        badgeImages: {},
                        categoryPaths: hit.categoryIds ?? [],
                        fetchedAt: hit.fetchedAt ?? new Date().toISOString(),
                        raw: hit,
                    });
                }
            }
        }
    } catch (e) {
        // ignore
    }

    // 2. BILLA
    try {
        const billaPath = path.join(rootDir, 'billa_raw_dump.json');
        if (fs.existsSync(billaPath)) {
            const raw = JSON.parse(fs.readFileSync(billaPath, 'utf8'));
            for (const hit of raw) {
                if (hit.chain) {
                    items.push(hit);
                } else {
                    items.push(normalizeBillaHit(hit));
                }
            }
        }
    } catch (e) {
        // ignore
    }

    // 3. HOFER
    try {
        const hoferCommercePath = path.join(rootDir, 'hofer_raw_dump.json');
        const hoferRokshPath = path.join(rootDir, 'hofer_roksh_bio-gemuse_raw_dump.json');
        const hoferPath = fs.existsSync(hoferCommercePath) ? hoferCommercePath : hoferRokshPath;

        if (fs.existsSync(hoferPath)) {
            const raw = JSON.parse(fs.readFileSync(hoferPath, 'utf8'));
            for (const hit of raw) {
                if (hit.chain) {
                    items.push(hit);
                } else {
                    items.push(normalizeHoferHit(hit));
                }
            }
        }
    } catch (e) {
        // ignore
    }

    // 4. LIDL
    try {
        const lidlPath = path.join(rootDir, 'lidl_raw_dump_food.json');
        if (fs.existsSync(lidlPath)) {
            const raw = JSON.parse(fs.readFileSync(lidlPath, 'utf8'));
            const list = Array.isArray(raw) ? raw : (raw.items ?? []);
            for (const hit of list) {
                if (hit.chain) {
                    items.push(hit);
                } else {
                    items.push(normalizeLidlHit(hit));
                }
            }
        }
    } catch (e) {
        // ignore
    }

    return items;
}

export function getFallbackProducts(): Product[] {
    if (cachedProducts) return cachedProducts;

    const normalizedList = loadAllDumpItems();
    const productMap = new Map<string, Product>();

    normalizedList.forEach((item, index) => {
        const id = `snap-${item.chain.toLowerCase()}-${item.externalId || index}`;
        const offer: Offer = {
            offer_id: id,
            retailer_name: item.chain,
            product_url: item.productUrl,
            price: item.price ?? 0,
            currency: item.currency ?? 'EUR',
            base_price: item.pricePerBase,
            base_unit: item.normalizedUnit === 'g' ? 'kg' : item.normalizedUnit === 'ml' ? 'l' : item.normalizedUnit ?? undefined,
            size_text: item.sizeText,
        };

        const badges: ProductBadge[] = (item.badges ?? []).map((b, bIdx) => ({
            id: `b-${id}-${bIdx}`,
            name: b,
            image_url: item.badgeImages?.[b] ?? null,
        }));

        if (isBio(item.name, item.brand, item.badges) && !badges.some(b => b.name.toLowerCase().includes('bio'))) {
            badges.unshift({
                id: `bio-${id}`,
                name: 'Bio',
                image_url: null,
            });
        }

        const product: Product = {
            id,
            global_name: item.name,
            brand_name: item.brand,
            image_url: item.imageUrl,
            offers: [offer],
            badges,
        };

        productMap.set(id, product);
    });

    cachedProducts = Array.from(productMap.values());
    return cachedProducts;
}

export function queryFallbackProducts(params: {
    q?: string | null;
    retailer?: string | null;
    bio?: boolean;
    sort?: string | null;
    limit?: number;
    offset?: number;
}) {
    let items = getFallbackProducts();

    if (params.q) {
        const q = params.q.toLowerCase().trim();
        items = items.filter(
            p =>
                p.global_name.toLowerCase().includes(q) ||
                (p.brand_name && p.brand_name.toLowerCase().includes(q))
        );
    }

    if (params.retailer && params.retailer !== 'ALL') {
        const ret = params.retailer.toUpperCase();
        items = items.filter(p => p.offers.some(o => o.retailer_name?.toUpperCase() === ret));
    }

    if (params.bio) {
        items = items.filter(p =>
            isBio(p.global_name, p.brand_name, p.badges?.map(b => b.name))
        );
    }

    if (params.sort === 'price_asc') {
        items = items.sort((a, b) => (a.offers[0]?.price ?? 9999) - (b.offers[0]?.price ?? 9999));
    } else if (params.sort === 'price_desc') {
        items = items.sort((a, b) => (b.offers[0]?.price ?? 0) - (a.offers[0]?.price ?? 0));
    } else if (params.sort === 'base_price_asc') {
        items = items.sort((a, b) => (a.offers[0]?.base_price ?? 9999) - (b.offers[0]?.base_price ?? 9999));
    } else if (params.sort === 'name_asc') {
        items = items.sort((a, b) => a.global_name.localeCompare(b.global_name));
    }

    const limit = params.limit ?? 30;
    const offset = params.offset ?? 0;
    const paginated = items.slice(offset, offset + limit);

    return {
        items: paginated,
        total: items.length,
        hasMore: offset + limit < items.length,
        nextOffset: offset + limit < items.length ? offset + limit : null,
        isFallback: true,
    };
}
