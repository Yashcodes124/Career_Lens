import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenType?: "access" | "refresh";
}

export interface RefreshJwtPayload extends JwtPayload {
  tokenType: "refresh";
  jti: string;
}

export function signToken(payload: JwtPayload): string {
  const accessPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    tokenType: "access" as const,
  };
  return jwt.sign(accessPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  if (decoded.tokenType === "refresh") {
    throw new Error("Refresh tokens cannot be used as access tokens");
  }
  return decoded;
}

export function signRefreshToken(payload: JwtPayload): string {
  const refreshPayload: RefreshJwtPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    tokenType: "refresh",
    jti: crypto.randomUUID(),
  };
  return jwt.sign(refreshPayload, env.resolvedJwtRefreshSecret, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): RefreshJwtPayload {
  const decoded = jwt.verify(
    token,
    env.resolvedJwtRefreshSecret,
  ) as RefreshJwtPayload;
  if (decoded.tokenType !== "refresh") {
    throw new Error("Invalid token type");
  }
  return decoded;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function tokenHashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
