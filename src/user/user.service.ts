// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from 'prisma/prisma.service';
// import { AuthorizationService } from '../authorization/authorization.service';
// import { PasswordHelper } from 'src/common/helpers/password-helper';
// import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

// @Injectable()
// export class UserService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly authorizationService: AuthorizationService,
//   ) {}

//   async createUser(dto: CreateUserDto) {
//     const hashedPassword = await PasswordHelper.hashPassword(dto.password);

//     return this.prisma.user.create({
//       data: {
//         fullname: dto.fullname,
//         email: dto.email,
//         password: hashedPassword,
//         mobile: dto.mobile,
//         username: dto.username,
       
//         userRoles: {
//           create: dto.roleIds?.map((roleId) => ({
//             role: { connect: { id: roleId } },
//           })),
//         },
//       },
//       include: {
//         userRoles: {
//           include: {
//             role: {
//               include: {
//                 permissions: {
//                   include: {
//                     permission: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });
//   }

//   async getAllUsers() {
//     return this.prisma.user.findMany({
//       include: {
//         userRoles: {
//           include: {
//             role: {
//               include: {
//                 permissions: {
//                   include: {
//                     permission: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });
//   }

//   async assignRoleToUser(userId: string, roleId: string) {
//     const role = await this.prisma.role.findUnique({
//       where: { id: roleId },
//     });

//     if (!role) {
//       throw new NotFoundException(`Role ID "${roleId}" not found`);
//     }

//     return this.prisma.userRole.create({
//       data: {
//         user: { connect: { id: userId } },
//         role: { connect: { id: roleId } },
//       },
//     });
//   }

//   async changeRoleFromUser(userId: string, newRoleId: string) {
//     const role = await this.prisma.role.findUnique({
//       where: { id: newRoleId },
//     });

//     if (!role) {
//       throw new NotFoundException(`Role with ID "${newRoleId}" not found`);
//     }

//     await this.prisma.userRole.deleteMany({ where: { userId } });

//     return this.prisma.userRole.create({
//       data: {
//         user: { connect: { id: userId } },
//         role: { connect: { id: newRoleId } },
//       },
//     });
//   }

//   async removeRoleFromUser(userId: string) {
//     try {
//       return await this.prisma.userRole.deleteMany({
//         where: { userId },
//       });
//     } catch (error) {
//       throw new Error(`Error removing role from user: ${error.message}`);
//     }
//   }

//   async updateUser(
//     id: string,
//     data: Partial<{
//       email: string;
//       password: string;
//       refreshToken: string;
//       roleIds: string[];
//     }>,
//   ) {
//     try {
//       const { roleIds, ...userData } = data;

//       if (userData.password) {
//         userData.password = await PasswordHelper.hashPassword(userData.password);
//       }

//       await this.prisma.user.update({
//         where: { id },
//         data: userData,
//       });

//       if (roleIds && roleIds.length > 0) {
//         await this.prisma.userRole.deleteMany({ where: { userId: id } });

//         await this.prisma.user.update({
//           where: { id },
//           data: {
//             userRoles: {
//               create: roleIds.map((roleId) => ({
//                 role: { connect: { id: roleId } },
//               })),
//             },
//           },
//         });
//       }

//       return this.prisma.user.findUnique({
//         where: { id },
//         include: {
//           userRoles: {
//             include: {
//               role: {
//                 include: {
//                   permissions: {
//                     include: {
//                       permission: true,
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       });
//     } catch (error) {
//       throw new Error(`Error updating user: ${error.message}`);
//     }
//   }

//   async getUserByEmail(email: string) {
//     const user = await this.prisma.user.findUnique({
//       where: { email },
//       include: {
//         userRoles: {
//           include: {
//             role: {
//               include: {
//                 permissions: {
//                   include: {
//                     permission: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     return user;
//   }

//   async getUserById(id: string) {
//     return this.prisma.user.findUnique({
//       where: { id },
//       include: {
//         userRoles: {
//           include: {
//             role: {
//               include: {
//                 permissions: {
//                   include: {
//                     permission: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });
//   }

//   async softDeleteUser(id: string) {
//     return this.prisma.user.update({
//       where: { id },
//       data: {
//         isActive: false,
//         deletedAt: new Date(),
//       },
//     });
//   }

//   async hardDeleteUser(id: string) {
//     return this.prisma.user.delete({
//       where: { id },
//     });
//   }
// }

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { PasswordHelper } from 'src/common/helpers/password-helper';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  // ✅ Create User
  async createUser(dto: CreateUserDto) {
    const { fullname, email, password, mobile, username, roleIds } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await PasswordHelper.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        mobile,
        username,
      },
    });

    if (roleIds?.length > 0) {
      await this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ✅ Get All Users with Roles and Permissions
  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ✅ Assign a Role to a User
  async assignRoleToUser(userId: string, roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role ID "${roleId}" not found`);
    }

    return this.prisma.userRole.create({
      data: {
        user: { connect: { id: userId } },
        role: { connect: { id: roleId } },
      },
    });
  }

  // ✅ Change All Roles for a User
  async changeRoleFromUser(userId: string, newRoleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: newRoleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${newRoleId}" not found`);
    }

    await this.prisma.userRole.deleteMany({ where: { userId } });

    return this.prisma.userRole.create({
      data: {
        user: { connect: { id: userId } },
        role: { connect: { id: newRoleId } },
      },
    });
  }

  // ✅ Remove All Roles from a User
  async removeRoleFromUser(userId: string) {
    try {
      return await this.prisma.userRole.deleteMany({
        where: { userId },
      });
    } catch (error) {
      throw new Error(`Error removing role from user: ${error.message}`);
    }
  }

  // ✅ Update User and Roles
  async updateUser(
    id: string,
    data: Partial<{
      fullname: string;
      email: string;
      password: string;
      mobile: string;
      username: string;
      refreshToken: string;
      roleIds: string[];
    }>,
  ) {
    try {
      const { roleIds, ...userData } = data;

      if (userData.password) {
        userData.password = await PasswordHelper.hashPassword(userData.password);
      }

      await this.prisma.user.update({
        where: { id },
        data: userData,
      });

      if (roleIds && roleIds.length > 0) {
        await this.prisma.userRole.deleteMany({ where: { userId: id } });

        await this.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
          skipDuplicates: true,
        });
      }

      return this.prisma.user.findUnique({
        where: { id },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // ✅ Get User by Email
  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ✅ Get User by ID
  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ✅ Soft Delete (Disable) User
  async softDeleteUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  // ✅ Hard Delete (Remove) User
  async hardDeleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

