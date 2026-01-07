-- CreateTable
CREATE TABLE "public"."active_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tabId" VARCHAR(50) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "active_sessions_userId_tabId_key" ON "public"."active_sessions"("userId", "tabId");

-- AddForeignKey
ALTER TABLE "public"."active_sessions" ADD CONSTRAINT "active_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
