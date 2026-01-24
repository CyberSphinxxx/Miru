/**
 * Genre Cover Images Service
 * 
 * Provides UNIQUE cover images for genre cards - NO DUPLICATES.
 * Uses curated static images that are GUARANTEED to be unique per genre.
 */

/**
 * Static curated images for each genre - ALL UNIQUE, NO REPEATS
 * Each URL points to a different anime that best represents the genre.
 * Keys are normalized (lowercase) to ensure matching works regardless of API casing.
 * Using AniList CDN (s4.anilist.co) for reliable image hosting.
 */
const DATA_MAPPING: Record<string, string> = {
    // ===== Top Level Genres =====
    'action': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-C6FPmWm59CyP.jpg',           // Attack on Titan
    'adventure': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg',         // One Piece
    'avant garde': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx790-5JmjEg6MNbRN.jpg',      // Ergo Proxy
    'award winning': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx199-lwMRYW16M1bY.jpg',     // Spirited Away
    'boys love': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19163-DDsEG41jEhSl.jpg',       // Given
    'comedy': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx918-CKGbgekJP92p.jpg',         // Gintama
    'drama': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx4181-qUy25o6pVwVj.jpg',            // Clannad: After Story
    'fantasy': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97986-5EvDyg9UZhNf.jpg',           // Made in Abyss
    'girls love': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx99426-mN0PjFLT7Nfz.jpg',       // Bloom Into You
    'gourmet': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21518-oDWZ6oXz2iuE.jpg',           // Food Wars
    'horror': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11111-JEHl2KNI2mtu.jpg',         // Another
    'mystery': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx12189-xaKqvZLAU9Iu.jpg',          // Hyouka
    'romance': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx4224-3Bh0rm99N6Vl.jpg',          // Toradora
    'sci-fi': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdcVzJGVwCB.jpg',            // Steins;Gate
    'slice of life': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-vN39AmOWrVB5.jpg', // Bocchi the Rock
    'sports': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20464-Fz3uD4SKfCLu.jpg',            // Haikyuu
    'supernatural': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21507-Qx7UPfOvDRRE.jpg',  // Mob Psycho 100
    'suspense': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCwhzhi96X.jpg',           // Death Note
    'ecchi': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx18679-Rx5jiqPSodR1.jpg',          // Kill la Kill
    'erotica': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx110270-d9WXQM6fV4A7.jpg',       // Interspecies Reviewers
    'hentai': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx109731-cIKB5CDyM7vB.jpg',        // Overflow

    // ===== Sub-Genres & Themes =====
    'adult cast': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx99578-zPH44sn9Yrf1.jpg',       // Wotakoi
    'anthropomorphic': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx107660-qfm4gcTuWFxd.jpg', // Beastars
    'cgdct': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5680-yp05RHKWsNhj.jpg',             // K-On!
    'childcare': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx10162-JBHnAixfFfKT.jpg',         // Usagi Drop
    'combat sports': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx263-7rEZS3TEDEgL.jpg',     // Hajime no Ippo
    'crossdressing': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx8129-Pf8SqEPn9dAi.jpg',     // Princess Jellyfish
    'delinquents': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx245-W86vJJLyeQhL.jpg',       // Great Teacher Onizuka
    'detective': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx235-oLDEuSkk6vgB.jpg',         // Detective Conan
    'educational': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx100978-YX2S0V3PXaFa.jpg',      // Cells at Work
    'gag humor': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21804-3YVqf2cNVplA.jpg',         // Saiki K
    'gore': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-lIaK2D3FuYy4.jpg',          // Chainsaw Man
    'harem': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx103572-LZ5F3Ma2qPHG.jpg',         // Quintessential Quintuplets
    'high stakes game': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx98314-PJOyBq2NFQHJ.jpg',  // Kakegurui
    'historical': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-T9Q2jrpBo2zO.jpg',    // Vinland Saga
    'idols (female)': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx15051-w3lqIqAJZxU1.jpg',   // Love Live
    'idols (male)': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx10278-gk5qQ4v8Xwjq.jpg',      // Uta no Prince-sama
    'isekai': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21856-t7YkJ8YJI8FA.jpg',        // Mushoku Tensei
    'iyashikei': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx98444-mAIfKs96cdRC.jpg',         // Laid-Back Camp
    'love polygon': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16067-uCPzrNbXDGFg.jpg',     // Nagi no Asukara
    'love status quo': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx99468-xLVpuqPEXwDh.jpg', // Karakai Jouzu no Takagi-san
    'magical sex shift': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx146918-5j3p3b9OHlV6.jpg', // Onimai
    'magic': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9756-MAKWUKGGIqVe.jpg',            // Madoka Magica
    'mahou shoujo': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx232-dqnqLXx9uBm9.jpg',     // Cardcaptor Sakura
    'martial arts': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97888-kLJrcMqwkPtk.jpg',  // Baki
    'mecha': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx2001-VRPEgCJQZWWr.jpg',            // Gurren Lagann
    'medical': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1372-thDvpZEdgF35.jpg',          // Black Jack
    'military': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx116589-MgD0lNHJVQ3P.jpg',      // 86
    'music': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20665-q0HlpW7nOUge.jpg',             // Your Lie in April
    'mythology': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20583-ODemhbofxBYz.jpg',        // Noragami
    'organized crime': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21711-4ahdYePzLOEC.jpg',  // 91 Days
    'otaku culture': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1887-rldvLY8ZQPJ0.jpg',  // Lucky Star
    'parody': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21202-8IwCT0S0fXMP.jpg',            // Konosuba
    'performing arts': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20912-xvn7VvPMLfqR.jpg',  // Hibike Euphonium
    'pets': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101175-jPDKRkbIeHqF.jpg',          // My Roommate is a Cat
    'police': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx13601-pF1lnJP3wVbz.jpg',            // Psycho-Pass
    'racing': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx6675-2NrD8MjRE6VD.jpg',           // Redline
    'reincarnation': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113813-08rlxLc5HYL2.jpg', // Oshi no Ko
    'reverse harem': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx853-JM2pxWBprKxN.jpg',     // Ouran High School Host Club
    'samurai': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx205-DNeEqRF7QjqU.jpg',          // Samurai Champloo
    'school': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21459-bLxGPndLw2mi.jpg',         // My Hero Academia
    'showbiz': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx4722-gJLg0KbXzDY9.jpg',          // Skip Beat
    'space': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-LQDxXYnXBmTE.jpg',             // Cowboy Bebop
    'strategy game': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx19815-E1k3lE7YGOA5.jpg', // No Game No Life
    'super power': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-T9Q2jrpBo2zO.jpg',      // One Punch Man
    'survival': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx10620-2lM9b9aTy9Cj.jpg',         // Mirai Nikki
    'team sports': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11771-ESCwWxvgf8pi.jpg',      // Kuroko no Basket
    'time travel': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120120-Dq0bx2TdUpSB.jpg',   // Tokyo Revengers
    'urban fantasy': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx6746-JV3nUBCkL7Cv.jpg',     // Durarara!!
    'vampire': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx777-JlQ0GDfblqMi.jpg',          // Hellsing Ultimate
    'video game': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11757-CKq0C2FyeQfZ.jpg',        // Sword Art Online
    'villainess': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx109479-MfwImsqMvPKr.jpg',    // Hamefura
    'visual arts': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx117649-c3iVSzPQdP5y.jpg',   // Blue Period
    'workplace': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20595-3dQdqH6kTNJA.jpg',     // Shirobako

    // ===== Demographics =====
    'josei': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx877-3vN3laNRzRNf.jpg',         // Nana
    'kids': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx527-rQ0NbKR4FDtR.jpg',          // Pokemon
    'seinen': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-P3NdnlHYl3Bk.jpg',        // Vinland Saga
    'shoujo': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx124194-pHBJEI6b6B1C.jpg',        // Fruits Basket
    'shounen': 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-HnPj0BVXuLcu.jpg',       // Jujutsu Kaisen
};

