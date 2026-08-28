import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Seeds the single admin (owner) credential — ADMIN_PLAN.md §3. The plaintext
// password is read from env `ADMIN_PASSWORD` (default "1234" for local dev),
// **bcrypt-hashed here in code**, and stored hashed in the DB. Idempotent (upsert).
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
