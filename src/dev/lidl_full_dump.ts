import fs from "fs";

const BASE_URL = "https://www.lidl.at/q/api/search";

const COMMON_HEADERS = {
    "accept": "application/mindshift.search+json;version=2",
    "accept-language": "de-AT,de;q=0.9",
    "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
};

async function fetchPage(offset: number, fetchSize = 12) {
    const url =
        `${BASE_URL}` +
        `?fetchsize=${fetchSize}` +
        `&offset=${offset}` +
        `&assortment=AT` +
        `&locale=de_AT` +
        `&version=2.1.0` +
        `&category.id=10068374`;

    const res = await fetch(url, {
        headers: COMMON_HEADERS,
    });

    if (!res.ok) {
        throw new Error(`LIDL API failed: ${res.status}`);
    }

    return res.json();
}

async function run() {
    console.log("▶ Starting LIDL raw dumps…");

    const allItems: any[] = [];
    let offset = 0;
    const pageSize = 12;

    while (true) {
        console.log(`▶ Fetching offset ${offset}…`);
        const json = await fetchPage(offset, pageSize);

        const items = json.items ?? [];
        if (items.length === 0) break;

        console.log(`  → ${items.length} items`);
        allItems.push(...items);

        offset += pageSize;
    }

    console.log(`✅ Total items collected: ${allItems.length}`);

    fs.writeFileSync(
        "lidl_raw_dump_food.json",
        JSON.stringify(
            {
                meta: {
                    fetchedAt: new Date().toISOString(),
                    categoryId: 10068374,
                    assortment: "AT",
                    locale: "de_AT",
                    totalItems: allItems.length,
                },
                items: allItems,
            },
            null,
            2
        ),
        "utf-8"
    );

    console.log("💾 Written lidl_raw_dump_food.json");
}

run();
