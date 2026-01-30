import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    experimental: {
        externalDir: true,
    },
    // Keine Turbopack-Keys hier drin lassen!
}

export default nextConfig