/**
 * Script d'indexation de la Bible
 * 
 * Utilisation :
 *   npm run index
 * 
 * Ce script :
 * 1. Charge la Bible depuis le fichier JSON
 * 2. La decoupe en chunks (6793 chunks, ~750 car. chacun)
 * 3. Vectorise chaque chunk via OpenAI (text-embedding-3-small, 256 dimensions)
 * 4. Sauvegarde le resultat dans public/vectors.json
 * 
 * Le fichier public/vectors.json est ensuite utilise par l'application
 * au demarrage pour eviter d'appeler l'API d'embedding a chaque session.
 * Gain : 10 minutes d'attente → instantane.
 */

import { loadBible, chunkBible } from '../src/domain/bible/bibleLoader';
import type { Chunk } from '../src/domain/bible/types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Equivalent de __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MODEL = 'text-embedding-3-small';
const DIMENSION = 256;
const API_URL = 'https://api.openai.com/v1/embeddings';

async function main() {
  console.log('');
  console.log('=== Indexation de la Bible Louis Segond 1910 ===');
  console.log('');

  // Lire la clé API depuis l'environnement
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Variable VITE_OPENAI_API_KEY non definie.');
    console.error('   Cree un fichier .env avec : VITE_OPENAI_API_KEY=sk-...');
    console.error('   Ou definis-la dans ton environnement.');
    process.exit(1);
  }

  // Étape 1 : Charger la Bible
  console.log('[1/4] Chargement de la Bible...');
  const bible = loadBible();
  console.log(`  → ${bible.length} livres charges`);

  // Étape 2 : Découper en chunks
  console.log('[2/4] Decoupage en chunks...');
  const chunks = chunkBible(bible);
  console.log(`  → ${chunks.length} chunks crees`);

  // Étape 3 : Vectoriser chaque chunk
  console.log('[3/4] Vectorisation des chunks...');
  console.log(`  Modele : ${MODEL}, dimensions : ${DIMENSION}`);

  const BATCH_SIZE = 100;
  const indexedChunks: Chunk[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          input: texts,
          dimensions: DIMENSION,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${error}`);
      }

      const data = await response.json();

      // Trier par index pour garantir l'ordre
      const ordered = data.data.sort(
        (a: { index: number }, b: { index: number }) => a.index - b.index
      );

      for (let j = 0; j < batch.length; j++) {
        batch[j].embedding = ordered[j].embedding;
        indexedChunks.push(batch[j]);
      }
    } catch (error) {
      console.error(`  ❌ Erreur sur le lot ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
      process.exit(1);
    }

    const progress = Math.min(Math.round((i + BATCH_SIZE) / chunks.length * 100), 100);
    console.log(`  → Progression : ${progress}% (lot ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)})`);
  }

  console.log(`  → ${indexedChunks.length} chunks vectorises`);

  // Étape 4 : Sauvegarder les chunks + embeddings dans public/vectors.json
  console.log('[4/4] Sauvegarde dans public/vectors.json...');

  // Ne garder que les donnees utiles pour le navigateur
  const exportData = indexedChunks.map((chunk) => ({
    id: chunk.id,
    text: chunk.text,
    source: chunk.source,
    embedding: chunk.embedding,
  }));

  const outputPath = path.join(__dirname, '..', 'public', 'vectors.json');
  const json = JSON.stringify({
    model: MODEL,
    dimension: DIMENSION,
    date: new Date().toISOString(),
    totalChunks: indexedChunks.length,
    chunks: exportData,
  });
  fs.writeFileSync(outputPath, json);

  const fileSizeKB = (Buffer.byteLength(json, 'utf-8') / 1024).toFixed(1);
  const estimateGzipKB = (Buffer.byteLength(json, 'utf-8') / 1024 * 0.3).toFixed(1);
  console.log(`  → Taille fichier : ${fileSizeKB} Ko (gz: ~${estimateGzipKB} Ko)`);
  console.log(`  → public/vectors.json pret`);

  console.log('');
  console.log('✅ Indexation terminee !');
  console.log(`   ${indexedChunks.length} chunks indexes.`);
  console.log(`   Modele : ${MODEL}, dimensions : ${DIMENSION}`);
  console.log(`   L'application peut maintenant se charger en < 1s.`);
}

main().catch((error) => {
  console.error('❌ Erreur fatale :', error);
  process.exit(1);
});
