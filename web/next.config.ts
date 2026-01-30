import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
    experimental: {
        externalDir: true,
    },
    // Wir sagen Turbopack manuell, wo @db liegt
    turbopack: {
        resolveAlias: {
            '@db': '../src/db.ts',
            '@types/product': '../src/types/product.ts',
            '@types/rawProduct': '../src/types/rawProduct.ts',
        },
    },
}

export default nextConfig