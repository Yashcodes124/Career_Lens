import { generateAllFixtures } from "./fixtures/buildFixtures.mjs";
import { resetAndSeedTestDatabase, testPrisma } from "./helpers/db.js";

export default async function globalSetup() {
  generateAllFixtures();
  await resetAndSeedTestDatabase();
  await testPrisma.$disconnect();
}
