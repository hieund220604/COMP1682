/*
  Warnings:

  - You are about to drop the column `account_id` on the `top_ups` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `top_ups` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "top_ups" DROP CONSTRAINT "top_ups_account_id_fkey";

-- AlterTable
ALTER TABLE "top_ups" DROP COLUMN "account_id",
ADD COLUMN     "user_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "top_ups" ADD CONSTRAINT "top_ups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
