export const GENRE_ID_MAP: Record<string, number> = {
    // Action & Adventure
    'action': 1,
    'adventure': 2,
    'avant garde': 5,
    'award winning': 46,

    // Comedy & Slice of Life
    'comedy': 4,
    'slice of life': 36,
    'parody': 20,
    'gourmet': 47,
    'kids': 15, // Explicit Jikan ID

    // Drama, Mystery, Psychological
    'drama': 8,
    'mystery': 7,
    'psychological': 40,
    'suspense': 41,
    'thriller': 41, // Mapped to Suspense

    // Fantasy & Supernatural
    'fantasy': 10,
    'isekai': 62,
    'reincarnation': 72,
    'supernatural': 37,
    'magic': 10, // Not a distinct top-level genre in Jikan v4, mapped to Fantasy? Or maybe it's missing. Let's not map it if it doesn't exist.
    // Jikan v4 has "Magical Sex Shift" (65) and "Mahou Shoujo" (66).
    // Let's remove 'magic' to avoid confusion, or map to Fantasy (10).
    'demons': 6, // Mapped to Mythology (6)

    // Sci-Fi & Tech
    'sci-fi': 24,
    'mecha': 18,
    'space': 29,
    'racing': 3,
    'cars': 3, // Mapped to Racing

    // Romance
    'romance': 22,
    'girls love': 26,
    'boys love': 28,
    'harem': 35,
    'ecchi': 9,
    'erotica': 49,
    'hentai': 12,
    'adult cast': 50,

    // Specific Themes
    'martial arts': 17,
    'military': 38,
    'police': 39, // Detective (39)
    'detective': 39,
    'samurai': 21,
    'super power': 31,
    'mythology': 6,

    // Demographics
    'shounen': 27,
    'seinen': 42,
    'shoujo': 25,
    'josei': 43,

    // Niche
    'game': 11, // Strategy Game?
    'strategy game': 11,
    'video game': 79,
    'historical': 13,
    'horror': 14,
    'music': 19,
    'school': 23,
    'sports': 30,
    'visual arts': 80,
    'workplace': 48,
    'performing arts': 70,
    'pets': 71,
    'showbiz': 75,
    'otaku culture': 69,
    'anthropomorphic': 51,
    'crossdressing': 81,
    'delinquents': 55,
    'gore': 58,
    'survival': 76,
    'team sports': 77,
    'combat sports': 54,
    'high stakes game': 59,
    'idols (female)': 60,
    'idols (male)': 61,
    'iyashikei': 63,
    'love polygon': 64,
    'magical sex shift': 65,
    'mahou shoujo': 66,
    'medical': 67,
    'organized crime': 68,
    'reverse harem': 73,
    'love status quo': 74,
    'time travel': 78,
    'urban fantasy': 82,
    'villainess': 83,

    // Legacy / Aliases
    'shoujo ai': 26,
    'shounen ai': 28,
    'vampire': 32,
    'educational': 56,
    'gag humor': 57,
};
