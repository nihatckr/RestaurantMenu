-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "hours" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "mapUrl" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "dietary" TEXT[] DEFAULT ARRAY[]::TEXT[];
