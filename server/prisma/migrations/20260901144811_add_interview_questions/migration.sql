-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "plan" JSONB;

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "answer" TEXT,
    "feedback" TEXT,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_questions_interviewId_idx" ON "interview_questions"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "interview_questions_interviewId_order_key" ON "interview_questions"("interviewId", "order");

-- CreateIndex
CREATE INDEX "interviews_userId_idx" ON "interviews"("userId");

-- CreateIndex
CREATE INDEX "interviews_applicationId_idx" ON "interviews"("applicationId");

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
