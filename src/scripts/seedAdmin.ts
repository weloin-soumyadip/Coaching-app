import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Admin from '../models/Admin.js';

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'Root Admin';

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }
  if (password.length < 6) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 6 characters');
  }

  await connectDB();
  try {
    const normalized = email.toLowerCase().trim();
    const existing = await Admin.findOne({ email: normalized });
    if (existing) {
      console.log(`[seed:admin] admin already exists: ${normalized}`);
      return;
    }
    await Admin.create({ email: normalized, password, name });
    console.log(`[seed:admin] created admin: ${normalized}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[seed:admin] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
