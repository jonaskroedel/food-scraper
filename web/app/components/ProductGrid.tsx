import { InfiniteProductList } from './InfiniteProductList';

interface ProductGridProps {
    searchQuery: string;
    retailerFilter: string;
    onlyBio: boolean;
    sortBy: string;
}

export function ProductGrid(props: ProductGridProps) {
    return <InfiniteProductList {...props} />;
}
