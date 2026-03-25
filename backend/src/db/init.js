const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { TABLE_SCHEMAS, INDEXES } = require('./schema');

const DATA_DIR = path.resolve(__dirname, '../../', process.env.DATA_DIR || '../sap-o2c-data');
const DB_PATH = path.resolve(__dirname, '../../o2c.db');

function readJsonl(folder) {
  const dir = path.join(DATA_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  const records = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(dir, file), 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try { records.push(JSON.parse(line)); } catch {}
    }
  }
  return records;
}

function getColumns(createSql) {
  const match = createSql.match(/\(([^)]+)\)/s);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(col => col.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function initDatabase() {
  // If DB exists and is less than 1 hour old, reuse it
  if (fs.existsSync(DB_PATH)) {
    const stat = fs.statSync(DB_PATH);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs < 3600000) {
      console.log('Reusing existing database:', DB_PATH);
      return new Database(DB_PATH, { readonly: false });
    }
    fs.unlinkSync(DB_PATH);
  }

  console.log('Building database from JSONL files...');
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  for (const table of TABLE_SCHEMAS) {
    db.exec(table.sql);
    const columns = getColumns(table.sql);
    const records = readJsonl(table.folder);

    if (records.length === 0) {
      console.log(`  ${table.name}: 0 records (no data found)`);
      continue;
    }

    const placeholders = columns.map(() => '?').join(',');
    const insert = db.prepare(
      `INSERT INTO ${table.name} (${columns.join(',')}) VALUES (${placeholders})`
    );

    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        insert.run(...columns.map(col => {
          const val = row[col];
          if (val === undefined || val === null) return null;
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          return String(val);
        }));
      }
    });

    insertMany(records);
    console.log(`  ${table.name}: ${records.length} records`);
  }

  for (const idx of INDEXES) {
    db.exec(idx);
  }

  console.log('Database ready.');
  return db;
}

module.exports = { initDatabase };
