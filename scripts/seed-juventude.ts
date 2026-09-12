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

function parseCurrencyToNumber(priceStr: string): number {
  // Limpar "R$", espaços, e trocar vírgula por ponto
  const cleanStr = priceStr.replace(/R\$\s*/gi, '').replace(/\./g, '').replace(',', '.').trim();
  const val = parseFloat(cleanStr);
  return isNaN(val) ? 0 : val;
}

async function seedJuventudeFromCSV() {
  const csvPath = path.resolve(process.cwd(), 'scripts', 'lojinha-juventude.csv');

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

  // Ignorar o cabeçalho (Produto;Valor)
  const dataLines = lines.slice(1);
  console.log(`🚀 Carregados ${dataLines.length} itens para a categoria "Lojinha - Juventude".\n`);

  const menuRef = collection(db, 'menuItems');
  let insertedCount = 0;

  for (const line of dataLines) {
    const parts = line.split(';');
    if (parts.length >= 2) {
      const productName = parts[0].trim();
      const rawPrice = parts[1].trim();
      const priceNumber = parseCurrencyToNumber(rawPrice);

      if (productName) {
        const menuItemDoc = {
          name: productName,
          price: priceNumber,
          category: 'Lojinha - Juventude',
        };

        await addDoc(menuRef, menuItemDoc);
        insertedCount++;
        console.log(`   + [Lojinha - Juventude ${insertedCount}] ${menuItemDoc.name} - R$ ${menuItemDoc.price.toFixed(2)}`);
      }
    }
  }

  console.log(`\n✅ Concluído! Total de ${insertedCount} produtos da Lojinha - Juventude cadastrados com sucesso no Firestore.`);
  process.exit(0);
}

seedJuventudeFromCSV().catch((err) => {
  console.error('❌ Erro durante o povoamento da Lojinha - Juventude:', err);
  process.exit(1);
});
