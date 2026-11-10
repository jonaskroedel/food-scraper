<h1 align="center">
🛒 Österreichischer Preisvergleicher für Supermärkte (Forager)
</h1>

---

<h3 align="center">
Ein kategorieübergreifender Preisvergleich für die größten österreichischen Supermärkte (SPAR, BILLA, HOFER, LIDL) –  
mit Live-Datensammlung, Fokus auf Preis/Einheit und echter Vergleichbarkeit.
</h3>

<div align="center">

  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Next.js-16%20Turbopack-black" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-17-blue" alt="PostgreSQL">

</div>

---

> Suche nach **„Bio Apfel“** →  
> alle Bio-Äpfel aller Shops (SPAR, BILLA, HOFER, LIDL), sauber zusammengeführt und vergleichbar.

---

## 🔍 Was macht dieses Projekt besonders?

- 🇦🇹 Fokus auf **österreichische Supermärkte**: SPAR, BILLA, HOFER, LIDL
- 🔄 **Modulare Scraper-Architektur** für alle 4 Ketten mit einheitlicher Typisierung
- 🧩 **Kategorieübergreifender Vergleich** & automatische Bio-Erkennung
- ⚖️ Vergleich nach absolutem Preis und standardisiertem **Grundpreis (€/kg, €/l)**
- 🚀 **Next.js Web Frontend** mit Live-Suche, Supermarkt-Filterchips, Bio-Toggle und Sortierung
- 📦 **Offline/Fallback Snapshot Modus**: Sofort testbar auch ohne laufende lokale Datenbank
- 🐳 **Docker Compose** für 1-Klick PostgreSQL Setup mit vollständigem Schema

---

## 🧠 Aktueller Projektstatus

| Bereich             | Fortschritt | Status                                                       |
|---------------------|-------------|--------------------------------------------------------------|
| **Data Scraping**   | ~98 %       | Schnelle Direkt-APIs für SPAR (16.000+), BILLA (12.000+), HOFER (1.200+) und LIDL implementiert |
| **Datenbank**       | ~90 %       | Schema, Docker Compose, Migration & Seeding aus Dumps         |
| **Backend / API**   | ~90 %       | Next.js API Route (`/api/products`) mit Suche, Filter & Paging|
| **Frontend (Web)**  | ~85 %       | Responsive UI, Multi-Offer-Vergleich, Badges & Filterchips   |
| **Produkt-Matching**| ~80 %       | EAN-/Titel-/Marken-Normalisierer & Bio-Erkennung             |
| **Preis/Einheit**   | ~90 %       | Intelligente Multi-Pack & Grundpreisberechnung (€/kg, €/l)   |

---

## ⚡ Quickstart

### 1. Installation
```bash
git clone https://github.com/jonaskroedel/food-scraper.git
cd food-scraper
npm install
```

### 2. Frontend starten
Starte das Web Frontend (nutzt standardmäßig die Live-Datenbank oder automatisch den lokalen Snapshot-Modus mit Hunderten echten Produkten):
```bash
npm run dev:web
```
Öffne [http://localhost:3000](http://localhost:3000) im Browser.

### 3. Datenbank starten (Optional mit Docker)
```bash
# PostgreSQL Container starten
docker compose up -d

# Schema migrieren & Beispieldaten laden
npm run db:migrate
npm run db:seed
```

### 4. Scraper ausführen
```bash
# Alle Supermärkte nacheinander scrapen
npm run dev:scraper:all

# Einzelne Supermärkte gezielt scrapen
npm run dev:scraper:billa
npm run dev:scraper:hofer
npm run dev:scraper:lidl
npm run dev:scraper:spar

# Optionen übergeben
npx tsx src/index.ts --retailer=spar --startPage=64 --pages=20 --db
```

### 5. Tests & Typüberprüfung
```bash
npm test
npm run typecheck
```

---

## 🛠️ Architektur & Scraper-Übersicht

```
food-scraper/
├── src/
│   ├── index.ts               # CLI Entrypoint für Scraper Suite
│   ├── scrapers/              # Modulare Supermarkt-Scraper
│   │   ├── spar/              # SPAR Browser Session & Bulk API
│   │   ├── billa/             # BILLA Product Discovery REST API
│   │   ├── hofer/             # HOFER via ROKSH Category API
│   │   ├── lidl/              # LIDL Search API
│   │   └── scraperTypes.ts    # Standardisiertes Scraper-Interface
│   ├── normalizer/
│   │   ├── sizeNormalizer.ts  # Multi-Pack- & Einheitennormalisierung
│   │   └── productMatcher.ts  # Bio-Erkennung, Marken- & Match-Key-Logik
│   ├── db/
│   │   ├── pg.ts              # Resilienter Connection Pool
│   │   ├── migrate.ts         # Tabellen- & Constraint-Migration
│   │   ├── seed.ts            # Seeding aus JSON Dumps
│   │   └── persist.ts         # Performanter Bulk-Upsert in PostgreSQL
│   └── utils/
│       ├── http.ts            # HTTP Client mit Backoff & Retry
│       └── logger.ts          # Formatierte Konsolenausgaben
└── web/                       # Next.js App Router Web UI
    ├── app/
    │   ├── page.tsx           # Hauptseite mit Suche, Filtern & Header
    │   ├── components/        # ProductCard, ProductGrid, InfiniteList
    │   └── api/products/      # REST Endpoint mit Filter & Snapshot-Fallback
    └── lib/
        └── dumpFallback.ts    # Fallback-Datensatz für Offline-/Demo-Nutzung
```

---

## ⚠️ Rechtlicher Hinweis

Dieses Projekt dient **zu Lern- und Forschungszwecken**.  
Beim Scraping werden die jeweiligen **AGB und robots.txt** der Anbieter berücksichtigt.

---

## 📄 License

MIT License

---
<h6 align="center">
Crafted with ♥️ in Innsbruck
</h6>
