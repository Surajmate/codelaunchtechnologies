import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB() {
  // ---------------------------------------------------------
  // Already connected
  // ---------------------------------------------------------

  if (cached.conn) {
    return cached.conn;
  }

  // ---------------------------------------------------------
  // Existing connection attempt
  // ---------------------------------------------------------

  if (!cached.promise) {
    console.log("[MongoDB] Starting connection...");

    // Never print the complete URI because it contains
    // your database username/password.
    console.log(
      "[MongoDB] URI host:",
      getMongoHost(MONGODB_URI)
    );

    cached.promise = mongoose
      .connect(MONGODB_URI, {
        // Prefer IPv4 on local Windows development
        family: 4,

        // Fail reasonably quickly instead of hanging
        serverSelectionTimeoutMS: 10000,

        // Connection timeout
        connectTimeoutMS: 10000,

        // Keep socket connections alive
        socketTimeoutMS: 45000,

        // Don't create unnecessary indexes during
        // every development connection.
        autoIndex: true,
      })
      .then((connection) => {
        console.log(
          "[MongoDB] Connected successfully"
        );

        console.log(
          "[MongoDB] Database:",
          connection.connection.name
        );

        console.log(
          "[MongoDB] Host:",
          connection.connection.host
        );

        console.log(
          "[MongoDB] Ready state:",
          connection.connection.readyState
        );

        return connection;
      })
      .catch((error) => {
        console.error(
          "[MongoDB] Connection failed"
        );

        console.error(
          "[MongoDB] Error name:",
          error?.name
        );

        console.error(
          "[MongoDB] Error message:",
          error?.message
        );

        console.error(
          "[MongoDB] Full error:",
          error
        );

        // Very important:
        // clear failed promise so the next request can retry.
        cached.promise = null;

        throw error;
      });
  }

  // ---------------------------------------------------------
  // Wait for connection
  // ---------------------------------------------------------

  try {
    cached.conn = await cached.promise;

    return cached.conn;
  } catch (error) {
    cached.conn = null;
    cached.promise = null;

    throw error;
  }
}

// -------------------------------------------------------------
// Safely extract MongoDB host for logging
// -------------------------------------------------------------

function getMongoHost(uri: string): string {
  try {
    const withoutProtocol = uri.replace(
      /^mongodb(\+srv)?:\/\//,
      ""
    );

    const atIndex = withoutProtocol.lastIndexOf("@");

    const hostPart =
      atIndex >= 0
        ? withoutProtocol.substring(atIndex + 1)
        : withoutProtocol;

    return hostPart.split("/")[0];
  } catch {
    return "[unable to determine host]";
  }
}