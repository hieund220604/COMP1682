/*
  Warnings:

  - A unique constraint covering the columns `[group_id,user_id]` on the table `group_members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "group_members" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "settlements" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "vnpay_trans_date" TIMESTAMP(3),
ADD COLUMN     "vnpay_txn_ref" TEXT;

-- CreateTable
CREATE TABLE "invites" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "email_invite" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expired_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invites_group_id_email_invite_key" ON "invites"("group_id", "email_invite");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_user_id_key" ON "group_members"("group_id", "user_id");

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
