import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Firebase imports - wrapped in try-catch to prevent crashes if firebase-admin is not available
let firebaseApp: any = null;
let firebaseFirestore: any = null;

try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    firebaseApp = require('firebase-admin/app');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    firebaseFirestore = require('firebase-admin/firestore');
} catch (error) {
    console.warn('firebase-admin could not be loaded. Caching is disabled.');
}

let app: any = null;
let db: any = null;

/**
 * Initialize Firebase Admin SDK
 * Supports multiple credential sources:
 * 1. FIREBASE_SERVICE_ACCOUNT env var (JSON string - for Vercel)
 * 2. FIREBASE_SERVICE_ACCOUNT_PATH env var (file path - for local dev)
 * 3. Default credentials (for Google Cloud environments)
 * 
 * Fails gracefully - caching will be disabled if Firebase can't initialize
 */
function initializeFirebase(): void {
    // If firebase-admin couldn't be imported, skip initialization
    if (!firebaseApp || !firebaseFirestore) {
        console.warn('Firebase Admin SDK not available. Caching is disabled.');
        return;
    }

    const { initializeApp, cert, getApps } = firebaseApp;
    const { getFirestore } = firebaseFirestore;

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
            const absolutePath = resolve(process.cwd(), serviceAccountPath);

            // Check if file exists before trying to read
            if (existsSync(absolutePath)) {
                const serviceAccount = JSON.parse(readFileSync(absolutePath, 'utf-8'));
                app = initializeApp({
                    credential: cert(serviceAccount)
                });
                console.log('Firebase Admin SDK initialized from service account file');
                db = getFirestore(app);
                return;
            } else {
                console.warn(`Firebase service account file not found: ${absolutePath}`);
            }
        }

        // Option 3: Project ID only (application default credentials)
        const projectId = process.env.FIREBASE_PROJECT_ID;
        if (projectId) {
            app = initializeApp({ projectId });
            console.log('Firebase Admin SDK initialized with project ID');
            db = getFirestore(app);
            return;
        }

        // No credentials available - caching will be disabled
        console.warn('No Firebase credentials provided. Caching is disabled.');

    } catch (error) {
        // Don't crash - just disable caching
        console.error('Firebase initialization failed. Caching is disabled:', error);
        app = null;
        db = null;
    }
}

// Initialize on module load
initializeFirebase();

export { db };
export default app;
