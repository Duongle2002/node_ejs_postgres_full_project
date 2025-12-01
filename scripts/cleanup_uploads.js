#!/usr/bin/env node
// Cleanup orphaned files in public/uploads that are not referenced by products.image
// Usage: node scripts/cleanup_uploads.js [--dry-run] [--older-than-days=N]

const fs = require('fs').promises;
const path = require('path');
const pool = require('../db');

const UPLOAD_DIR = path.join(__dirname, '../public/uploads');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
let olderThanDays = null;
for (const a of args){ if (a.startsWith('--older-than-days=')){ olderThanDays = parseInt(a.split('=')[1],10) || null; } }

async function main(){
  try {
    const files = await fs.readdir(UPLOAD_DIR).catch(()=>[]);
    if (!files.length){ console.log('No uploads found'); return; }
    // fetch image paths referenced in products table
    const r = await pool.query('SELECT image FROM products');
    const refs = new Set((r.rows||[]).map(row => (row.image||'')).filter(Boolean).map(s => s.replace(/^\//, '')));

    const now = Date.now();
    let removed = 0;
    for (const f of files){
      const rel = path.join('uploads', f);
      // optional age filter
      if (olderThanDays){
        const st = await fs.stat(path.join(UPLOAD_DIR, f)).catch(()=>null);
        if (st){
          const ageDays = (now - st.mtimeMs) / (1000*60*60*24);
          if (ageDays < olderThanDays) continue; // skip young files
        }
      }
      if (!refs.has(rel)){
        const p = path.join(UPLOAD_DIR, f);
        if (dryRun){
          console.log('[DRY] Would remove', p);
        } else {
          try { await fs.unlink(p); console.log('Removed', p); removed++; } catch (e) { console.error('Failed to remove', p, e.message || e); }
        }
      }
    }
    console.log('Done. Removed:', removed);
    process.exit(0);
  } catch (e){ console.error('Error', e); process.exit(2); }
}

main();
