import { NormalizedProduct } from './spar.types.js';

function normalizeValue(v: any): string | null {
    if (v === null || v === undefined) return null;
    return String(v).trim();
}

export type FieldDiff = {
    field: string;
    before: any;
    after: any;
};

export type OfferDiff = {
    changed: boolean;
    fields: FieldDiff[];
};

export function diffOffer(
    existing: any,
    incoming: NormalizedProduct
): OfferDiff {
    if (!existing) {
        return { changed: true, fields: [] };
    }

    const fields: FieldDiff[] = [];

    if (existing.product_url !== incoming.productUrl) {
        fields.push({
            field: 'product_url',
            before: existing.product_url,
            after: incoming.productUrl,
        });
    }

    if (existing.size_text !== incoming.sizeText) {
        fields.push({
            field: 'size_text',
            before: existing.size_text,
            after: incoming.sizeText,
        });
    }

    const existingQty = normalizeValue(existing.unit_quantity);
    const incomingQty = normalizeValue(incoming.normalizedQuantity);

    if (existingQty !== incomingQty) {
        fields.push({
            field: 'unit_quantity',
            before: existingQty,
            after: incomingQty,
        });
    }

    if (existing.unit !== incoming.normalizedUnit) {
        fields.push({
            field: 'unit',
            before: existing.unit,
            after: incoming.normalizedUnit,
        });
    }

    return {
        changed: fields.length > 0,
        fields,
    };
}