// Greenhouse ATS integration stub
export interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  content: string;
}

export class GreenhouseClient {
  async fetchJobs(_boardToken: string): Promise<GreenhouseJob[]> {
    return [];
  }
}
