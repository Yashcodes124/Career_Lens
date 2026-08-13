import {
  userRepository,
  UserRepository,
} from "../repositories/userRepository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from "../validators/authValidator.js";

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

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash: hashedPassword,
      name: input.name,
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
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
      updateData.name = input.name;
    }

    if (input.email && input.email !== user.email) {
      const existing = await this.userRepo.findByEmail(input.email);
      if (existing) {
        throw new Error("Email is already taken by another user");
      }
      updateData.email = input.email;
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
    return this.sanitizeUser(updatedUser);
  }
}

export const authService = new AuthService();
