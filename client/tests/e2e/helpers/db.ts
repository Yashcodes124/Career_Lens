import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { E2E_USERS, SEEDED_JOBS } from "../fixtures/users.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRequire = createRequire(
  path.resolve(__dirname, "../../../../server/package.json"),
);
const { PrismaClient } = serverRequire("@prisma/client");
const bcrypt = serverRequire("bcryptjs");

export const testPrisma = new PrismaClient();

export async function resetAndSeedTestDatabase() {
  // Clean in reverse foreign-key order
  await testPrisma.aiRequestAudit.deleteMany();
  await testPrisma.ontologyAlias.deleteMany();
  await testPrisma.evaluation.deleteMany();
  await testPrisma.interviewQuestion.deleteMany();
  await testPrisma.interview.deleteMany();
  await testPrisma.userSkill.deleteMany();
  await testPrisma.application.deleteMany();
  await testPrisma.savedJob.deleteMany();
  await testPrisma.resume.deleteMany();
  await testPrisma.job.deleteMany();
  await testPrisma.user.deleteMany();

  const passwordHashA = await bcrypt.hash(E2E_USERS.candidateA.password, 10);
  const passwordHashB = await bcrypt.hash(E2E_USERS.candidateB.password, 10);
  const passwordHashAdmin = await bcrypt.hash(E2E_USERS.admin.password, 10);

  const userA = await testPrisma.user.create({
    data: {
      name: E2E_USERS.candidateA.name,
      email: E2E_USERS.candidateA.email,
      passwordHash: passwordHashA,
      role: "USER",
      experienceLevel: "SENIOR",
    },
  });

  const userB = await testPrisma.user.create({
    data: {
      name: E2E_USERS.candidateB.name,
      email: E2E_USERS.candidateB.email,
      passwordHash: passwordHashB,
      role: "USER",
    },
  });

  const adminUser = await testPrisma.user.create({
    data: {
      name: E2E_USERS.admin.name,
      email: E2E_USERS.admin.email,
      passwordHash: passwordHashAdmin,
      role: "ADMIN",
    },
  });

  const jobs = [];
  for (const j of SEEDED_JOBS) {
    const created = await testPrisma.job.create({
      data: {
        ...j,
        lastSyncedAt: new Date(),
      },
    });
    jobs.push(created);
  }

  return { userA, userB, adminUser, jobs };
}