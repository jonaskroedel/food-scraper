import { ProductGrid } from './components/ProductGrid'

export default function Page() {
    return (
        <main className="min-h-screen">
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <h1 className="text-6xl text-red-600">
                        Forager
                    </h1>

                </div>
            </header>

            <section className="max-w-7xl mx-auto px-6 py-6">
                <ProductGrid />
            </section>
        </main>
    )
}
