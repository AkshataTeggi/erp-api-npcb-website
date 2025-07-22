/* eslint-disable prettier/prettier */
// // import { Injectable } from '@nestjs/common';
// // import { PrismaService } from 'prisma/prisma.service';

// // @Injectable()
// // export class AuthorizationService {
// //     constructor(private readonly prisma: PrismaService) { }

// //     // Assign a role to a user
// //     async assignRoleToUser(userId: string, roleId: string) {
// //         return await this.prisma.user.update({
// //             where: { id: userId },
// //             data: { roleId },
// //         });
// //     }

// //     // Fetch all roles
// //     async getAllRoles() {
// //         return await this.prisma.role.findMany();
// //     }
    
// //     async createRole(name: string, organizationId: string, description?: string) {
// //       return await this.prisma.role.create({
// //           data: {
// //               name,
// //               description,
// //               organization: {
// //                   connect: { id: organizationId },
// //               },
// //           },
// //       });
// //   }

// //     // Fetch all permissions
// //     async getAllPermissions() {
// //         return await this.prisma.permission.findMany();
// //     }

// //    // Create a new permission
// //   async createPermission(permissionId: string, name: string, description?: string) {
// //     return await this.prisma.permission.create({
// //       data: {
// //         id: permissionId,
// //         name: name,
// //         description: description || null,
// //         isActive: true,
// //       },
// //     });
// //   }

// //     // Assign a permission to a role
// //   async assignPermissionToRole(roleId: string, permissionId: string) {
// //     return await this.prisma.rolePermission.create({
// //       data: {
// //         role: { connect: { id: roleId } },
// //         permission: { connect: { id: permissionId } },
// //       },
// //     });
// //   }

// //     // Fetch permissions for a specific role
// //     async getPermissionsForRole(roleId: string) {
// //         return await this.prisma.rolePermission.findMany({
// //             where: { roleId },
// //             include: { permission: true,role:true },
// //         });
// //     }

// //     // Remove a permission from a role
// //     async removePermissionFromRole(roleId: string, permissionId: string) {
// //         return await this.prisma.rolePermission.deleteMany({
// //             where: { roleId, permissionId },
// //         });
// //     }
// // }

// import {
//   Injectable,
//   BadRequestException,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from 'prisma/prisma.service';
// import {
//   CreateRoleDto,
//   UpdateRoleDto,
//   UpdatePermissionDto,
// } from './dto/role.dto';
// import { Permission } from '@prisma/client';

// @Injectable()
// export class AuthorizationService {
//   constructor(private readonly prisma: PrismaService) {}

//   // ──────── ROLES ────────

//   async createRole(dto: CreateRoleDto) {
//     const { name, description, organizationId, createdBy, permissionIds } = dto;

//     if (!permissionIds || permissionIds.length === 0) {
//       throw new BadRequestException('A role must contain at least one permission.');
//     }

//     const exists = await this.prisma.role.findUnique({ where: { name } });
//     if (exists) throw new BadRequestException(`Role "${name}" already exists.`);

//     const role = await this.prisma.role.create({
//       data: {
//         name,
//         description,
//         createdBy,
//         organization: {
//           connect: { id: organizationId },
//         },
//       },
//     });

//     await this.prisma.rolePermission.createMany({
//       data: permissionIds.map((permissionId) => ({
//         roleId: role.id,
//         permissionId,
//       })),
//     });

//     return this.getRoleById(role.id);
//   }

//   async getAllRoles() {
//     const roles = await this.prisma.role.findMany({
//       include: {
//         organization: { select: { name: true } },
//         permissions: { include: { permission: true } },
//       },
//     });

//     return roles.map((role) => ({
//       ...role,
//       organizationName: role.organization?.name ?? null,
//       permissions: role.permissions.map((rp) => rp.permission),
//     }));
//   }

//   async getRoleById(id: string) {
//     const role = await this.prisma.role.findUnique({
//       where: { id },
//       include: {
//         organization: { select: { name: true } },
//         permissions: { include: { permission: true } },
//       },
//     });

//     if (!role) throw new NotFoundException(`Role with ID "${id}" not found.`);

//     return {
//       ...role,
//       organizationName: role.organization?.name ?? null,
//       permissions: role.permissions.map((rp) => rp.permission),
//     };
//   }

//   async updateRole(roleId: string, dto: UpdateRoleDto) {
//     const role = await this.prisma.role.findUnique({ where: { id: roleId } });
//     if (!role) throw new NotFoundException(`Role with ID "${roleId}" not found.`);

//     if (dto.name && dto.name !== role.name) {
//       const nameExists = await this.prisma.role.findUnique({ where: { name: dto.name } });
//       if (nameExists) throw new BadRequestException(`Role name "${dto.name}" already exists.`);
//     }

//     const data: any = {
//       name: dto.name,
//       description: dto.description,
//       isActive: dto.isActive,
//     };

//     if ('organizationId' in dto) {
//       data.organization =
//         dto.organizationId === null
//           ? { disconnect: true }
//           : { connect: { id: dto.organizationId } };
//     }

//     await this.prisma.role.update({ where: { id: roleId }, data });

//     if (dto.permissionIds !== undefined) {
//       if (dto.permissionIds.length === 0) {
//         throw new BadRequestException('A role must contain at least one permission.');
//       }

