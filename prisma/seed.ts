// import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Seeding database...');

//   try {
//     // Create Organization
//     const org = await prisma.organization.upsert({
//       where: { name: 'Network PCB' },
//       update: {},
//       create: { name: 'Network PCB', isActive: true },
//     });
//     console.log('✅ Organization Seeded:', org);

//     // // Create Roles
//     // const adminRole = await prisma.role.upsert({
//     //   where: { name: 'Admin' },
//     //   update: {},
//     //   create: {
//     //     name: 'Admin',
//     //     description: 'Administrator role',
//     //     isActive: true,
//     //     organization: { connect: { id: org.id } },
//     //   },
//     // });
//     // console.log('✅ Admin Role Seeded:', adminRole);

//     // const employeeRole = await prisma.role.upsert({
//     //   where: { name: 'Employee' },
//     //   update: {},
//     //   create: {
//     //     name: 'Employee',
//     //     description: 'Employee role',
//     //     isActive: true,
//     //     organization: { connect: { id: org.id } },
//     //   },
//     // });

//     // const customerRole = await prisma.role.upsert({
//     //   where: { name: 'Customer' },
//     //   update: {},
//     //   create: {
//     //     name: 'Customer',
//     //     description: 'Customer role',
//     //     isActive: true,
//     //     organization: { connect: { id: org.id } },
//     //   },
//     // });

//     // // Create Permissions
//     // const readPermission = await prisma.permission.upsert({
//     //   where: { name: 'READ_DATA' },
//     //   update: {},
//     //   create: { name: 'READ_DATA', description: 'Permission to read data', isActive: true },
//     // });

//     // const writePermission = await prisma.permission.upsert({
//     //   where: { name: 'WRITE_DATA' },
//     //   update: {},
//     //   create: { name: 'WRITE_DATA', description: 'Permission to write data', isActive: true },
//     // });

//     // // Assign permissions to Employee role
//     // try {
//     //   await prisma.rolePermission.createMany({
//     //     data: [
//     //       { roleId: employeeRole.id, permissionId: readPermission.id },
//     //       { roleId: employeeRole.id, permissionId: writePermission.id },
//     //     ],
//     //     skipDuplicates: true,
//     //   });
//     //   console.log('✅ Permissions assigned to Employee role');
//     // } catch (error) {
//     //   console.warn('⚠️ Error assigning permissions (likely already assigned):', error.message);
//     // }

//     // // Create Users
//     // const hashedPassword = await bcrypt.hash('admin123', 10);
//     // await prisma.user.upsert({
//     //   where: { email: 'admin@networkpcb.com' },
//     //   update: {},
//     //   create: {
//     //     fullname: 'Admin User',
//     //     username: 'admin',
//     //     mobile: '88884255540',
//     //     email: 'admin@networkpcb.com',
//     //     password: hashedPassword,
//     //     roleId: adminRole.id,
//     //     isActive: true,
//     //   },
//     // });

//     // const employeePassword = await bcrypt.hash('employee123', 10);
//     // await prisma.user.upsert({
//     //   where: { email: 'employee@networkpcb.com' },
//     //   update: {},
//     //   create: {
//     //     fullname: 'Krishtopher Lee',
//     //     username: 'kris',
//     //     email: 'kris@networkpcb.com',
//     //     mobile: '88884255541',
//     //     password: employeePassword,
//     //     roleId: employeeRole.id,
//     //     isActive: true,
//     //   },
//     // });

//     console.log('✅ Database seeded successfully!');
//   } catch (error) {
//     console.error('❌ Database seeding failed:', error.message);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main();


import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Models that require CRUD permissions
const MODULES = ['RFQ', 'CUSTOMER', 'MESSAGE', 'SPECIFICATION', 'USER', 'CONTACT'];
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
    description: 'Full system access',
    isActive: true,
    permissions: PERMISSIONS.map(p => p.name), // All permissions
  },
  {
    name: 'Staff',
    description: 'Staff access to RFQ and Contact only',
    isActive: true,
    permissions: PERMISSIONS.filter(p =>
      (p.name.includes('RFQ') || p.name.includes('CONTACT'))
    ).map(p => p.name),
  },
];

async function seedAll() {
  console.log('🌱 Seeding organization...');
  const org = await prisma.organization.upsert({
    where: { name: 'Network PCB' },
    update: {},
    create: { name: 'Network PCB', isActive: true },
  });
  console.log('✅ Organization Seeded:', org);

  console.log('🌱 Seeding permissions...');
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  console.log('✅ Permissions seeded');

  console.log('🌱 Seeding roles...');
  for (const role of ROLES) {
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

    for (const permissionName of role.permissions) {
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

    console.log(`✅ Role "${role.name}" created with ${role.permissions.length} permissions`);
  }

  console.log('🌱 Seeding users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  const staffRole = await prisma.role.findUnique({ where: { name: 'Staff' } });

  if (adminRole) {
    await prisma.user.upsert({
      where: { email: 'admin@networkpcb.com' },
      update: {},
      create: {
        fullname: 'Admin User',
        username: 'admin',
        mobile: '88884255540',
        email: 'admin@networkpcb.com',
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
        mobile: '88884255541',
        email: 'staff@networkpcb.com',
        password: staffPassword,
        roleId: staffRole.id,
        isActive: true,
      },
    });
  }

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