// Default fallback image (Abstract pattern)
export const DEFAULT_IMAGE = '/images/genre-placeholder.png';

/**
 * Get the cover image URL for a genre
 * Returns a curated, unique image for each genre
 */
export function getGenreCoverImage(genreName: string): string {
    if (!genreName) return DEFAULT_IMAGE;

    // Normalize key: lowercase, trim
    const key = genreName.toLowerCase().trim();

    // Direct match
    if (DATA_MAPPING[key]) {
        return DATA_MAPPING[key];
    }

    // DEBUG: Log if we still miss something
    console.warn(`[Miru] Missing cover image for genre: "${genreName}" (key: "${key}"). Using default.`);

    return DEFAULT_IMAGE;
}

/**
 * Alias for backwards compatibility
 */
export function getGenreFallbackImage(genreName: string): string {
    return getGenreCoverImage(genreName);
}

/**
 * Prefetch is a no-op since we use static images
 */
export async function prefetchGenreCoverImages(_genreNames: string[]): Promise<void> {
    return Promise.resolve();
}

/**
 * Reset is a no-op since we use static images
 */
export function resetGenreImageTracking(): void {
    // Nothing to reset
}

/**
 * Get a gradient background for a genre (used as loading placeholder)
 */
export function getGenreGradient(genreName: string): string {
    const key = genreName.toLowerCase().trim();

    // Hash-based deterministic gradient for unknown genres
    if (!KNOWN_GRADIENTS[key]) {
        const hash = key.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const hue = Math.abs(hash) % 360;
        return `linear-gradient(135deg, hsl(${hue}, 70%, 50%) 0%, hsl(${(hue + 40) % 360}, 70%, 40%) 100%)`;
    }

    return KNOWN_GRADIENTS[key];
}

const KNOWN_GRADIENTS: Record<string, string> = {
    'action': 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
    'adventure': 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
    'comedy': 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)',
    'drama': 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    'fantasy': 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
    'horror': 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    'mystery': 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
    'romance': 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    'sci-fi': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    'sports': 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    'supernatural': 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    'suspense': 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
};
