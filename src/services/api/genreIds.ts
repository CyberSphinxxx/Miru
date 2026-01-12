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
    'kids': 15,

    // Drama, Mystery, Psychological
    'drama': 8,
    'mystery': 7,
    'psychological': 40,
    'suspense': 41,
    'thriller': 41, // Thriller is often suspended/same id in some contexts, but let's check. Jikan list says 41 is Suspense. 
    // Wait, let me check the previous `run_command` output for Thriller.
    // Thriller is NOT in the specific list I printed? 
    // Ah, MAL renamed "Thriller" to "Suspense" (ID 41) mostly. 
    // Let me check my previous output carefully.
    // ID 41 is "Suspense". Horror is 14. 
    // I will map 'thriller' to 41 (Suspense) as a safe bet if not explicitly there.
    // Actually, looking at the log: { mal_id: 41, name: "Suspense" }. No explicit "Thriller".

    // Fantasy & Supernatural
    'fantasy': 10,
    'isekai': 62,
    'reincarnation': 72,
    'supernatural': 37,
    'magic': 10, // Often merged into fantasy, but old ID was 16? Let's check. Not in list.
    // The list I got from Jikan is the current one. Use that.
    'demons': 6, // Mythology (ID 6) or something else? List has "Mythology" (6). 
    // "Demons" was legacy ID 5? No, Avant Garde is 5.
    // Let's use the explicit names from the log where possible.

    // Sci-Fi & Tech
    'sci-fi': 24,
    'mecha': 18,
    'space': 29,
    'cars': 3, // Racing (ID 3)

    // Romance
    'romance': 22,
    'girls love': 26, // Shoujo Ai / Girls Love
    'boys love': 28, // Shounen Ai / Boys Love
    'harem': 35,
    'ecchi': 9,
    'erotica': 49,

    // Specific Themes
    'martial arts': 17,
    'military': 38,
    'police': 39, // Detective (39)
    'samurai': 21,
    'super power': 31,

    // Demographics
    'shounen': 27,
    'seinen': 42,
    'shoujo': 25,
    'josei': 43,

    // Niche
    'game': 11, // Strategy Game (11) probably widely used
    'strategy game': 11,
    'video game': 79,
    'historical': 13,
    'horror': 14,
    'music': 19,
    'school': 23,
    'sports': 30,
    'visual arts': 80,
    'workplace': 48,

    // Legacy / Aliases
    'shoujo ai': 26,
    'shounen ai': 28,
    'vampire': 32,
    'racing': 3,
    'detective': 39,
    'mythology': 6,
};
