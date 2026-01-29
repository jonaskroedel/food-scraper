import { request } from 'undici';

const BASE_URL = 'https://www.spar.at';

export async function fetchSparCategoryPage(page = 1): Promise<string> {
    const url = `${BASE_URL}/produktwelt/lebensmittel?page=${page}`;

    const { statusCode, body } = await request(url, {
        method: 'GET',
        headers: {
            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                'Chrome/122.0.0.0 Safari/537.36',

            'accept':
                'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

            'accept-language': 'de-DE,de;q=0.9',

            // WICHTIG: kein br!
            'accept-encoding': 'gzip, deflate',

            'referer': 'https://www.spar.at/',
        },
    });

    if (statusCode !== 200) {
        throw new Error(`Failed to fetch ${url} (${statusCode})`);
    }

    return await body.text();
}
