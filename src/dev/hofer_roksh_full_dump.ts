import fs from "fs";

const BASE_URL = "https://shopservice.roksh.at";

const COMMON_HEADERS = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    "origin": "https://www.roksh.at",
    "referer": "https://www.roksh.at/",
    "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
};

async function fetchProducts(progId: string, page = 1) {
    const url =
        `${BASE_URL}/productlist/ProductBlockList` +
        `?page=${page}` +
        `&numberOfItems=24` +
        `&isIncognitoRokshLanding=false` +
        `&progId=${progId}` +
        `&userSelectedProviderCodeArray=hofer`;

    const res = await fetch(url, {
        headers: COMMON_HEADERS,
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error(`ROKSH API failed: ${res.status}`);
    }

    const json = await res.json();
    return json?.[0]?.ProductList ?? [];
}

async function run() {
    console.log("▶ Fetching HOFER products via ROKSH…");

    const allProducts: any[] = [];
    let page = 1;

    while (true) {
        console.log(`▶ Page ${page}…`);
        const products = await fetchProducts("bio-gemuse", page);

        if (products.length === 0) break;

        console.log(`  → ${products.length} products`);
        allProducts.push(...products);
        page++;
    }

    console.log(`✅ Total products: ${allProducts.length}`);

    fs.writeFileSync(
        "hofer_roksh_bio-gemuse_raw_dump.json",
        JSON.stringify(allProducts, null, 2),
        "utf-8"
    );

    console.log("💾 Written hofer_roksh_bio-gemuse_raw_dump.json");
}

run();
