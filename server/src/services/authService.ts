import {
  userRepository,
  UserRepository,
} from "../repositories/userRepository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  tokenHashesMatch,
} from "../utils/jwt.js";
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "../validators/authValidator.js";
import { prisma } from "../config/db.js";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  targetRole?: string | null;
  preferredLocations?: string[];
  experienceLevel?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: UserResponse;
  token: string;
  refreshToken?: string;
}

export class AuthService {
  constructor(private userRepo: UserRepository = userRepository) {}

  private sanitizeUser(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      targetRole: user.targetRole || null,
      preferredLocations: user.preferredLocations || [],
      experienceLevel: user.experienceLevel || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async persistRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    if (this.userRepo === userRepository && process.env.NODE_ENV !== "test") {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { refreshTokenHash },
        });
      } catch (err) {
        console.error(
          "[AuthService] Failed to persist refreshTokenHash:",
          err instanceof Error ? err.message : err,
        );
        throw err;
      }
    }
  }

  private async issueTokens(user: any): Promise<AuthResult> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = signToken(payload);
    const refreshToken = signRefreshToken(payload);
    await this.persistRefreshTokenHash(user.id, hashToken(refreshToken));

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(input.email);
    const existing = await this.userRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await this.userRepo.create({
      email: normalizedEmail,
      passwordHash: hashedPassword,
      name: input.name.trim(),
    });

    return this.issueTokens(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(input.email);
    const user = await this.userRepo.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    return this.issueTokens(user);
  }

  async refreshSession(rawRefreshToken: string): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw new Error("Invalid or expired refresh token");
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new Error("Invalid or expired refresh token");
    }

    const user = await this.userRepo.findById(decoded.userId);
    if (!user) {
      throw new Error("Invalid or expired refresh token");
    }

    const incomingHash = hashToken(rawRefreshToken);
    const hasRefreshField = "refreshTokenHash" in (user as object);
    const storedHash = (user as any).refreshTokenHash as
      | string
      | null
      | undefined;

    // Require an active stored hash whenever the persistence layer tracks refreshTokenHash.
    // A null hash means the session was logged out or revoked and MUST NOT mint fresh tokens.
    if (hasRefreshField) {
      if (!storedHash) {
        throw new Error("Invalid or expired refresh token");
      }
      if (!tokenHashesMatch(storedHash, incomingHash)) {
        // Token reuse detected: revoke active session hash
        await this.persistRefreshTokenHash(user.id, null);
        throw new Error("Invalid or expired refresh token");
      }
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.persistRefreshTokenHash(userId, null);
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updateData: {
      name?: string;
      email?: string;
      passwordHash?: string;
      targetRole?: string;
      preferredLocations?: string[];
      experienceLevel?: string;
    } = {};

    if (input.name) {
      updateData.name = input.name.trim();
    }

    if (input.email) {
      const normalizedEmail = normalizeEmail(input.email);
      if (normalizedEmail !== user.email.toLowerCase()) {
        const existing = await this.userRepo.findByEmail(normalizedEmail);
        if (existing) {
          throw new Error("Email is already taken by another user");
        }
        updateData.email = normalizedEmail;
      }
    }

    if (input.password) {
      updateData.passwordHash = await hashPassword(input.password);
    }

    if (input.targetRole) {
      updateData.targetRole = input.targetRole;
    }

    if (input.preferredLocations) {
      updateData.preferredLocations = input.preferredLocations;
    }

    if (input.experienceLevel) {
      updateData.experienceLevel = input.experienceLevel;
    }

    const updatedUser = await this.userRepo.update(userId, updateData);

    // Revoke active refresh sessions when credentials change
    if (input.password) {
      await this.persistRefreshTokenHash(userId, null);
    }

    return this.sanitizeUser(updatedUser);
  }
}

export const authService = new AuthService();
