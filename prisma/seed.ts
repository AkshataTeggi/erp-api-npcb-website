// import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// const MODULES = ['RFQ', 'CUSTOMER', 'USER', 'CONTACT'];
// const CRUD_ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

// const PERMISSIONS = MODULES.flatMap(module =>
//   CRUD_ACTIONS.map(action => ({
//     name: `${action}_${module}`,
//     description: `${action.charAt(0)}${action.slice(1).toLowerCase()} ${module.toLowerCase()} data`,
//     isActive: true,
//   }))
// );

// const ROLES = [
//   {
//     name: 'Admin',
//     description: 'Full access to all modules',
//     isActive: true,
//     modules: MODULES, // Full access
//   },
//   {
//     name: 'Staff',
//     description: 'Limited access to RFQ and Contact only',
//     isActive: true,
//     modules: ['RFQ', 'CONTACT'], // Limited access
//   },
// ];

// async function seedAll() {
//   console.log('🌱 Seeding organization...');
//   const org = await prisma.organization.upsert({
//     where: { name: 'Network PCB' },
//     update: {},
//     create: { name: 'Network PCB', isActive: true },
//   });
//   console.log('✅ Organization Seeded:', org.name);

//   console.log('🌱 Seeding permissions...');
//   for (const permission of PERMISSIONS) {
//     await prisma.permission.upsert({
//       where: { name: permission.name },
//       update: {},
//       create: permission,
//     });
//   }
//   console.log(`✅ ${PERMISSIONS.length} Permissions seeded`);

//   console.log('🌱 Seeding roles...');
//   for (const role of ROLES) {
//     const allowedPermissions = PERMISSIONS
//       .filter(p => role.modules.includes(p.name.split('_')[1]))
//       .map(p => p.name);

//     const createdRole = await prisma.role.upsert({
//       where: { name: role.name },
//       update: { description: role.description, isActive: role.isActive },
//       create: {
//         name: role.name,
//         description: role.description,
//         isActive: role.isActive,
//         organization: { connect: { id: org.id } },
//       },
//     });

//     await prisma.rolePermission.deleteMany({
//       where: { roleId: createdRole.id },
//     });

//     for (const permissionName of allowedPermissions) {
//       const permission = await prisma.permission.findUnique({
//         where: { name: permissionName },
//       });

//       if (permission) {
//         await prisma.rolePermission.create({
//           data: {
//             roleId: createdRole.id,
//             permissionId: permission.id,
//           },
//         });
//       }
//     }

//     console.log(`✅ Role "${role.name}" created with ${allowedPermissions.length} permissions`);
//   }

//   console.log('🌱 Seeding users...');

//   const adminPassword = await bcrypt.hash('admin123', 10);
//   const staffPassword = await bcrypt.hash('staff123', 10);

//   const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
//   const staffRole = await prisma.role.findUnique({ where: { name: 'Staff' } });

//   // Uncomment if you want to seed users
//   /*
//   if (adminRole) {
//     await prisma.user.upsert({
//       where: { email: 'admin@networkpcb.com' },
//       update: {},
//       create: {
//         fullname: 'Admin User',
//         username: 'admin',
//         email: 'admin@networkpcb.com',
//         mobile: '88884255540',
//         password: adminPassword,
//         roleId: adminRole.id,
//         isActive: true,
//       },
//     });
//   }

//   if (staffRole) {
//     await prisma.user.upsert({
//       where: { email: 'staff@networkpcb.com' },
//       update: {},
//       create: {
//         fullname: 'Staff Member',
//         username: 'staff',
//         email: 'staff@networkpcb.com',
//         mobile: '88884255541',
//         password: staffPassword,
//         roleId: staffRole.id,
//         isActive: true,
//       },
//     });
//   }
//   */

//   console.log('🎉 Seeding completed!');
// }

// async function main() {
//   try {
//     await seedAll();
//   } catch (error) {
//     console.error('❌ Seeding failed:', error);
//     process.exit(1);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main();


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULES = ['RFQ', 'CUSTOMER', 'USER', 'CONTACT'];
const CRUD_ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

const BASE_PERMISSIONS = MODULES.flatMap(module =>
  CRUD_ACTIONS.map(action => ({
    name: `${action}_${module}`,
    description: `${action.charAt(0)}${action.slice(1).toLowerCase()} ${module.toLowerCase()} data`,
    isActive: true,
  })),
);

const EXTENDED_RFQ_PERMISSIONS = [
  { name: 'CREATE_RFQ', description: 'Create a new RFQ', isActive: true },
  { name: 'VIEW_RFQ', description: 'View a specific RFQ', isActive: true },
  { name: 'LIST_RFQS', description: 'Get all RFQs (paginated)', isActive: true },
  { name: 'SEARCH_RFQS', description: 'Search RFQs', isActive: true },
  { name: 'ARCHIVE_RFQ', description: 'Archive an RFQ', isActive: true },
  { name: 'UNARCHIVE_RFQ', description: 'Unarchive an RFQ', isActive: true },
  { name: 'TRASH_RFQ', description: 'Move RFQ to trash', isActive: true },
  { name: 'DELETE_RFQ', description: 'Soft delete an RFQ', isActive: true },
  { name: 'RESTORE_RFQ', description: 'Restore RFQ from trash', isActive: true },
  { name: 'PERMANENT_DELETE_RFQ', description: 'Permanently delete a trashed RFQ', isActive: true },
  { name: 'VIEW_ARCHIVED_RFQ', description: 'View archived RFQs', isActive: true },
  { name: 'VIEW_TRASHED_RFQ', description: 'View soft-deleted RFQs', isActive: true },
  { name: 'UPDATE_RFQ', description: 'Update existing RFQ', isActive: true },
  { name: 'DOWNLOAD_RFQ_FILE', description: 'Download/serve an RFQ file', isActive: true },
  { name: 'DELETE_RFQ_FILE', description: 'Delete an RFQ file', isActive: true },
  { name: 'CREATE_RFQ_NOTIFICATION', description: 'Create RFQ notifications', isActive: true },
];

const PERMISSIONS = [...BASE_PERMISSIONS, ...EXTENDED_RFQ_PERMISSIONS];

const ROLES = [
  {
    name: 'Admin',
    description: 'Full access to all modules',
    isActive: true,
    modules: MODULES,
  },
  {
    name: 'Staff',
    description: 'Limited access to RFQ and Contact only',
    isActive: true,
    modules: ['RFQ', 'CONTACT'],
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
    const allowedPermissions = PERMISSIONS.filter(p => {
      const parts = p.name.split('_');
      const moduleName = parts.length > 1 ? parts[1] : parts[0];
      return role.modules.includes(moduleName);
    }).map(p => p.name);

    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        isActive: role.isActive,
      },
      create: {
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        organization: { connect: { id: org.id } },
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: createdRole.id } });

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

  console.log('✅ Skipped seeding users (as per request)');
  console.log('🎉 Seeding completed!');
}

async function main() {
  try {
    await seedAll();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

