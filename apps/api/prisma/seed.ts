import { PrismaClient, type PermissionAction } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

/**
 * Permission catalog for the Sub Admin RBAC system (Master Admin side only
 * — merchants are single-tenant principals with no internal role system,
 * per the Project Goal's scope). One row per (module, action) pair below.
 */
const PERMISSION_MODULES: Record<string, PermissionAction[]> = {
  admin_user: ["VIEW", "CREATE", "EDIT", "DELETE"],
  role: ["VIEW", "CREATE", "EDIT", "DELETE"],
  merchant: ["VIEW", "EDIT", "APPROVE", "REJECT", "EXPORT"],
  customer: ["VIEW", "EDIT", "EXPORT"],
  category: ["VIEW", "CREATE", "EDIT", "DELETE"],
  brand: ["VIEW", "CREATE", "EDIT", "DELETE"],
  attribute: ["VIEW", "CREATE", "EDIT", "DELETE"],
  product: ["VIEW", "EDIT", "APPROVE", "REJECT", "EXPORT"],
  order: ["VIEW", "EDIT", "EXPORT"],
  return: ["VIEW", "EDIT", "EXPORT"],
  setting: ["VIEW", "EDIT"],
  banner: ["VIEW", "CREATE", "EDIT", "DELETE"],
  report: ["VIEW", "EXPORT"],
};

const RETURN_REASONS = [
  "Item damaged or defective",
  "Wrong item received",
  "Item not as described",
  "Size/fit issue",
  "No longer needed",
  "Better price found elsewhere",
  "Other",
];

async function seedPermissions() {
  const rows = Object.entries(PERMISSION_MODULES).flatMap(([module, actions]) =>
    actions.map((action) => ({
      module,
      action,
      code: `${module}.${action.toLowerCase()}`,
      description: `${action} access to ${module.replace("_", " ")}`,
    })),
  );

  for (const row of rows) {
    await prisma.permission.upsert({
      where: { code: row.code },
      update: { module: row.module, action: row.action, description: row.description },
      create: row,
    });
  }
  console.log(`Seeded ${rows.length} permissions across ${Object.keys(PERMISSION_MODULES).length} modules`);
}

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@mirakart.com";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (!password) {
    console.warn(
      "SEED_SUPER_ADMIN_PASSWORD not set — skipping super admin seed. " +
        "Set it in .env before running `pnpm db:seed` in a real environment.",
    );
    return;
  }

  const passwordHash = await argon2.hash(password);
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      isSuperAdmin: true,
      status: "ACTIVE",
    },
  });
  console.log(`Seeded super admin: ${email}`);
}

async function seedReturnReasons() {
  for (const [index, label] of RETURN_REASONS.entries()) {
    await prisma.returnReason.upsert({
      where: { label },
      update: { sortOrder: index },
      create: { label, sortOrder: index },
    });
  }
  console.log(`Seeded ${RETURN_REASONS.length} return reasons`);
}

async function main() {
  await seedPermissions();
  await seedSuperAdmin();
  await seedReturnReasons();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
