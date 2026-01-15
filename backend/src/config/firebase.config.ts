import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let app: App;
let db: Firestore;

/**
 * Initialize Firebase Admin SDK
 * Supports multiple credential sources:
 * 1. FIREBASE_SERVICE_ACCOUNT env var (JSON string - for Vercel)
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH env var (file path - for local dev)
 * 3. Default credentials (for Google Cloud environments)
 */
function initializeFirebase(): void {
    if (getApps().length > 0) {
        app = getApps()[0];
        db = getFirestore(app);
        return;
    }

    try {
        // Option 1: JSON string from environment variable (Vercel deployment)
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (serviceAccountJson) {
            const serviceAccount = JSON.parse(serviceAccountJson);
            app = initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialized from environment variable');
            db = getFirestore(app);
            return;
        }

        // Option 2: Service account file path (local development)
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        if (serviceAccountPath) {
            // Resolve path relative to the backend directory
            const absolutePath = resolve(process.cwd(), serviceAccountPath);
            const serviceAccount = JSON.parse(readFileSync(absolutePath, 'utf-8'));
            app = initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialized from service account file');
            db = getFirestore(app);
            return;
        }

        // Option 3: Project ID only (application default credentials)
        const projectId = process.env.FIREBASE_PROJECT_ID;
        if (projectId) {
            app = initializeApp({ projectId });
            console.log('Firebase Admin SDK initialized with project ID');
            db = getFirestore(app);
            return;
        }

        // Fallback
        console.warn('No Firebase credentials provided. Using default initialization.');
        app = initializeApp();
        db = getFirestore(app);

    } catch (error) {
        console.error('Firebase initialization error:', error);
        throw error;
    }
}

// Initialize on module load
initializeFirebase();

export { db };
export default app!;
