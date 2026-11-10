import assert from 'node:assert';
import { normalizeSize } from '../normalizer/sizeNormalizer';
import { isBio, cleanProductName, generateMatchKey } from '../normalizer/productMatcher';
import { normalizeBillaHit } from '../scrapers/billa/billa.normalize';
import { normalizeHoferHit } from '../scrapers/hofer/hofer.normalize';
import { normalizeLidlHit } from '../scrapers/lidl/lidl.normalize';
import { normalizeSparHit } from '../scrapers/spar/spar.normalize';
import { logger } from '../utils/logger';

console.log('🧪 Running Unit Tests...');

// 1. normalizeSize tests
{
    const s1 = normalizeSize('500g');
    assert.strictEqual(s1.quantity, 500);
    assert.strictEqual(s1.unit, 'g');

    const s2 = normalizeSize('1,5 kg');
    assert.strictEqual(s2.quantity, 1500);
    assert.strictEqual(s2.unit, 'g');

    const s3 = normalizeSize('6 x 0.5 l');
    assert.strictEqual(s3.quantity, 3000);
    assert.strictEqual(s3.unit, 'ml');

    const s4 = normalizeSize(null, 1.99, 3.98, 'kg');
    assert.strictEqual(s4.quantity, 500);
    assert.strictEqual(s4.unit, 'g');
    assert.strictEqual(s4.pricePerBase, 3.98);

    console.log('✅ normalizeSize tests passed');
}

// 2. productMatcher tests
{
    assert.strictEqual(isBio('Ja! Natürlich Bio Bananen'), true);
    assert.strictEqual(isBio('Zurück zum Ursprung Heumilch'), true);
    assert.strictEqual(isBio('SPAR Natur*pur Apfel'), true);
    assert.strictEqual(isBio('Wieselburger Bier'), false);

    const cleaned = cleanProductName('Ja! Natürlich Bio Bananen 1kg', 'Ja! Natürlich');
    assert.strictEqual(cleaned, 'Bio Bananen');

    const key = generateMatchKey('Bio Bananen 1kg', 'Ja! Natürlich', 1000, 'g');
    assert.strictEqual(key, 'bio-bio-bananen-1000g');

    console.log('✅ productMatcher tests passed');
}

// 3. Retailer normalization tests
{
    // Billa
    const mockBilla = {
        sku: '12345',
        name: 'Ja! Natürlich Bio Bananen',
        brand: { name: 'Ja! Natürlich' },
        price: { regular: { value: 249, perStandardizedQuantity: 249 }, baseUnitShort: 'kg' },
        volumeLabelLong: '1 kg',
        images: ['https://example.com/img.jpg'],
        slug: 'ja-natuerlich-bio-bananen',
    };
    const billaNorm = normalizeBillaHit(mockBilla);
    assert.strictEqual(billaNorm.chain, 'BILLA');
    assert.strictEqual(billaNorm.price, 2.49);
    assert.strictEqual(billaNorm.normalizedQuantity, 1000);
    assert.strictEqual(billaNorm.normalizedUnit, 'g');

    // Hofer
    const mockHofer = {
        productID: 9988,
        productProvider: [
            {
                providerProductName: 'ZZU Kartoffeln 1kg',
                price: 1.79,
                unit: 'Kg',
                unitPrice: '1.79',
                providerProductImageUrl: 'https://example.com/kartoffel.jpg',
            },
        ],
    };
    const hoferNorm = normalizeHoferHit(mockHofer);
    assert.strictEqual(hoferNorm.chain, 'HOFER');
    assert.strictEqual(hoferNorm.price, 1.79);
    assert.strictEqual(hoferNorm.normalizedQuantity, 1000);
    assert.strictEqual(hoferNorm.normalizedUnit, 'g');

    // Lidl
    const mockLidl = {
        code: '5566',
        gridbox: {
            data: {
                fullTitle: 'Bio Butter 250 g',
                price: { price: 2.19, basePrice: { text: '1 kg = 8.76' }, currencyCode: 'EUR' },
                image: 'https://example.com/butter.png',
                canonicalPath: '/p/bio-butter/p5566',
            },
        },
    };
    const lidlNorm = normalizeLidlHit(mockLidl);
    assert.strictEqual(lidlNorm.chain, 'LIDL');
    assert.strictEqual(lidlNorm.price, 2.19);
    assert.strictEqual(lidlNorm.normalizedQuantity, 250);
    assert.strictEqual(lidlNorm.normalizedUnit, 'g');

    console.log('✅ Retailer normalizers tests passed');
}

console.log('🎉 All tests passed successfully!');
