import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MODULES = ['RFQ', 'CUSTOMER', 'USER', 'CONTACT'];
const CRUD_ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

const PERMISSIONS = MODULES.flatMap(module =>
  CRUD_ACTIONS.map(action => ({
    name: `${action}_${module}`,
    description: `${action.charAt(0)}${action.slice(1).toLowerCase()} ${module.toLowerCase()} data`,
    isActive: true,
  }))
);

const ROLES = [
  {
    name: 'Admin',
    description: 'Full access to all modules',
    isActive: true,
    modules: MODULES, // Full access
  },
  {
    name: 'Staff',
    description: 'Limited access to RFQ and Contact only',
    isActive: true,
    modules: ['RFQ', 'CONTACT'], // Limited access
  },
];

async function seedAll() {
  console.log('🌱 Seeding organization...');
  const org = await prisma.organization.upsert({
    where: { name: 'Network PCB' },
    update: {},
    create: { name: 'Network PCB', isActive: true },
  });
  console.log('✅ Organization Seeded:', org.name);

  console.log('🌱 Seeding permissions...');
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  console.log(`✅ ${PERMISSIONS.length} Permissions seeded`);

  console.log('🌱 Seeding roles...');
  for (const role of ROLES) {
    const allowedPermissions = PERMISSIONS
      .filter(p => role.modules.includes(p.name.split('_')[1]))
      .map(p => p.name);

    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description, isActive: role.isActive },
      create: {
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        organization: { connect: { id: org.id } },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: createdRole.id },
    });

    for (const permissionName of allowedPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: createdRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    console.log(`✅ Role "${role.name}" created with ${allowedPermissions.length} permissions`);
  }

  console.log('🌱 Seeding users...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  const staffRole = await prisma.role.findUnique({ where: { name: 'Staff' } });

  // Uncomment if you want to seed users
  /*
  if (adminRole) {
    await prisma.user.upsert({
      where: { email: 'admin@networkpcb.com' },
      update: {},
      create: {
        fullname: 'Admin User',
        username: 'admin',
        email: 'admin@networkpcb.com',
        mobile: '88884255540',
        password: adminPassword,
        roleId: adminRole.id,
        isActive: true,
      },
    });
  }

  if (staffRole) {
    await prisma.user.upsert({
      where: { email: 'staff@networkpcb.com' },
      update: {},
      create: {
        fullname: 'Staff Member',
        username: 'staff',
        email: 'staff@networkpcb.com',
        mobile: '88884255541',
        password: staffPassword,
        roleId: staffRole.id,
        isActive: true,
      },
    });
  }
  */

  console.log('🎉 Seeding completed!');
}

async function main() {
  try {
    await seedAll();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
