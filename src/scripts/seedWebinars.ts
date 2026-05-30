import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Teacher from '../models/Teacher.js';
import Webinar from '../models/Webinar.js';
import logger from '../lib/logger.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function main(): Promise<void> {
  await connectDB();
  try {
    const teachers = await Teacher.find({ isActive: true }).limit(3).select('_id name');
    if (teachers.length === 0) {
      logger.warn('no active teachers found — register a teacher before seeding webinars');
      return;
    }

    const now = Date.now();
    const host = (i: number) => teachers[i % teachers.length]!._id;

    // Two webinars inside the next-2-days window, one outside (proves filtering).
    const fixtures = [
      {
        title: 'Cracking Algebra: Live Problem Solving',
        teacher: host(0),
        description: 'Hands-on session on quadratic equations.',
        scheduledAt: new Date(now + 6 * HOUR),
        durationMinutes: 60,
        thumbnail: 'https://picsum.photos/seed/webinar1/400/225',
        joinUrl: 'https://meet.example.com/algebra-live',
        status: 'scheduled' as const,
      },
      {
        title: 'Physics Doubt-Clearing Marathon',
        teacher: host(1),
        description: 'Bring your toughest mechanics questions.',
        scheduledAt: new Date(now + 1 * DAY + 3 * HOUR),
        durationMinutes: 90,
        thumbnail: 'https://picsum.photos/seed/webinar2/400/225',
        joinUrl: 'https://meet.example.com/physics-marathon',
        status: 'scheduled' as const,
      },
      {
        title: 'Board Exam Strategy (next week)',
        teacher: host(2),
        description: 'Out-of-window webinar — should NOT appear on the dashboard.',
        scheduledAt: new Date(now + 5 * DAY),
        durationMinutes: 45,
        thumbnail: 'https://picsum.photos/seed/webinar3/400/225',
        joinUrl: 'https://meet.example.com/board-strategy',
        status: 'scheduled' as const,
      },
    ];

    // Idempotent: replace any prior webinar with the same title.
    for (const f of fixtures) {
      await Webinar.findOneAndUpdate({ title: f.title }, f, { upsert: true });
    }
    logger.info({ count: fixtures.length }, 'webinars seeded');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  logger.error({ err }, 'seed failed');
  process.exit(1);
});
