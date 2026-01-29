import { load } from 'cheerio';

export interface SparParsedProduct {
    name: string;
    price: number | null;
    weight: string | null;
    badges: string[];
    productUrl: string | null;
}

export function parseSparCategoryPage(html: string): SparParsedProduct[] {
    const $ = load(html);
    const products: SparParsedProduct[] = [];

    $('.product-tile').each((_, el) => {
        const name1 = $(el).find('.product-tile_name1').text().trim();
        const name2 = $(el).find('.product-tile_name2').text().trim();
        const name = [name1, name2].filter(Boolean).join(' ');

        const priceText = $(el)
            .find('.product-price__price')
            .first()
            .text()
            .trim()
            .replace(',', '.');

        const price = priceText ? Number(priceText) : null;

        const weight =
            $(el).find('.product-tile__name3').first().text().trim() || null;

        const badges = $(el)
            .find('.product-tile__badges span[title]')
            .map((_, b) => $(b).attr('title')?.trim())
            .get()
            .filter(Boolean);

        const href = $(el).find('a').first().attr('href');
        const productUrl = href ? `https://www.spar.at${href}` : null;

        products.push({
            name,
            price,
            weight,
            badges,
            productUrl,
        });
    });

    return products;
}
