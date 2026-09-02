-- CreateTable
CREATE TABLE "WalletTransfer" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fromWalletId" UUID NOT NULL,
    "toWalletId" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletTransfer_userId_date_idx" ON "WalletTransfer"("userId", "date");

-- CreateIndex
CREATE INDEX "WalletTransfer_fromWalletId_idx" ON "WalletTransfer"("fromWalletId");

-- CreateIndex
CREATE INDEX "WalletTransfer_toWalletId_idx" ON "WalletTransfer"("toWalletId");

-- AddForeignKey
ALTER TABLE "WalletTransfer" ADD CONSTRAINT "WalletTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransfer" ADD CONSTRAINT "WalletTransfer_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransfer" ADD CONSTRAINT "WalletTransfer_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
