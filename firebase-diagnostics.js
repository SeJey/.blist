import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, getDocs, limit, query } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export async function runFirebaseDiagnostics() {
    console.log('--- FIREBASE DIAGNOSTICS START ---');
    
    // Check Auth Status
    console.log('Checking Firebase Authentication...');
    try {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('✅ Auth Status: Logged in as', user.email);
            } else {
                console.log('ℹ️ Auth Status: Not logged in (Expected if not authenticated)');
            }
        }, (error) => {
            console.error('❌ Auth Status Error:', error);
            console.error('Firebase Error Code:', error?.code);
            console.error('Firebase Error Message:', error?.message);
        });
    } catch (e) {
        console.error('❌ Auth Initialization Error:', e);
    }

    // Check Firestore Status
    console.log('Checking Firestore Connection...');
    try {
        const q = query(collection(db, '_diagnostic_check'), limit(1));
        await getDocs(q);
        console.log('✅ Firestore Connection: Success (Read permission might be denied, but connection works)');
    } catch (error) {
        if (error.code === 'permission-denied') {
            console.log('✅ Firestore Connection: Success (Received expected permission-denied for diagnostic check)');
        } else {
            console.error('❌ Firestore Connection Error:', error);
        }
    }
    
    console.log('--- FIREBASE DIAGNOSTICS END ---');
}
