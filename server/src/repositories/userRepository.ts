import { prisma } from "../config/db.js";
import { User, Role } from "@prisma/client";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  role?: Role;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  passwordHash?: string;
  targetRole?: string;
  preferredLocations?: string[];
  experienceLevel?: string;
}

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role || Role.USER,
      },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}

export const userRepository = new UserRepository();
