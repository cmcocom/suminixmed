#!/usr/bin/env node
// Script: neutralize-archive-roles.mjs
// Añade una marca de advertencia en la cabeza de los archivos en scripts/archive
// que contienen referencias a DESARROLLADOR o COLABORADOR (case-insensitive).

import fs from 'fs/promises';
import path from 'path';

const root = path.resolve('scripts', 'archive');
const patterns = [/DESARROLLADOR/i, /COLABORADOR/i];

function commentForExt(ext) {
  if (ext === '.sql') return (txt) => `/* ${txt} */\n`;
  if (ext === '.md') return (txt) => `<!-- ${txt} -->\n`;
  // default: line comments
  return (txt) => `// ${txt}\n`;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(p);
      continue;
    }

    const ext = path.extname(ent.name).toLowerCase();
    // only process common script/text files
    if (!['.mjs', '.js', '.sql', '.sh', '.md', '.ts'].includes(ext)) continue;

    let content = await fs.readFile(p, 'utf8');
    if (!patterns.some(r => r.test(content))) continue;

    // if already neutralized, skip
    if (/ARCHIVE-ROLE-NOTE/i.test(content)) continue;

    const note = `ARCHIVE-ROLE-NOTE: Archivo archivado (no ejecutar). Contiene referencias históricas a roles DESARROLLADOR / COLABORADOR. Preservado para auditoría.`;
    const makeComment = commentForExt(ext);

    // handle shebang: keep it and insert comment after
    if (content.startsWith('#!')) {
      const idx = content.indexOf('\n');
      if (idx !== -1) {
        const shebang = content.slice(0, idx + 1);
        const rest = content.slice(idx + 1);
        const newContent = shebang + makeComment(note) + '\n' + rest;
        await fs.writeFile(p, newContent, 'utf8');
        console.log(`Tagged: ${p}`);
        continue;
      }
    }

    const newContent = makeComment(note) + '\n' + content;
    await fs.writeFile(p, newContent, 'utf8');
    console.log(`Tagged: ${p}`);
  }
}

async function main(){
  try {
    await fs.access(root);
  } catch (err) {
    console.error('No existe el directorio scripts/archive; nada que hacer.');
    process.exit(0);
  }

  await walk(root);
  console.log('Neutralización completada.');
}

main().catch(err => { console.error(err); process.exit(1); });
