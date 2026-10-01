import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const AUTH_COOKIE = "codelaunch_auth";

const JWT_EXPIRES_IN = "7d";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function getAuthCookieName() {
  return AUTH_COOKIE;
}

/**
 * Create authentication JWT.
 *
 * Token expires after 7 days.
 */
export function createToken(user: AuthUser) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

/**
 * Read and validate the current authentication token.
 *
 * Returns null when:
 * - Cookie doesn't exist
 * - Token is invalid
 * - Token is expired
 * - Required claims are missing
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    ) as jwt.JwtPayload;

    if (
      !decoded.id ||
      !decoded.email ||
      !decoded.role
    ) {
      return null;
    }

    return {
      id: String(decoded.id),
      name: String(decoded.name || ""),
      email: String(decoded.email),
      role: String(decoded.role),
    };
  } catch (error) {
    /*
     * jwt.verify() throws TokenExpiredError when the
     * token has expired.
     *
     * Returning null means the user is unauthenticated.
     */
    if (error instanceof jwt.TokenExpiredError) {
      console.log("Authentication token expired.");
    }

    return null;
  }
}