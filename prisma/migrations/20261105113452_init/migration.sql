-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'DONE');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('FOCUS', 'SHORT_BREAK', 'LONG_BREAK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "categoryId" TEXT,
    "projectId" TEXT,
    "dueDate" TEXT,
    "dueTime" TEXT,
    "estimatedDuration" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "sessionType" "SessionType" NOT NULL,
    "plannedDuration" INTEGER NOT NULL,
    "actualDuration" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'sparkles',
    "color" TEXT NOT NULL DEFAULT '#A8C7E8',
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "target" INTEGER NOT NULL DEFAULT 1,
    "reminderTime" TEXT,
    "startDate" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitCompletion" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completionDate" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'personal',
    "taskId" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "taskId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'cloud',
    "accentColor" TEXT,
    "wallpaper" TEXT NOT NULL DEFAULT 'none',
    "font" TEXT NOT NULL DEFAULT 'nunito',
    "focusDuration" INTEGER NOT NULL DEFAULT 25,
    "shortBreakDuration" INTEGER NOT NULL DEFAULT 5,
    "longBreakDuration" INTEGER NOT NULL DEFAULT 15,
    "sessionsBeforeLongBreak" INTEGER NOT NULL DEFAULT 4,
    "autoStartBreaks" BOOLEAN NOT NULL DEFAULT false,
    "autoStartFocus" BOOLEAN NOT NULL DEFAULT false,
    "musicVolume" INTEGER NOT NULL DEFAULT 60,
    "completionSound" BOOLEAN NOT NULL DEFAULT true,
    "companionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "companionType" TEXT NOT NULL DEFAULT 'cat',
    "companionSize" TEXT NOT NULL DEFAULT 'md',
    "companionAccessory" TEXT NOT NULL DEFAULT 'none',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "showQuotes" BOOLEAN NOT NULL DEFAULT true,
    "showMusicPlayer" BOOLEAN NOT NULL DEFAULT true,
    "focusArea" TEXT NOT NULL DEFAULT 'everything',
    "workStartMin" INTEGER NOT NULL DEFAULT 540,
    "workEndMin" INTEGER NOT NULL DEFAULT 1080,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardName" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "x" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GardenReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoundMix" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "levels" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoundMix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_name_key" ON "Project"("userId", "name");

-- CreateIndex
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");

-- CreateIndex
CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Subtask_taskId_idx" ON "Subtask"("taskId");

-- CreateIndex
CREATE INDEX "FocusSession_userId_startedAt_idx" ON "FocusSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "FocusSession_taskId_idx" ON "FocusSession"("taskId");

-- CreateIndex
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");

-- CreateIndex
CREATE INDEX "HabitCompletion_userId_completionDate_idx" ON "HabitCompletion"("userId", "completionDate");

-- CreateIndex
CREATE UNIQUE INDEX "HabitCompletion_habitId_completionDate_key" ON "HabitCompletion"("habitId", "completionDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_startDateTime_idx" ON "CalendarEvent"("userId", "startDateTime");

-- CreateIndex
CREATE INDEX "TimeBlock_userId_date_idx" ON "TimeBlock"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "GardenReward_userId_idx" ON "GardenReward"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenReward_userId_rewardName_key" ON "GardenReward"("userId", "rewardName");

-- CreateIndex
CREATE INDEX "SoundMix_userId_idx" ON "SoundMix"("userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenReward" ADD CONSTRAINT "GardenReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoundMix" ADD CONSTRAINT "SoundMix_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
