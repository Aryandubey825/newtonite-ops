-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('VIEWER', 'MEMBER', 'LEAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "WorkItemType" AS ENUM ('INCIDENT', 'CUSTOMER_ISSUE', 'PAYMENT', 'COMPLIANCE', 'TASK');

-- CreateEnum
CREATE TYPE "WorkItemPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityEventType" AS ENUM ('CREATED', 'STATUS_TRANSITION', 'ASSIGNED', 'PRIORITY_CHANGED', 'DETAILS_UPDATED', 'COMMENT_ADDED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_items" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "WorkItemType" NOT NULL DEFAULT 'TASK',
    "priority" "WorkItemPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "WorkItemStatus" NOT NULL DEFAULT 'OPEN',
    "assignee_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_events" (
    "id" TEXT NOT NULL,
    "work_item_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "event_type" "ActivityEventType" NOT NULL,
    "old_state" JSONB,
    "new_state" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "work_item_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "key" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_path" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "status_code" INTEGER,
    "response_body" JSONB,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "outbox_jobs" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE INDEX "team_memberships_user_id_idx" ON "team_memberships"("user_id");

-- CreateIndex
CREATE INDEX "team_memberships_team_id_idx" ON "team_memberships"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_memberships_user_id_team_id_key" ON "team_memberships"("user_id", "team_id");

-- CreateIndex
CREATE INDEX "work_items_team_id_status_created_at_id_idx" ON "work_items"("team_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "work_items_assignee_id_status_created_at_id_idx" ON "work_items"("assignee_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "work_items_priority_created_at_idx" ON "work_items"("priority", "created_at" DESC);

-- CreateIndex
CREATE INDEX "work_items_created_at_id_idx" ON "work_items"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "activity_events_work_item_id_created_at_idx" ON "activity_events"("work_item_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_events_actor_id_idx" ON "activity_events"("actor_id");

-- CreateIndex
CREATE INDEX "comments_work_item_id_created_at_idx" ON "comments"("work_item_id", "created_at" ASC);

-- CreateIndex
CREATE INDEX "idempotency_keys_user_id_idx" ON "idempotency_keys"("user_id");

-- CreateIndex
CREATE INDEX "outbox_jobs_status_next_run_at_idx" ON "outbox_jobs"("status", "next_run_at");

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_work_item_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_work_item_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

