import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export const adminApp = initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId,
});

export const adminDb = getFirestore(adminApp, config.firestoreDatabaseId);
export const adminAuth = getAuth(adminApp);
