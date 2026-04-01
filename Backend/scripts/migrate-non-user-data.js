const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const DEFAULT_INCLUDED_COLLECTIONS = ['attractions', 'wildlifes', 'chatbotknowledges'];
const DEFAULT_EXCLUDED_COLLECTIONS = new Set(['users', 'bookings', 'transactions', 'livestreams']);
const BATCH_SIZE = 200;

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getArgValue(flagName) {
  const index = process.argv.indexOf(flagName);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function getDbNameFromUri(uri) {
  const withoutQuery = uri.split('?')[0];
  const lastSlash = withoutQuery.lastIndexOf('/');
  return lastSlash === -1 ? '' : withoutQuery.slice(lastSlash + 1);
}

function sanitizeUriForLogs(uri) {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/i, '$1$2:***@');
}

async function copyIndexes(sourceCollection, targetCollection) {
  const indexes = await sourceCollection.indexes();
  const customIndexes = indexes.filter((index) => index.name !== '_id_');

  if (!customIndexes.length) return;

  const definitions = customIndexes.map((index) => {
    const {
      key,
      name,
      v,
      ns,
      background,
      ...options
    } = index;

    return { key, name, ...options };
  });

  await targetCollection.createIndexes(definitions);
}

async function copyCollection(sourceDb, targetDb, collectionName) {
  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);
  const cursor = sourceCollection.find({});

  let batch = [];
  let copiedCount = 0;

  for await (const doc of cursor) {
    batch.push({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    });

    if (batch.length >= BATCH_SIZE) {
      await targetCollection.bulkWrite(batch, { ordered: false });
      copiedCount += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await targetCollection.bulkWrite(batch, { ordered: false });
    copiedCount += batch.length;
  }

  await copyIndexes(sourceCollection, targetCollection);

  return copiedCount;
}

async function dropSourceDatabase(sourceClient, sourceDbName) {
  const adminDb = sourceClient.db(sourceDbName);
  await adminDb.dropDatabase();
}

async function main() {
  loadEnvFile(path.resolve(__dirname, '..', '.env'));

  const sourceUri = process.env.MONGO_URI;
  const targetUri = process.env.TARGET_MONGO_URI || getArgValue('--target');
  const includeArg = process.env.INCLUDE_COLLECTIONS || getArgValue('--include') || '';
  const excludeArg = process.env.EXCLUDE_COLLECTIONS || getArgValue('--exclude') || '';
  const dropSourceAfterCopy =
    process.env.DROP_SOURCE_AFTER_COPY === 'true' || process.argv.includes('--drop-source-after-copy');
  const includedCollections = (includeArg ? includeArg.split(',') : DEFAULT_INCLUDED_COLLECTIONS)
    .map((name) => name.trim())
    .filter(Boolean);
  const excludedCollections = new Set(
    [...DEFAULT_EXCLUDED_COLLECTIONS, ...excludeArg.split(',')]
      .map((name) => name.trim())
      .filter(Boolean)
  );

  if (!sourceUri) {
    throw new Error('Missing source MONGO_URI. Expected it in Backend/.env or the environment.');
  }

  if (!targetUri) {
    throw new Error('Missing target Mongo URI. Set TARGET_MONGO_URI or pass --target "<uri>".');
  }

  const sourceDbName = getDbNameFromUri(sourceUri);
  const targetDbName = getDbNameFromUri(targetUri);

  if (!sourceDbName || !targetDbName) {
    throw new Error('Unable to determine a database name from one of the Mongo URIs.');
  }

  if (sourceUri === targetUri) {
    throw new Error('Source and target Mongo URIs are identical. Aborting to avoid copying onto the same database.');
  }

  console.log(`Source DB: ${sourceDbName} (${sanitizeUriForLogs(sourceUri)})`);
  console.log(`Target DB: ${targetDbName} (${sanitizeUriForLogs(targetUri)})`);
  console.log(`Included collections: ${includedCollections.join(', ')}`);
  console.log(`Excluded collections: ${Array.from(excludedCollections).join(', ')}`);

  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db(sourceDbName);
    const targetDb = targetClient.db(targetDbName);

    const collections = await sourceDb.listCollections({}, { nameOnly: true }).toArray();
    const collectionNames = collections
      .map((collection) => collection.name)
      .filter((name) => !name.startsWith('system.'))
      .filter((name) => includedCollections.includes(name))
      .filter((name) => !excludedCollections.has(name));

    if (!collectionNames.length) {
      console.log('No collections matched the migration rules.');
      return;
    }

    let totalCopied = 0;

    for (const collectionName of collectionNames) {
      const copiedCount = await copyCollection(sourceDb, targetDb, collectionName);
      totalCopied += copiedCount;
      console.log(`Copied ${copiedCount} document(s) from ${collectionName}`);
    }

    console.log(`Migration complete. Total copied document(s): ${totalCopied}`);

    if (dropSourceAfterCopy) {
      await dropSourceDatabase(sourceClient, sourceDbName);
      console.log(`Dropped source database: ${sourceDbName}`);
    }
  } finally {
    await Promise.allSettled([sourceClient.close(), targetClient.close()]);
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
