import { InfiniteProductList } from './InfiniteProductList'

export function ProductGrid() {
    return (
        <div
            className="
    grid
    gap-8
    justify-center
    [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]
  "
        >

        <InfiniteProductList />
        </div>
    )
}
