import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`\nTrueHire Backend API server running on port ${env.PORT}`);
  console.log(`Health Check Endpoint: http://localhost:${env.PORT}/api/health\n`);
});
