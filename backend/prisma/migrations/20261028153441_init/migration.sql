-- CreateEnum
CREATE TYPE "RoleApp" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "RoleOrg" AS ENUM ('MEMBER', 'MANAGER', 'OWNER');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'BANNED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('SOCIAL', 'ENVIRONMENT', 'CULTURAL');

-- CreateEnum
CREATE TYPE "InterestCategory" AS ENUM ('ENV_FLOWER_POWER', 'ENV_CLEAN', 'ENV_DO', 'SOCIAL_SHARE', 'SOCIAL_MEET', 'SOCIAL_DO', 'CULTURAL_LEARN', 'CULTURAL_CREATE', 'CULTURAL_DO');

-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PointReason" AS ENUM ('ACTION_COMPLETED', 'ACTION_PARTICIPATED', 'ACTION_PARTICIPANTS', 'ORGANIZATION_MEMBER_JOINED', 'ORGANIZATION_MEMBER_LEFT', 'ORGANIZATION_MEMBER_REMOVED', 'ORGANIZATION_MEMBER_BANNED', 'USER_SUSPENDED', 'USER_BANNED_FROM_ORGANIZATION', 'ADMIN_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PiouPiouStatus" AS ENUM ('PETIT_PIOUPIOU', 'GRAND_PIOUPIOU', 'PIOUPIOU_OR');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'FRIENDS_ONLY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACTION_MIN_REACHED', 'ACTION_MAX_REACHED', 'ACTION_COMMENT', 'FRIEND_REQUEST', 'ORGANIZATION_JOIN_REQUEST', 'ORGANIZATION_COMMENT', 'ACTION_APPROVED', 'ACTION_STATUS_CHANGED', 'NEW_MESSAGE', 'ORGANIZATION_OWNERSHIP_TRANSFERRED', 'ORGANIZATION_JOIN_REQUEST_REJECTED', 'ORGANIZATION_MEMBER_BANNED', 'ORGANIZATION_MEMBERSHIP_ACTIVATED', 'ORGANIZATION_MEMBER_REMOVED', 'ORGANIZATION_MEMBER_LEFT', 'ORGANIZATION_ROLE_CHANGED', 'ACTION_PARTICIPATION_CHANGED', 'ORGANIZATION_COMMENT_DELETED');

-- CreateTable
CREATE TABLE "User" (
    "user_id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "RoleApp" NOT NULL DEFAULT 'USER',
    "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "refresh_token" TEXT,
    "last_seen_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "session_id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "user_id" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "description" TEXT,
    "profile_picture" TEXT,
    "location" DOUBLE PRECISION[],
    "commune" TEXT,
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "user_id" BIGINT NOT NULL,
    "interest" "InterestCategory" NOT NULL,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("user_id","interest")
);

-- CreateTable
CREATE TABLE "Organization" (
    "organization_id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "organization_status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT NOT NULL,
    "location" DOUBLE PRECISION[],
    "creator_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("organization_id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "organization_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "role" "RoleOrg" NOT NULL DEFAULT 'MEMBER',
    "validated_by_org_man" BOOLEAN NOT NULL DEFAULT false,
    "validated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("organization_id","user_id")
);

-- CreateTable
CREATE TABLE "Action" (
    "action_id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creator_id" BIGINT NOT NULL,
    "organization_id" BIGINT,
    "min_participants" INTEGER NOT NULL DEFAULT 3,
    "max_participants" INTEGER,
    "location" DOUBLE PRECISION[],
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "category" "Category" NOT NULL,
    "images_before" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images_after" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validated_by_user_id" BIGINT,
    "validated_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("action_id")
);

-- CreateTable
CREATE TABLE "action_comments" (
    "comment_id" BIGSERIAL NOT NULL,
    "content" VARCHAR(1024) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "action_id" BIGINT NOT NULL,

    CONSTRAINT "action_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "organization_comments" (
    "comment_id" BIGSERIAL NOT NULL,
    "content" VARCHAR(1024) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "organization_id" BIGINT NOT NULL,

    CONSTRAINT "organization_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "Participation" (
    "action_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("action_id","user_id")
);

-- CreateTable
CREATE TABLE "FriendRequest" (
    "friend_request_id" BIGSERIAL NOT NULL,
    "requester_id" BIGINT NOT NULL,
    "addressee_id" BIGINT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("friend_request_id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "user1_id" BIGINT NOT NULL,
    "user2_id" BIGINT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "blocked_by_user_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("user1_id","user2_id")
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "point_transaction_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" "PointReason" NOT NULL,
    "event_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("point_transaction_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "user_id" BIGINT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("user_id","type")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "message_id" BIGSERIAL NOT NULL,
    "sender_id" BIGINT NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "content" VARCHAR(280) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuthSession_user_id_idx" ON "AuthSession"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "PointTransaction_event_key_key" ON "PointTransaction"("event_key");

-- CreateIndex
CREATE INDEX "Notification_user_id_read_idx" ON "Notification"("user_id", "read");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE INDEX "DirectMessage_sender_id_receiver_id_created_at_idx" ON "DirectMessage"("sender_id", "receiver_id", "created_at");

-- CreateIndex
CREATE INDEX "DirectMessage_receiver_id_sender_id_created_at_idx" ON "DirectMessage"("receiver_id", "sender_id", "created_at");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_validated_by_user_id_fkey" FOREIGN KEY ("validated_by_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_comments" ADD CONSTRAINT "action_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_comments" ADD CONSTRAINT "action_comments_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "Action"("action_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_comments" ADD CONSTRAINT "organization_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_comments" ADD CONSTRAINT "organization_comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "Action"("action_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_blocked_by_user_id_fkey" FOREIGN KEY ("blocked_by_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
