import { describe, expect, it, vi, beforeEach } from "vitest";

const hoisted = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("../config/db", () => ({
  default: {
    user: {
      findUnique: hoisted.userFindUnique,
      create: hoisted.userCreate,
      update: hoisted.userUpdate,
    },
  },
  prisma: {
    user: {
      findUnique: hoisted.userFindUnique,
      create: hoisted.userCreate,
      update: hoisted.userUpdate,
    },
  },
}));

import {
  signToken,
  verifyToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from "../utils/jwt";
import { AuthService } from "../services/authService";
import {
  validateProductionEnv,
  sanitizeEnvSource,
  normalizePostgresUrl,
  DEFAULT_DEV_DATABASE_URL,
} from "../config/env";
import { sanitizeExternalHttpUrl } from "../services/jobService";
import { isValidGreenhouseBoardToken } from "../integrations/jobs/greenhouse/greenhouseClient";

describe("Security Hardening Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("JWT access vs refresh token isolation", () => {
    it("rejects refresh tokens when verified as access tokens", () => {
      const refresh = signRefreshToken({
        userId: "u1",
        email: "user@example.com",
        role: "USER",
      });
      expect(() => verifyToken(refresh)).toThrow();
    });

    it("rejects access tokens when verified as refresh tokens", () => {
      const access = signToken({
        userId: "u1",
        email: "user@example.com",
        role: "USER",
      });
      expect(() => verifyRefreshToken(access)).toThrow();
    });

    it("accepts properly typed access and refresh tokens", () => {
      const access = signToken({
        userId: "u1",
        email: "user@example.com",
        role: "USER",
      });
      const refresh = signRefreshToken({
        userId: "u1",
        email: "user@example.com",
        role: "USER",
      });
      expect(verifyToken(access).userId).toBe("u1");
      expect(verifyRefreshToken(refresh).userId).toBe("u1");
    });
  });

  describe("Post-logout refresh token revocation", () => {
    it("rejects a valid refresh token after logout cleared refreshTokenHash to null", async () => {
      const refresh = signRefreshToken({
        userId: "u1",
        email: "user@example.com",
        role: "USER",
      });
      const mockRepo = {
        findById: vi.fn().mockResolvedValue({
          id: "u1",
          email: "user@example.com",
          name: "User",
          role: "USER",
          refreshTokenHash: null,
        }),
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      };
      const authService = new AuthService(mockRepo as any);

      await expect(authService.refreshSession(refresh)).rejects.toThrow(
        /revoked|expired|invalid/i,
      );
    });

    it("rotates tokens when refreshTokenHash matches stored hash", async () => {
      const refresh = signRefreshToken({
        userId: "u1",
        email: "user@example.com",
        role: "USER",
      });
      const mockRepo = {
        findById: vi.fn().mockResolvedValue({
          id: "u1",
          email: "user@example.com",
          name: "User",
          role: "USER",
          refreshTokenHash: hashToken(refresh),
        }),
        findByEmail: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      };
      hoisted.userUpdate.mockResolvedValue({});
      const authService = new AuthService(mockRepo as any);

      const session = await authService.refreshSession(refresh);
      expect(session.token).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();
      expect(verifyToken(session.token).userId).toBe("u1");
      expect(verifyRefreshToken(session.refreshToken!).userId).toBe("u1");
    });
  });

  describe("External URL & ATS board token validation", () => {
    it("allows valid http and https URLs and blocks javascript/data schemes", () => {
      expect(sanitizeExternalHttpUrl("https://boards.greenhouse.io/stripe")).toBe(
        "https://boards.greenhouse.io/stripe",
      );
      expect(sanitizeExternalHttpUrl(undefined)).toBeNull();
      expect(() =>
        sanitizeExternalHttpUrl("javascript:alert(document.cookie)"),
      ).toThrow(/http/i);
      expect(() =>
        sanitizeExternalHttpUrl("data:text/html,<script>alert(1)</script>"),
      ).toThrow(/http/i);
    });

    it("validates Greenhouse board token slugs strictly", () => {
      expect(isValidGreenhouseBoardToken("stripe")).toBe(true);
      expect(isValidGreenhouseBoardToken("my-company_2026")).toBe(true);
      expect(isValidGreenhouseBoardToken("../admin")).toBe(false);
      expect(isValidGreenhouseBoardToken("stripe?foo=bar")).toBe(false);
      expect(isValidGreenhouseBoardToken("stripe/jobs")).toBe(false);
      expect(isValidGreenhouseBoardToken("")).toBe(false);
    });
  });

  describe("Environment sanitization & PostgreSQL datasource validation", () => {
    it("strips empty string env vars to undefined so Zod defaults apply", () => {
      const cleaned = sanitizeEnvSource({
        DATABASE_URL: "",
        DIRECT_URL: "   ",
        GEMINI_MODEL: "gemini-flash-latest",
      });
      expect(cleaned.DATABASE_URL).toBeUndefined();
      expect(cleaned.DIRECT_URL).toBeUndefined();
      expect(cleaned.GEMINI_MODEL).toBe("gemini-flash-latest");
    });

    it("normalizes empty or non-postgres URLs to the default dev datasource URL in development", () => {
      expect(normalizePostgresUrl("", DEFAULT_DEV_DATABASE_URL, "development")).toBe(
        DEFAULT_DEV_DATABASE_URL,
      );
      expect(
        normalizePostgresUrl("mysql://user:pass@localhost/db", DEFAULT_DEV_DATABASE_URL, "development"),
      ).toBe(DEFAULT_DEV_DATABASE_URL);
      expect(
        normalizePostgresUrl("postgres://user:pass@db.example.com:5432/app", DEFAULT_DEV_DATABASE_URL, "development"),
      ).toBe("postgres://user:pass@db.example.com:5432/app");
      expect(
        normalizePostgresUrl("postgresql://user:pass@db.example.com:5432/app", DEFAULT_DEV_DATABASE_URL, "production"),
      ).toBe("postgresql://user:pass@db.example.com:5432/app");
    });
  });

  describe("Production environment fail-closed checks", () => {
    it("flags default JWT_SECRET, default DATABASE_URL, and wildcard CLIENT_URL in production", () => {
      const errors = validateProductionEnv(
        { NODE_ENV: "production" },
        {
          NODE_ENV: "production",
          PORT: 5000,
          DATABASE_URL:
            "postgresql://career_lens_user:@localhost:5433/career_lens?schema=public",
          CLIENT_URL: "*",
          SERVER_URL: "https://api.example.com",
          JWT_SECRET: "truehire-secure-jwt-secret-key-2026",
          JWT_EXPIRES_IN: "7d",
          JWT_REFRESH_EXPIRES_IN: "7d",
          ENABLE_STARTUP_JOB_SYNC: "true",
          JOB_SYNC_INTERVAL_HOURS: 6,
          AI_PROVIDER: "groq",
          AI_TIMEOUT_MS: 60000,
          GROQ_BASE_URL: "https://api.groq.com/openai/v1",
          GROQ_MODEL: "qwen/qwen3.8-27b",
          GROQ_FAST_MODEL: "openai/gpt-oss-20b",
          GROQ_EVALUATION_MODEL: "openai/gpt-oss-120b",
          NVIDIA_BASE_URL: "https://integrate.api.nvidia.com/v1",
          NVIDIA_MODEL: "meta/llama-3.3-70b-instruct",
          GEMINI_BASE_URL:
            "https://generativelanguage.googleapis.com/v1beta/openai/",
          GEMINI_MODEL: "gemini-flash-latest",
          OLLAMA_BASE_URL: "http://localhost:11434",
          OLLAMA_MODEL: "qwen3:4b",
          GREENHOUSE_BOARD_TOKEN: "stripe",
          GREENHOUSE_COMPANY: "stripe",
          GREENHOUSE_BOARDS: "stripe",
        },
      );
      expect(errors.length).toBe(3);
    });
  });
});
