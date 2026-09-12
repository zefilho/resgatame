import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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

async function seedCursistasFromCSV() {
  const csvPath = path.resolve(process.cwd(), 'scripts', 'lista-cursista.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Arquivo CSV não encontrado em: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📄 Lendo arquivo CSV: ${csvPath}...`);
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length <= 1) {
    console.error('❌ O arquivo CSV está vazio ou contém apenas o cabeçalho.');
    process.exit(1);
  }

  // Ignorar a primeira linha de cabeçalho (nome;telefone)
  const dataLines = lines.slice(1);
  console.log(`🚀 Carregados ${dataLines.length} registros para cadastro com TAG "Cursista".\n`);

  const customersRef = collection(db, 'customers');
  let insertedCount = 0;

  for (const line of dataLines) {
    const parts = line.split(';');
    if (parts.length >= 2) {
      const rawName = parts[0].trim().replace(/\s*\*\*$/, ''); // Remove asteriscos no final do nome se houver
      const rawPhone = parts[1].trim();

      if (rawName) {
        const cursistaDoc = {
          name: rawName,
          phone: rawPhone || 'N/A',
          tag: 'Cursista',
        };

        await addDoc(customersRef, cursistaDoc);
        insertedCount++;
        console.log(`   + [Cursista ${insertedCount}] ${cursistaDoc.name} (${cursistaDoc.phone})`);
      }
    }
  }

  console.log(`\n✅ Concluído! Total de ${insertedCount} Cursistas cadastrados com sucesso no banco de dados.`);
  process.exit(0);
}

seedCursistasFromCSV().catch((err) => {
  console.error('❌ Erro durante o povoamento de Cursistas:', err);
  process.exit(1);
});
