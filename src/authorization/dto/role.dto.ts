/* eslint-disable prettier/prettier */
// import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

// export class CreateRoleDto {

//   @IsString()
//   name: string;

//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsOptional()
//   @IsBoolean()
//   isActive?: boolean;

//   @IsOptional()
//   @IsString()
//   departmentId?: string | null;

//   @IsOptional()
//   @IsArray()
//   @IsString({ each: true })
//   permissionIds?: string[];

//   @IsOptional()
//   @IsString()
//   createdBy?: string;
// }



// export class UpdateRoleDto {
//   @IsOptional()
//   @IsString()
//   name?: string;

//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsOptional()
//   @IsBoolean()
//   isActive?: boolean;

//   @IsOptional()
//   @IsString()
//   departmentId?: string | null;

//   @IsOptional()
//   @IsArray()
//   @IsString({ each: true })
//   permissionIds?: string[];
// }










// export class UpdatePermissionDto {
//   @IsOptional()
//   @IsString()
//   name?: string;

//   @IsOptional()
//   @IsString()
//   description?: string;
// }



import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

    @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  
  @IsOptional()
@IsString()
organizationId?: string;


  @IsArray()
  @IsNotEmpty({ each: true })
  permissionIds: string[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  organizationId?: string | null;

  @IsOptional()
  @IsArray()
  permissionIds?: string[];
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
