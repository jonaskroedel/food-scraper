export function parseSize(text?: string | null): {
    quantity: number | null;
    unit: 'g' | 'ml' | 'stk' | null;
} {
    if (!text) return { quantity: null, unit: null };

    const t = text.toLowerCase().replace(',', '.');

    // 6 x 0.5 l
    const multi = t.match(/(\d+)\s*x\s*([\d.]+)\s*(kg|g|l|ml)/);
    if (multi) {
        const count = Number(multi[1]);
        let value = Number(multi[2]);
        let unit = multi[3];

        if (unit === 'kg') {
            value *= 1000;
            unit = 'g';
        }
        if (unit === 'l') {
            value *= 1000;
            unit = 'ml';
        }

        return { quantity: count * value, unit: unit as any };
    }

    // 500 g / 1 kg / 330 ml
    const single = t.match(/([\d.]+)\s*(kg|g|l|ml|stk)/);
    if (single) {
        let value = Number(single[1]);
        let unit = single[2];

        if (unit === 'kg') {
            value *= 1000;
            unit = 'g';
        }
        if (unit === 'l') {
            value *= 1000;
            unit = 'ml';
        }

        return { quantity: value, unit: unit as any };
    }

    return { quantity: null, unit: null };
}