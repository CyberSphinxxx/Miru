/**
 * API Failover Utility
 * 
 * Provides automatic failover between multiple API providers.
 * If one provider fails, it automatically switches to the next available one.
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Base URL for Consumet API (configurable via environment variable)
 */
export const CONSUMET_BASE =
    import.meta.env.VITE_CONSUMET_URL || 'https://miru-consumet.vercel.app';

/**
 * List of API providers to try in order of preference
 */
const API_PROVIDERS = [
    CONSUMET_BASE, // Primary (User's deployment)
    'https://consumet-api.herokuapp.com', // Fallback 1 (Public)
    'https://api.consumet.org', // Fallback 2 (Official)
];

// Keep track of the currently working provider to avoid retrying dead ones
let currentProviderIndex = 0;

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Fetch with automatic failover capability.
 * Tries the current provider first, then falls back to others if needed.
 * 
 * @param endpoint - API endpoint path (without base URL)
 * @returns Response from the first successful provider
 * @throws Error if all providers fail
 */
export async function fetchWithRetry(endpoint: string): Promise<Response> {
    const totalProviders = API_PROVIDERS.length;
    let lastError: Error | null = null;

    for (let i = 0; i < totalProviders; i++) {
        // Calculate which provider to try (round-robin starting from current)
        const providerIndex = (currentProviderIndex + i) % totalProviders;
        const providerUrl = API_PROVIDERS[providerIndex];

        // Normalize endpoint to avoid double slashes
        const cleanEndpoint = endpoint.startsWith('/')
            ? endpoint.substring(1)
            : endpoint;
        const url = `${providerUrl}/${cleanEndpoint}`;

        try {
            const res = await fetch(url);

            // Success or client error (4xx) - return immediately
            // We only consider 5xx errors as "provider failure"
            if (res.ok || (res.status >= 400 && res.status < 500)) {
                // If we successfully switched to a new provider, update the pointer
                if (providerIndex !== currentProviderIndex) {
                    console.log(`[Failover] Switched API provider to: ${providerUrl}`);
                    currentProviderIndex = providerIndex;
                }
                return res;
            }

            throw new Error(`Provider ${providerUrl} returned ${res.status}`);
        } catch (error) {
            console.warn(`[Failover] Provider failed: ${providerUrl}`, error);
            lastError =
                error instanceof Error ? error : new Error('Network error');
        }
    }

    throw lastError || new Error('All API providers failed');
}

/**
 * Get the currently active provider URL
 */
export function getCurrentProvider(): string {
    return API_PROVIDERS[currentProviderIndex];
}

/**
 * Get all configured providers
 */
export function getProviders(): readonly string[] {
    return API_PROVIDERS;
}

/**
 * Manually set the current provider index (useful for testing)
 */
export function setProviderIndex(index: number): void {
    if (index >= 0 && index < API_PROVIDERS.length) {
        currentProviderIndex = index;
    }
}

/**
 * Reset to primary provider
 */
export function resetToDefaultProvider(): void {
    currentProviderIndex = 0;
}

// Legacy exports for backward compatibility
export const API_BASE = API_PROVIDERS[0];
