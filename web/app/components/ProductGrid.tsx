import { InfiniteProductList } from './InfiniteProductList'

export function ProductGrid() {
    return (
        <div
            className="
        grid
        gap-6 md:gap-8
        grid-cols-[repeat(auto-fill,minmax(260px,1fr))]
        items-stretch
      "
        >
            <InfiniteProductList />
        </div>
    )
}
