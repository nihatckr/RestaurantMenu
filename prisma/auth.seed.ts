import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Bootstrap for a fresh deploy (ADMIN_PLAN.md §3): seeds the single admin (owner)
// credential AND ensures a Business row exists, so the owner can build the whole
// menu (venues → categories → products) from the admin panel with NOTHING else
// pre-seeded. The plaintext password is read from env `ADMIN_PASSWORD` (default
// "1234" for local dev), **bcrypt-hashed here in code**, stored hashed. Idempotent.
// Run: `npm run seed:admin`  (prod: set ADMIN_PASSWORD first, then run once).
const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "1234";
  const passwordHash = bcrypt.hashSync(password, 10);

  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  // The admin panel needs a Business to attach venues/categories/products to
  // (createVenue/createCategory resolve `business.findFirst`). Create one if the
  // DB has none; never overwrite an existing business (name is owner-editable in
  // Settings → İşletme).
  const business = await prisma.business.findFirst({ select: { id: true } });
  if (!business) {
    const name = process.env.BUSINESS_NAME || "İşletme";
    await prisma.business.create({ data: { name } });
    console.log(`Business bootstrapped — name: "${name}" (rename in Settings → İşletme).`);
  }

  console.log(
    `Admin seeded — username: "${username}" (password bcrypt-hashed; plaintext never stored).`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
