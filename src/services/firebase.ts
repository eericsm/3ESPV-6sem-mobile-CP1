import { getApp, getApps, initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

type FirebaseConfig = {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
};

export const firebaseConfig: FirebaseConfig = {
    databaseURL: 'https://mobile-6sem-cp1-default-rtdb.firebaseio.com/',

    apiKey: 'AIzaSyB16Fjbc1Rp2x-2xvYW5cHFrGDmDR1cxWo',
    authDomain: 'mobile-6sem-cp1.firebaseapp.com',
    projectId: 'mobile-6sem-cp1',
    storageBucket: 'mobile-6sem-cp1.firebasestorage.app',
    messagingSenderId: '962570539319',
    appId: '1:962570539319:web:8511cc9d1e2b926a9c4ab2',
};

export const firebaseApp: FirebaseApp =
    getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDatabase = getDatabase(firebaseApp);
