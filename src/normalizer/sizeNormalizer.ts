export type NormalizedUnit = 'g' | 'kg' | 'ml' | 'l' | 'stk';

export type NormalizedSize = {
    quantity: number | null;
    unit: 'g' | 'ml' | 'stk' | null;
    displayQuantity: number | null;
    displayUnit: string | null;
    pricePerBase: number | null;
    source: 'parsed_size_text' | 'calculated_from_base_price' | null;
};

// Patterns matching sizes like "500g", "1.5 kg", "6 x 0,5l", "10 Stk.", "1 Stück"
const MULTI_PACK_REGEX = /(?:(\d+)\s*x\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|stk|stück|flasche[n]?|dose[n]?|beutel)/i;

export function normalizeSize(
    sizeText?: string | null,
    price?: number | null,
    basePrice?: number | null,
    baseUnit?: string | null
): NormalizedSize {
    // 1️⃣ Try parsing sizeText
    if (sizeText) {
        const cleaned = sizeText.trim().replace(',', '.');
        const match = cleaned.match(MULTI_PACK_REGEX);

        if (match) {
            const multiplier = match[1] ? parseFloat(match[1]) : 1;
            const singleVal = parseFloat(match[2]);
            let totalVal = singleVal * multiplier;
            const rawUnit = match[3].toLowerCase();

            let targetUnit: 'g' | 'ml' | 'stk' = 'stk';
            if (rawUnit === 'kg') {
                totalVal *= 1000;
                targetUnit = 'g';
            } else if (rawUnit === 'g') {
                targetUnit = 'g';
            } else if (rawUnit === 'l') {
                totalVal *= 1000;
                targetUnit = 'ml';
            } else if (rawUnit === 'ml') {
                targetUnit = 'ml';
            } else {
                targetUnit = 'stk';
            }

            let pricePerBase: number | null = null;
            if (price && totalVal > 0) {
                if (targetUnit === 'g' || targetUnit === 'ml') {
                    // Standard base unit is 1kg (1000g) or 1l (1000ml)
                    pricePerBase = Number(((price / totalVal) * 1000).toFixed(2));
                } else if (targetUnit === 'stk') {
                    pricePerBase = Number((price / totalVal).toFixed(2));
                }
            }

            return {
                quantity: totalVal,
                unit: targetUnit,
                displayQuantity: singleVal * multiplier,
                displayUnit: rawUnit,
                pricePerBase: pricePerBase ?? (basePrice ? Number(basePrice.toFixed(2)) : null),
                source: 'parsed_size_text',
            };
        }
    }

    // 2️⃣ Fallback: calculate quantity from price and basePrice
    if (price && basePrice && basePrice > 0 && baseUnit) {
        const bu = baseUnit.toLowerCase().trim();
        const ratio = price / basePrice;

        if (bu === 'kg' || bu === '1kg' || bu === 'kilogramm') {
            return {
                quantity: Math.round(ratio * 1000),
                unit: 'g',
                displayQuantity: Number(ratio.toFixed(3)),
                displayUnit: 'kg',
                pricePerBase: Number(basePrice.toFixed(2)),
                source: 'calculated_from_base_price',
            };
        }
        if (bu === 'l' || bu === '1l' || bu === 'liter') {
            return {
                quantity: Math.round(ratio * 1000),
                unit: 'ml',
                displayQuantity: Number(ratio.toFixed(3)),
                displayUnit: 'l',
                pricePerBase: Number(basePrice.toFixed(2)),
                source: 'calculated_from_base_price',
            };
        }
        if (bu === 'stk' || bu === 'stück') {
            return {
                quantity: Math.max(1, Math.round(ratio)),
                unit: 'stk',
                displayQuantity: Math.max(1, Math.round(ratio)),
                displayUnit: 'stk',
                pricePerBase: Number(basePrice.toFixed(2)),
                source: 'calculated_from_base_price',
            };
        }
    }

    return {
        quantity: null,
        unit: null,
        displayQuantity: null,
        displayUnit: null,
        pricePerBase: basePrice ? Number(basePrice.toFixed(2)) : null,
        source: null,
    };
}
