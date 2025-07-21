

// import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// // Models that require CRUD permissions
// const MODULES = ['RFQ', 'CUSTOMER', 'MESSAGE', 'SPECIFICATION', 'USER', 'CONTACT'];
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
//     description: 'Full system access',
//     isActive: true,
//     permissions: PERMISSIONS.map(p => p.name), // All permissions
//   },
//   {
//     name: 'Staff',
//     description: 'Staff access to RFQ and Contact only',
//     isActive: true,
//     permissions: PERMISSIONS.filter(p =>
//       (p.name.includes('RFQ') || p.name.includes('CONTACT'))
//     ).map(p => p.name),
//   },
// ];

// async function seedAll() {
//   console.log('🌱 Seeding organization...');
//   const org = await prisma.organization.upsert({
//     where: { name: 'Network PCB' },
//     update: {},
//     create: { name: 'Network PCB', isActive: true },
//   });
//   console.log('✅ Organization Seeded:', org);

//   console.log('🌱 Seeding permissions...');
//   for (const permission of PERMISSIONS) {
//     await prisma.permission.upsert({
//       where: { name: permission.name },
//       update: {},
//       create: permission,
//     });
//   }
//   console.log('✅ Permissions seeded');

//   console.log('🌱 Seeding roles...');
//   for (const role of ROLES) {
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

//     for (const permissionName of role.permissions) {
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

//     console.log(`✅ Role "${role.name}" created with ${role.permissions.length} permissions`);
//   }

//   console.log('🌱 Seeding users...');
//   const adminPassword = await bcrypt.hash('admin123', 10);
//   const staffPassword = await bcrypt.hash('staff123', 10);

//   const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
//   const staffRole = await prisma.role.findUnique({ where: { name: 'Staff' } });

//   if (adminRole) {
//     await prisma.user.upsert({
//       where: { email: 'admin@networkpcb.com' },
//       update: {},
//       create: {
//         fullname: 'Admin User',
//         username: 'admin',
//         mobile: '88884255540',
//         email: 'admin@networkpcb.com',
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
//         mobile: '88884255541',
//         email: 'staff@networkpcb.com',
//         password: staffPassword,
//         roleId: staffRole.id,
//         isActive: true,
//       },
//     });
//   }

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
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear old data
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  const modules = ['RFQ', 'CUSTOMER', 'MESSAGE', 'SPECIFICATION', 'USER', 'CONTACT'];
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

  const permissions = await Promise.all(
    modules.flatMap(module =>
      actions.map(action =>
        prisma.permission.create({
          data: {
            name: `${action}_${module}`,
            description: `${action} permission for ${module}`,
          },
        })
      )
    )
  );

  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      permissions: {
        connect: permissions.map(p => ({ id: p.id })),
      },
    },
  });

  const staffRole = await prisma.role.create({
    data: {
      name: 'STAFF',
      permissions: {
        connect: permissions.filter(p => !p.name.startsWith('DELETE')).map(p => ({ id: p.id })),
      },
    },
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // const adminUser = await prisma.user.create({
  //   data: {
  //     username: 'admin',
  //     email: 'admin@example.com',
  //     password: hashedPassword,
  //     userRoles: {
  //       create: [
  //         {
  //           role: {
  //             connect: { id: adminRole.id },
  //           },
  //         },
  //       ],
  //     },
  //   },
  // });

  // const staffUser = await prisma.user.create({
  //   data: {
  //     username: 'staff',s
  //     email: 'staff@example.com',
  //     password: hashedPassword,
  //     userRoles: {
  //       create: [
  //         {
  //           role: {
  //             connect: { id: staffRole.id },
  //           },
  //         },
  //       ],
  //     },
  //   },
  // });

  console.log('Seed complete: Admin and Staff created with roles.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
