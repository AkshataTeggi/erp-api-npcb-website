// /* eslint-disable prettier/prettier */
// import { UserService } from './user.service';
// import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
// // import { AuthGuard } from '@nestjs/passport';
// import { UserType } from '@prisma/client';
// import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';


// @Controller('user')
// export class UserController {
//   constructor(private readonly userService: UserService) { }

//   @Get('types')
// getUserTypes() {
//   console.log('UserType Enum:', UserType);
//   return Object.values(UserType); // ['ADMIN', 'EMPLOYEE', 'CUSTOMER']
// }
  
// @Post()
// async createUser(@Body() body: CreateUserDto) {
//   return await this.userService.createUser(body);
// }


//   // Assign a role to a user
//   @Post(':id/roles/:roleId')
//   async assignRoleToUser(
//     @Param('id') userId: string,
//     @Param('roleId') roleId: string,
//   ) {
//     // Call the service to assign the role
//     return this.userService.assignRoleToUser(userId, roleId);
//   }
 
  

//   @Get()
//   async getAllUsers() {
//     return await this.userService.getAllUsers();
//   }

//   @Get(':id')
//   async getUser(@Param('id') id: string) {
//     return await this.userService.getUserById(id);
//   }

//   // get user by email
//   @Get(':email')
//   async getUserByEmail(@Param('email') email: string) {

//     try {
//       const user = await this.userService.getUserByEmail(email);
//       if (user) {
//         return user;
//       } else {
//         return { message: 'User not found' };
//       }
//     } catch (error) {
//       return { message: error.message };
//     }
//   }

//   //changing role from user
//  @Patch(':id/role')
// async changeUserRole(
//   @Param('id') userId: string,
//   @Body() body: { roleId: string }
// ) {
//   return this.userService.changeRoleFromUser(userId, body.roleId);
// }


// //updating user
//   @Patch(':id')
//   async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
//     return await this.userService.updateUser(id, body);
//   }

  
//   // delete a role from user 
//   @Delete(':id/roles')
//   async removeRoleFromUser(
//     @Param('id') userId: string
//   ) {
//     return this.userService.removeRoleFromUser(userId);
//   }

//   // delete user
//   @Delete(':id')
//   async deleteUser(@Param('id') id: string) {
//     return await this.userService.hardDeleteUser(id);
//   }
// }


/* eslint-disable prettier/prettier */
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserType } from '@prisma/client';
import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('types')
  getUserTypes() {
    console.log('[GET] /user/types - Fetching User Types');
    const types = Object.values(UserType);
    console.log('UserType Enum:', types);
    return types;
  }

  @Post()
  async createUser(@Body() body: CreateUserDto) {
    console.log('[POST] /user - Creating user with data:', body);
    const user = await this.userService.createUser(body);
    console.log('User created:', user);
    return user;
  }

  @Post(':id/roles/:roleId')
  async assignRoleToUser(@Param('id') userId: string, @Param('roleId') roleId: string) {
    console.log(`[POST] /user/${userId}/roles/${roleId} - Assigning role`);
    const result = await this.userService.assignRoleToUser(userId, roleId);
    console.log('Role assignment result:', result);
    return result;
  }

  @Get()
  async getAllUsers() {
    console.log('[GET] /user - Fetching all users');
    const users = await this.userService.getAllUsers();
    console.log('All users:', users);
    return users;
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    console.log(`[GET] /user/${id} - Fetching user by ID`);
    const user = await this.userService.getUserById(id);
    console.log('User found:', user);
    return user;
  }

  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    console.log(`[GET] /user/email/${email} - Fetching user by email`);
    try {
      const user = await this.userService.getUserByEmail(email);
      if (user) {
        console.log('User found:', user);
        return user;
      } else {
        console.log('User not found');
        return { message: 'User not found' };
      }
    } catch (error) {
      console.error('Error fetching user by email:', error.message);
      return { message: error.message };
    }
  }

  @Patch(':id/role')
  async changeUserRole(@Param('id') userId: string, @Body() body: { roleId: string }) {
    console.log(`[PATCH] /user/${userId}/role - Changing user role to`, body.roleId);
    const result = await this.userService.changeRoleFromUser(userId, body.roleId);
    console.log('Role changed:', result);
    return result;
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    console.log(`[PATCH] /user/${id} - Updating user with data:`, body);
    const updatedUser = await this.userService.updateUser(id, body);
    console.log('Updated user:', updatedUser);
    return updatedUser;
  }

  @Delete(':id/roles')
  async removeRoleFromUser(@Param('id') userId: string) {
    console.log(`[DELETE] /user/${userId}/roles - Removing roles from user`);
    const result = await this.userService.removeRoleFromUser(userId);
    console.log('Roles removed:', result);
    return result;
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    console.log(`[DELETE] /user/${id} - Deleting user`);
    const result = await this.userService.hardDeleteUser(id);
    console.log('User deleted:', result);
    return result;
  }
}
