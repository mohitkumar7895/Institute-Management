import mongoose from "mongoose";

/**
 * MongoDB Connection Utility
 * Optimized for Next.js serverless (Vercel) with connection caching.
 */

function getMongoUri(): string | undefined {
  return process.env.MONGODB_URI || process.env.MONNGODB_URI;
}

// Global cache to prevent multiple connections in development / serverless
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalWithMongoose = global as any;

if (!globalWithMongoose._mongooseCache) {
  globalWithMongoose._mongooseCache = { conn: null, promise: null };
}

const cached = globalWithMongoose._mongooseCache;

export async function connectDB() {
  const MONGODB_URI = getMongoUri();

  if (!MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Add it in Vercel → Settings → Environment Variables.",
    );
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(() => mongoose.connection);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e: unknown) {
    cached.conn = null;
    cached.promise = null;
    const message = e instanceof Error ? e.message : "Unknown connection error";
    console.error("MONGODB CONNECTION ERROR:", message);
    throw new Error(`DB_CONNECTION_FAILED: ${message}`);
  }
}

export default connectDB;
