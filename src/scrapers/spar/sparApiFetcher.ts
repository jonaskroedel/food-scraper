import { request } from 'undici';

const API_URL =
    'https://api-scp.spar-ics.com/ecom/pw/v1/search/v1/navigation';

export async function fetchSparProducts(page = 1) {
    const url =
        `${API_URL}` +
        `?query=*` +
        `&sort=Relevancy:asc` +
        `&page=${page}` +
        `&marketId=NATIONAL` +
        `&showPermutedSearchParams=false` +
        `&filter=pwCategoryPathIDs:lebensmittel` +
        `&hitsPerPage=32`;

    const { statusCode, body } = await request(url, {
        method: 'GET',
        headers: {
            // EXACT browser headers (relevant subset)
            'accept': 'application/json',
            'accept-language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
            'accept-encoding': 'gzip, deflate, br',

            'origin': 'https://www.spar.at',
            'referer': 'https://www.spar.at/',

            // client hints (yes, really)
            'sec-ch-ua':
                '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',

            // fetch context (CRITICAL)
            'sec-fetch-site': 'cross-site',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',

            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                'Chrome/143.0.0.0 Safari/537.36'
        }
    });

    if (statusCode !== 200) {
        throw new Error(`SPAR API failed (${statusCode})`);
    }

    // undici decodes gzip/br automatically
    return await body.json();
}
