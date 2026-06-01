-- CreateTable
CREATE TABLE "it_access_approver" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "it_access_approver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "it_access_approver_userId_key" ON "it_access_approver"("userId");

-- AddForeignKey
ALTER TABLE "it_access_approver" ADD CONSTRAINT "it_access_approver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_access_approver" ADD CONSTRAINT "it_access_approver_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
