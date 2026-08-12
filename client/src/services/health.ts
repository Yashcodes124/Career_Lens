import { apiClient } from '../lib/api-client';

export interface HealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  database: {
    connected: boolean;
    status: string;
  };
  uptime: number;
}

export async function fetchHealth(): Promise<HealthData> {
  return apiClient<HealthData>('/health');
}
