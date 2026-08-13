import { apiClient } from '../lib/api-client';
import { User, AuthResponse, LoginCredentials, RegisterCredentials, UpdateProfilePayload } from '../types/auth';

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function registerApi(credentials: RegisterCredentials): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function fetchMeApi(): Promise<User> {
  return apiClient<User>('/auth/me', {
    method: 'GET',
  });
}

export async function updateProfileApi(payload: UpdateProfilePayload): Promise<User> {
  return apiClient<User>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}












