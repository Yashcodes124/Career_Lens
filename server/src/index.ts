import { app } from "./app";
import { env } from "./config/env.js";

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Client URL: ${env.CLIENT_URL}`);
});
