ALTER TABLE "SavingGoal"
ADD COLUMN "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "shareCode" CHAR(6);

CREATE UNIQUE INDEX "SavingGoal_shareCode_key" ON "SavingGoal"("shareCode");

CREATE TABLE "SavingGoalMember" (
    "savingGoalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingGoalMember_pkey" PRIMARY KEY ("savingGoalId", "userId")
);

CREATE INDEX "SavingGoalMember_userId_idx" ON "SavingGoalMember"("userId");

ALTER TABLE "SavingGoalMember"
ADD CONSTRAINT "SavingGoalMember_savingGoalId_fkey"
FOREIGN KEY ("savingGoalId") REFERENCES "SavingGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavingGoalMember"
ADD CONSTRAINT "SavingGoalMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
