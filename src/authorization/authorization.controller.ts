// import { Controller, Post, Get, Body, Param, Delete, BadRequestException } from '@nestjs/common';
// import { AuthorizationService } from './authorization.service';
// import { CreateRoleDto } from './dto/role.dto';

// @Controller('authorization')
// export class AuthorizationController {
//   constructor(private readonly authorizationService: AuthorizationService) { }

//   // Fetch all roles
//   @Get('roles')
//   async getAllRoles() {
//     return await this.authorizationService.getAllRoles();
//   }

//   // Create a new role
//   @Post('roles')
//   async createRole(@Body() body: CreateRoleDto) {
//     return this.authorizationService.createRole(body);
//   }


//   // Fetch all permissions
//   @Get('permissions')
//   async getAllPermissions() {
//     return await this.authorizationService.getAllPermissions();
//   }

//   // Create a new permission
//   @Post('permissions')
//   async createPermission(
//     @Body() body: { id: string; name: string; description?: string },
//   ) {
//     console.log(`Creating permission with id: ${body.id}`);
//     return await this.authorizationService.createPermission(
//       body.id,
//       body.name,
//       body.description,
//     );
//   }
// //  Assign a permission to a role
//   @Post('roles/:roleId/permissions')
//   async assignPermissionToRole(
//     @Param('roleId') roleId: string,
//     @Body() body: { id: string },
//   ) {
//     const permissionId = body.id; // Extract permissionId from body
//     console.log(`Inputs roleId: ${roleId}, permissionId: ${permissionId}`);
    
//     if (!permissionId) {
//       throw new BadRequestException('permissionId is required in the body');
//     }
  
//     return await this.authorizationService.assignPermissionToRole(roleId, permissionId);
//   }

//   // Fetch permissions for a role
//   @Get('roles/:roleId/permissions')
//   async getPermissionsForRole(@Param('roleId') roleId: string) {
//     return await this.authorizationService.getPermissionsForRole(roleId);
//   }

//   // Remove a permission from a role
//   @Delete('roles/:roleId/permissions/:permissionId')
//   async removePermissionFromRole(
//     @Param('roleId') roleId: string,
//     @Param('permissionId') permissionId: string,
//   ) {
//     return await this.authorizationService.removePermissionFromRole(roleId, permissionId);
//   }
// }

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { CreateRoleDto, UpdateRoleDto, UpdatePermissionDto } from './dto/role.dto';

@Controller('authorization')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  // Create a role
  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto) {
    console.log('Creating role:', dto);
    return await this.authorizationService.createRole(dto);
  }

  // Get all roles
  @Get('roles')
  async getAllRoles() {
    console.log('Fetching all roles');
    return await this.authorizationService.getAllRoles();
  }

  // Get role by ID
  @Get('roles/:id')
  async getRoleById(@Param('id') id: string) {
    console.log(`Fetching role with ID: ${id}`);
    return this.authorizationService.getRoleById(id);
  }

  // Update role
  @Patch('roles/:id')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    console.log(`Updating role ${id} with data:`, dto);
    return await this.authorizationService.updateRole(id, dto);
  }

  // Delete role
  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    console.log(`Deleting role with ID: ${id}`);
    return await this.authorizationService.deleteRoleById(id);
  }

  // Create permission
  @Post('permissions')
  async createPermission(@Body() body: { name: string; description?: string }) {
    console.log('Creating permission:', body);
    return await this.authorizationService.createPermission(body);
  }

  // Get all permissions
  @Get('permissions')
  async getAllPermissions() {
    console.log('Fetching all permissions');
    return await this.authorizationService.getAllPermissions();
  }

  // Get permission by ID
  @Get('permissions/:id')
  async getPermissionById(@Param('id') id: string) {
    console.log(`Fetching permission with ID: ${id}`);
    return await this.authorizationService.getPermissionById(id);
  }

  // Update permission
  @Patch('permissions/:id')
  async updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    console.log(`Updating permission ${id} with data:`, dto);
    return await this.authorizationService.updatePermission(id, dto);
  }

  // Delete permission
  @Delete('permissions/:id')
  async deletePermission(@Param('id') id: string) {
    console.log(`Deleting permission with ID: ${id}`);
    return await this.authorizationService.deletePermissionById(id);
  }

  // Assign permission to role
  @Post('roles/:roleId/permissions')
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Body() body: { permissionId: string },
  ) {
    console.log(`Assigning permission ${body.permissionId} to role ${roleId}`);
    return await this.authorizationService.assignPermissionToRole(roleId, body.permissionId);
  }

  // Get permissions for role
  @Get('roles/:roleId/permissions')
  async getPermissionsForRole(@Param('roleId') roleId: string) {
    console.log(`Getting permissions for role ID: ${roleId}`);
    return await this.authorizationService.getPermissionsForRole(roleId);
  }

  // Remove permission from role
  @Delete('roles/:roleId/permissions/:permissionId')
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    console.log(`Removing permission ${permissionId} from role ${roleId}`);
    return await this.authorizationService.removePermissionFromRole(roleId, permissionId);
  }
}
