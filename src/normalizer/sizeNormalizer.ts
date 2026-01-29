export type NormalizedSize = {
    quantity: number | null;
    unit: 'g' | 'kg' | 'ml' | 'l' | 'stk' | null;
    source: 'parsed_size_text' | 'calculated_from_base_price' | null;
};

const SIZE_REGEX =
    /(?:(\d+(?:[.,]\d+)?)\s*x\s*)?(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|stk)/i;

export function normalizeSize(
    sizeText?: string | null,
    price?: number | null,
    basePrice?: number | null,
    baseUnit?: string | null
): NormalizedSize {

    // 1️⃣ Try parsing sizeText
    if (sizeText) {
        const match = sizeText.replace(',', '.').match(SIZE_REGEX);

        if (match) {
            const multiplier = match[1] ? parseFloat(match[1]) : 1;
            let quantity = parseFloat(match[2]) * multiplier;
            let unit = match[3].toLowerCase() as any;

            if (unit === 'kg') {
                quantity *= 1000;
                unit = 'g';
            }
            if (unit === 'l') {
                quantity *= 1000;
                unit = 'ml';
            }

            return {
                quantity,
                unit,
                source: 'parsed_size_text',
            };
        }
    }

    // 2️⃣ Fallback: calculate from base price
    if (
        price &&
        basePrice &&
        baseUnit &&
        ['kg', 'l'].includes(baseUnit)
    ) {
        const quantity = price / basePrice;

        return {
            quantity: baseUnit === 'kg' ? quantity * 1000 : quantity * 1000,
            unit: baseUnit === 'kg' ? 'g' : 'ml',
            source: 'calculated_from_base_price',
        };
    }

    return {
        quantity: null,
        unit: null,
        source: null,
    };
}