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
 */
const DATA_MAPPING: Record<string, string> = {
    // ===== Top Level Genres =====
    'action': 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg',           // Attack on Titan
    'adventure': 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',         // One Piece
    'avant garde': 'https://cdn.myanimelist.net/images/anime/1816/133604l.jpg',   // Angel's Egg
    'award winning': 'https://cdn.myanimelist.net/images/anime/6/79597l.jpg',     // Spirited Away
    'boys love': 'https://cdn.myanimelist.net/images/anime/1236/95664l.jpg',      // Given
    'comedy': 'https://cdn.myanimelist.net/images/anime/1988/135093l.jpg',        // Spy x Family
    'drama': 'https://cdn.myanimelist.net/images/anime/13/91361l.jpg',            // Violet Evergarden
    'fantasy': 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',        // Demon Slayer
    'girls love': 'https://cdn.myanimelist.net/images/anime/1783/95855l.jpg',     // Bloom Into You
    'gourmet': 'https://cdn.myanimelist.net/images/anime/8/76672l.jpg',           // Food Wars
    'horror': 'https://cdn.myanimelist.net/images/anime/1858/97705l.jpg',         // Another
    'mystery': 'https://cdn.myanimelist.net/images/anime/13/50521l.jpg',          // Hyouka
    'romance': 'https://cdn.myanimelist.net/images/anime/1295/106551l.jpg',       // Kaguya-sama
    'sci-fi': 'https://cdn.myanimelist.net/images/anime/5/73199l.jpg',            // Steins;Gate
    'slice of life': 'https://cdn.myanimelist.net/images/anime/1935/127974l.jpg', // Bocchi the Rock
    'sports': 'https://cdn.myanimelist.net/images/anime/7/76014l.jpg',            // Haikyuu
    'supernatural': 'https://cdn.myanimelist.net/images/anime/1517/100633l.jpg',  // Mob Psycho 100
    'suspense': 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',           // Death Note
    'ecchi': 'https://cdn.myanimelist.net/images/anime/1795/95088l.jpg',          // Kill la Kill
    'erotica': 'https://cdn.myanimelist.net/images/anime/1453/112674l.jpg',       // Interspecies Reviewers
    'hentai': 'https://cdn.myanimelist.net/images/anime/1819/129769l.jpg',        // Overflow

    // ===== Sub-Genres & Themes =====
    'adult cast': 'https://cdn.myanimelist.net/images/anime/11/39987l.jpg',       // Wotakoi
    'anthropomorphic': 'https://cdn.myanimelist.net/images/anime/1109/106649l.jpg', // Beastars
    'cgdct': 'https://cdn.myanimelist.net/images/anime/4/23083l.jpg',             // K-On!
    'childcare': 'https://cdn.myanimelist.net/images/anime/2/30677l.jpg',         // Usagi Drop
    'combat sports': 'https://cdn.myanimelist.net/images/anime/12/6287l.jpg',     // Hajime no Ippo
    'crossdressing': 'https://cdn.myanimelist.net/images/anime/7/24354l.jpg',     // Princess Jellyfish
    'delinquents': 'https://cdn.myanimelist.net/images/anime/13/4665l.jpg',       // Great Teacher Onizuka
    'detective': 'https://cdn.myanimelist.net/images/anime/6/77839l.jpg',         // Detective Conan
    'educational': 'https://cdn.myanimelist.net/images/anime/13/75587l.jpg',      // Cells at Work
    'gag humor': 'https://cdn.myanimelist.net/images/anime/8/80469l.jpg',         // Saiki K
    'gore': 'https://cdn.myanimelist.net/images/anime/1806/126216l.jpg',          // Chainsaw Man
    'harem': 'https://cdn.myanimelist.net/images/anime/1908/135431l.jpg',         // Quintessential Quintuplets
    'high stakes game': 'https://cdn.myanimelist.net/images/anime/8/63979l.jpg',  // Kakegurui
    'historical': 'https://cdn.myanimelist.net/images/anime/1711/143531l.jpg',    // Kingdom
    'idols (female)': 'https://cdn.myanimelist.net/images/anime/11/53435l.jpg',   // Love Live
    'idols (male)': 'https://cdn.myanimelist.net/images/anime/6/41819l.jpg',      // Uta no Prince-sama
    'isekai': 'https://cdn.myanimelist.net/images/anime/1522/128039l.jpg',        // Mushoku Tensei
    'iyashikei': 'https://cdn.myanimelist.net/images/anime/2/83141l.jpg',         // Laid-Back Camp
    'love polygon': 'https://cdn.myanimelist.net/images/anime/13/24361l.jpg',     // Toradora
    'love status quo': 'https://cdn.myanimelist.net/images/anime/1628/117180l.jpg', // Karakai Jouzu no Takagi-san
    'magical sex shift': 'https://cdn.myanimelist.net/images/anime/1121/133480l.jpg', // Onimai
    'magic': 'https://cdn.myanimelist.net/images/anime/11/39717l.jpg',            // Madoka Magica
    'mahou shoujo': 'https://cdn.myanimelist.net/images/anime/11/55225l.jpg',     // Cardcaptor Sakura
    'martial arts': 'https://cdn.myanimelist.net/images/anime/1565/111305l.jpg',  // Baki
    'mecha': 'https://cdn.myanimelist.net/images/anime/1314/108941l.jpg',         // Code Geass
    'medical': 'https://cdn.myanimelist.net/images/anime/12/37521l.jpg',          // Black Jack
    'military': 'https://cdn.myanimelist.net/images/anime/1001/100346l.jpg',      // 86
    'music': 'https://cdn.myanimelist.net/images/anime/3/67177l.jpg',             // Your Lie in April
    'mythology': 'https://cdn.myanimelist.net/images/anime/10/76792l.jpg',        // Noragami
    'organized crime': 'https://cdn.myanimelist.net/images/anime/10/71923l.jpg',  // 91 Days
    'otaku culture': 'https://cdn.myanimelist.net/images/anime/1629/94480l.jpg',  // Lucky Star
    'parody': 'https://cdn.myanimelist.net/images/anime/10/73274l.jpg',           // Gintama
    'performing arts': 'https://cdn.myanimelist.net/images/anime/12/75178l.jpg',  // Hibike Euphonium
    'pets': 'https://cdn.myanimelist.net/images/anime/1936/123168l.jpg',          // My Roommate is a Cat
    'police': 'https://cdn.myanimelist.net/images/anime/5/73676l.jpg',            // Psycho-Pass
    'racing': 'https://cdn.myanimelist.net/images/anime/13/28413l.jpg',           // Redline
    'reincarnation': 'https://cdn.myanimelist.net/images/anime/1487/133659l.jpg', // Oshi no Ko
    'reverse harem': 'https://cdn.myanimelist.net/images/anime/7/37841l.jpg',     // Ouran High School Host Club
    'samurai': 'https://cdn.myanimelist.net/images/anime/11/29134l.jpg',          // Samurai Champloo
    'school': 'https://cdn.myanimelist.net/images/anime/1429/95946l.jpg',         // My Hero Academia
    'showbiz': 'https://cdn.myanimelist.net/images/anime/11/44791l.jpg',          // Skip Beat
    'space': 'https://cdn.myanimelist.net/images/anime/4/19644l.jpg',             // Cowboy Bebop
    'strategy game': 'https://cdn.myanimelist.net/images/anime/1074/111944l.jpg', // No Game No Life
    'super power': 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg',      // One Punch Man
    'survival': 'https://cdn.myanimelist.net/images/anime/11/53927l.jpg',         // Mirai Nikki
    'team sports': 'https://cdn.myanimelist.net/images/anime/12/36269l.jpg',      // Kuroko no Basket
    'time travel': 'https://cdn.myanimelist.net/images/anime/1934/114972l.jpg',   // Tokyo Revengers
    'urban fantasy': 'https://cdn.myanimelist.net/images/anime/9/75218l.jpg',     // Durarara!!
    'vampire': 'https://cdn.myanimelist.net/images/anime/11/75274l.jpg',          // Hellsing Ultimate
    'video game': 'https://cdn.myanimelist.net/images/anime/6/82761l.jpg',        // Sword Art Online
    'villainess': 'https://cdn.myanimelist.net/images/anime/1626/114670l.jpg',    // Hamefura
    'visual arts': 'https://cdn.myanimelist.net/images/anime/1915/119106l.jpg',   // Blue Period
    'workplace': 'https://cdn.myanimelist.net/images/anime/1002/105741l.jpg',     // Shirobako

    // ===== Demographics =====
    'josei': 'https://cdn.myanimelist.net/images/anime/1452/140119l.jpg',         // Nana
    'kids': 'https://cdn.myanimelist.net/images/anime/1482/117365l.jpg',          // Pokemon 2019
    'seinen': 'https://cdn.myanimelist.net/images/anime/1209/121190l.jpg',        // Vinland Saga
    'shoujo': 'https://cdn.myanimelist.net/images/anime/1269/137870l.jpg',        // Fruits Basket
    'shounen': 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',       // Jujutsu Kaisen
};

// Default fallback image (Something neutral and beautiful, distinct from AoT)
// Using "Your Name" (Kimi no Na wa) background art style
const DEFAULT_IMAGE = 'https://cdn.myanimelist.net/images/anime/5/87048l.jpg'; // Kimi no Na wa

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
