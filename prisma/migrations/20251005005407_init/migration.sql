-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" CITEXT NOT NULL,
    "is_subscribed" BOOLEAN NOT NULL DEFAULT false,
    "latitude1" DOUBLE PRECISION NOT NULL,
    "longitude1" DOUBLE PRECISION NOT NULL,
    "latitude2" DOUBLE PRECISION,
    "longitude2" DOUBLE PRECISION,
    "loc1" geography NOT NULL,
    "loc2" geography,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
