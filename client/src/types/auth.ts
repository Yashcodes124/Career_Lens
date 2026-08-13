export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  targetRole?: string | null;
  preferredLocations?: string[];
  experienceLevel?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
  targetRole?: string;
  preferredLocations?: string[];
  experienceLevel?: string;
}
