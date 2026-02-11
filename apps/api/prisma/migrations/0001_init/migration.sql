CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Order" (
  "id" TEXT PRIMARY KEY,
  "wooOrderId" INTEGER UNIQUE NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "customerFirstName" TEXT,
  "customerLastName" TEXT,
  "customerEmail" TEXT,
  "paymentConfirmed" BOOLEAN NOT NULL DEFAULT FALSE,
  "orderMarkedProcessed" BOOLEAN NOT NULL DEFAULT FALSE,
  "matchedPaymentId" TEXT,
  "createdAtWoo" TIMESTAMP NOT NULL,
  "lastSyncedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "PaymentEvent" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "providerRef" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "payerEmail" TEXT,
  "payerName" TEXT,
  "detectedAt" TIMESTAMP NOT NULL,
  "confidence" INTEGER NOT NULL,
  "rawSnippet" TEXT,
  "matchedOrderId" TEXT,
  "decision" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "FollowUpTask" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "messageText" TEXT NOT NULL,
  "gmailDraftId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "SystemStatus" (
  "id" TEXT PRIMARY KEY,
  "lastSuccessAt" TIMESTAMP,
  "lastError" TEXT,
  "healthy" BOOLEAN NOT NULL DEFAULT FALSE,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "IntegrationSecret" (
  "id" TEXT PRIMARY KEY,
  "encrypted" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actor" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "details" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_order_fkey" FOREIGN KEY ("matchedOrderId") REFERENCES "Order"("id");
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_order_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id");