//       await this.prisma.rolePermission.deleteMany({ where: { roleId } });
//       await this.prisma.rolePermission.createMany({
//         data: dto.permissionIds.map((permissionId) => ({
//           roleId,
//           permissionId,
//         })),
//       });
//     }

//     return this.getRoleById(roleId);
//   }

//   async deleteRoleById(roleId: string) {
//     return await this.prisma.role.delete({ where: { id: roleId } });
//   }

//   async assignRoleToUser(userId: string, roleId: string) {
//     return await this.prisma.user.update({
//       where: { id: userId },
//       data: { roleId },
//     });
//   }

//   // ──────── PERMISSIONS ────────

//   async createPermission(name: string, description?: string) {
//     const existing = await this.prisma.permission.findFirst({ where: { name } });
//     if (existing) throw new BadRequestException(`Permission "${name}" already exists.`);

//     return await this.prisma.permission.create({
//       data: {
//         name,
//         description: description || null,
//         isActive: true,
//       },
//     });
//   }

//   async getAllPermissions() {
//     return await this.prisma.permission.findMany();
//   }

//   async getPermissionById(id: string): Promise<Permission> {
//     const permission = await this.prisma.permission.findUnique({ where: { id } });
//     if (!permission) throw new NotFoundException('Permission not found');
//     return permission;
//   }

//   async updatePermission(id: string, dto: UpdatePermissionDto) {
//     const existing = await this.prisma.permission.findUnique({ where: { id } });
//     if (!existing) throw new NotFoundException('Permission not found');

//     return await this.prisma.permission.update({
//       where: { id },
//       data: {
//         name: dto.name,
//         description: dto.description,
//       },
//     });
//   }

//   async deletePermissionById(permissionId: string) {
//     return await this.prisma.permission.delete({
//       where: { id: permissionId },
//     });
//   }

//   async assignPermissionToRole(roleId: string, permissionId: string) {
//     return await this.prisma.rolePermission.create({
//       data: {
//         role: { connect: { id: roleId } },
//         permission: { connect: { id: permissionId } },
//       },
//     });
//   }

//   async removePermissionFromRole(roleId: string, permissionId: string) {
//     return await this.prisma.rolePermission.deleteMany({
//       where: { roleId, permissionId },
//     });
//   }

//   async getPermissionsForRole(roleId: string) {
//     return await this.prisma.rolePermission.findMany({
//       where: { roleId },
//       select: {
//         role: { select: { id: true, name: true } },
//         permission: { select: { id: true, name: true, description: true } },
//       },
//     });
//   }
// }




import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';



@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}



async createRole(dto: CreateRoleDto) {
  const {
    name,
    description,
    isActive = true,
    permissionIds,
    organizationId,
  } = dto;

  try {
    const role = await this.prisma.role.create({
      data: {
        name,
        description,
        isActive,
        ...(organizationId && { organizationId }), // only add if provided
      },
    });

    if (permissionIds?.length) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      });
    }

    const fullRole = await this.prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return fullRole;
  } catch (error) {
    console.error(
      'Error creating role:',
      error instanceof Error ? error.message : JSON.stringify(error),
    );
    throw new InternalServerErrorException('Failed to create role');
  }
}


  async getAllRoles() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  // async updateRole(id: string, data: { name?: string; description?: string }) {
  //   return this.prisma.role.update({
  //     where: { id },
  //     data,
  //   });
  // }


async updateRole(id: string, dto: UpdateRoleDto) {
  const existingRole = await this.prisma.role.findUnique({ where: { id } });
  if (!existingRole) throw new NotFoundException('Role not found');

  const { name, description, isActive, permissionIds } = dto;

  const data: any = {
    ...(name && { name }),
    ...(description && { description }),
    ...(isActive !== undefined && { isActive }),
  };

  await this.prisma.role.update({
    where: { id },
    data,
  });

  // Optional: Update role-permission mapping
  if (permissionIds !== undefined) {
    if (permissionIds.length === 0) {
      throw new BadRequestException('A role must contain at least one permission.');
    }

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });

    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: id,
        permissionId,
      })),
    });
  }

  return this.getRoleById(id);
}


  async deleteRoleById(id: string) {
    return this.prisma.role.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  // ----------------- PERMISSIONS -----------------

  async createPermission(data: {
    name: string;
    description?: string;
  }) {
    return this.prisma.permission.create({
      data,
    });
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      where: { isActive: true },
    });
  }

  async getPermissionById(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async updatePermission(
    id: string,
    data: { name?: string; description?: string },
  ) {
    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  async deletePermissionById(id: string) {
    return this.prisma.permission.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  // ----------------- ROLE-PERMISSION -----------------

  async assignPermissionToRole(roleId: string, permissionId: string) {
    // prevent duplicate assignment
    const exists = await this.prisma.rolePermission.findFirst({
      where: { roleId, permissionId },
    });
    if (exists) return exists;

    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  async getPermissionsForRole(roleId: string) {
    return this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const mapping = await this.prisma.rolePermission.findFirst({
      where: { roleId, permissionId },
    });

    if (!mapping) {
      throw new NotFoundException('Permission not assigned to role');
    }

    return this.prisma.rolePermission.delete({
      where: { id: mapping.id },
    });
  }
}
