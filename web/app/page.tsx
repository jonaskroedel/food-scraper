'use client';

import { useState } from 'react';
import { ProductGrid } from './components/ProductGrid';

const RETAILERS = [
    { code: 'ALL', name: 'Alle Supermärkte', icon: '🏪' },
    { code: 'SPAR', name: 'SPAR', icon: '🌲' },
    { code: 'BILLA', name: 'BILLA', icon: '🟡' },
    { code: 'HOFER', name: 'HOFER', icon: '🔵' },
    { code: 'LIDL', name: 'LIDL', icon: '🔷' },
];

const QUICK_TAGS = ['Bio Apfel', 'Vollmilch', 'Butter', 'Bananen', 'Kaffee', 'Brot', 'Käse'];

export default function Page() {
    const [searchQuery, setSearchQuery] = useState('');
    const [retailerFilter, setRetailerFilter] = useState('ALL');
    const [onlyBio, setOnlyBio] = useState(false);
    const [sortBy, setSortBy] = useState('price_asc');

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation & Brand Header */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md text-xl font-bold">
                            🛒
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black tracking-tight text-gray-900">
                                    Forager
                                </span>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    AT Live
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                                Österreichischer Preisvergleich für SPAR, BILLA, HOFER & LIDL
                            </p>
                        </div>
                    </div>

                    {/* Search Input Bar */}
                    <div className="flex-1 max-w-xl relative">
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-gray-400 text-base">🔍</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Suche nach z. B. &quot;Bio Apfel&quot;, &quot;Milch&quot;, &quot;Kaffee&quot;..."
                                className="w-full pl-10 pr-10 py-2.5 bg-gray-100 focus:bg-white text-gray-900 placeholder-gray-400 rounded-full border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden text-sm transition-all shadow-inner"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 text-gray-400 hover:text-gray-600 text-sm font-bold p-1 rounded-full"
                                    title="Suche zurücksetzen"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sub-header Filter & Controls Bar */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 text-xs">
                    {/* Retailer Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        {RETAILERS.map(r => (
                            <button
                                key={r.code}
                                onClick={() => setRetailerFilter(r.code)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition-all shadow-2xs whitespace-nowrap ${
                                    retailerFilter === r.code
                                        ? 'bg-gray-900 text-white shadow-sm'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <span>{r.icon}</span>
                                <span>{r.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Bio & Sort Controls */}
                    <div className="flex items-center gap-3 ml-auto">
                        {/* Bio Toggle */}
                        <label className="flex items-center gap-1.5 cursor-pointer select-none bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-2xs hover:bg-emerald-50/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={onlyBio}
                                onChange={e => setOnlyBio(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="font-semibold text-emerald-800">🌱 Nur Bio</span>
                        </label>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-2xs">
                            <span className="text-gray-400">⚖️</span>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="bg-transparent text-gray-800 font-semibold outline-hidden cursor-pointer"
                            >
                                <option value="price_asc">Günstigster Preis (€)</option>
                                <option value="base_price_asc">Bester Grundpreis (€/kg, €/l)</option>
                                <option value="price_desc">Höchster Preis (€)</option>
                                <option value="name_asc">Produktname (A-Z)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Vorschläge:
                    </span>
                    {QUICK_TAGS.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSearchQuery(tag)}
                            className="bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-gray-600 px-2.5 py-0.5 rounded-md border border-gray-200 whitespace-nowrap transition-colors"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
                <ProductGrid
                    searchQuery={searchQuery}
                    retailerFilter={retailerFilter}
                    onlyBio={onlyBio}
                    sortBy={sortBy}
                />
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                        <span className="font-bold text-gray-700">Forager</span> – Österreichischer Preisvergleich für Supermärkte
                    </div>
                    <div className="flex gap-4 text-gray-400">
                        <span>SPAR</span>
                        <span>•</span>
                        <span>BILLA</span>
                        <span>•</span>
                        <span>HOFER</span>
                        <span>•</span>
                        <span>LIDL</span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
