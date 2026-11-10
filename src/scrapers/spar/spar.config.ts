export const SPAR_BASE_URL =
    'https://api-scp.spar-ics.com/ecom/pw/v1/search/v1/navigation';

export const SPAR_MARKET_ID = '8999';

export const SPAR_CATEGORIES = [
    'lebensmittel',
    'getraenke',
    'drogerie-beauty',
    'haushalt',
    'vorbestellservice',
];

export function buildSparUrl(page: number = 1, category: string = 'lebensmittel'): string {
    return (
        `${SPAR_BASE_URL}` +
        `?query=*` +
        `&sort=Relevancy:asc` +
        `&page=${page}` +
        `&marketId=${SPAR_MARKET_ID}` +
        `&showPermutedSearchParams=false` +
        `&filter=pwCategoryIds%3A${category}` +
        `&hitsPerPage=32`
    );
}
