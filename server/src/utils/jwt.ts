import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshJwtPayload extends JwtPayload {
  tokenType: "refresh";
  jti: string;
}

const REFRESH_EXPIRES_IN =
  (process.env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "7d";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function signRefreshToken(payload: JwtPayload): string {
  const refreshPayload: RefreshJwtPayload = {
    ...payload,
    tokenType: "refresh",
    jti: crypto.randomUUID(),
  };
  return jwt.sign(refreshPayload, env.JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export function verifyRefreshToken(token: string): RefreshJwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as RefreshJwtPayload;
  if (decoded.tokenType !== "refresh") {
    throw new Error("Invalid token type");
  }
  return decoded;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
