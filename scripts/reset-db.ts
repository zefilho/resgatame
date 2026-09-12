import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getOrInitializeApp() {
  if (!getApps().length) {
    if (!firebaseConfig.apiKey) {
      throw new Error('Missing Firebase API Key. Please check your environment variables in .env.local');
    }
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = getOrInitializeApp();
const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'resgatame';
const db = getFirestore(app, databaseId);

async function resetDatabase() {
  console.log('🔄 Iniciando processo para ZERAR o banco de dados Firestore...\n');

  const collectionsToClean = ['menuItems', 'customers', 'annotations', 'sales'];

  // Limpeza completa das coleções
  for (const colName of collectionsToClean) {
    console.log(`🧹 Limpando coleção '${colName}'...`);
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    
    let deletedCount = 0;
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, colName, d.id));
      deletedCount++;
    }
    console.log(`   └ Total de documentos removidos de '${colName}': ${deletedCount}`);
  }

  console.log('\n✅ Banco de dados zerado com sucesso! Nenhuma coleção contém registros.');
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error('❌ Erro ao zerar banco de dados:', err);
  process.exit(1);
});
