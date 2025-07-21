/* eslint-disable prettier/prettier */
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;

   
    @IsString()
    username: string;

    @IsOptional()
    @IsString()
    fullname: string;

    @IsNotEmpty()
    @IsString()
    mobile: string;


    @IsOptional()
    @IsString()
    role: string;

    // @IsOptional()
    // @IsString()
    // createdBy?: string;
    //   roleId?: string;
    @IsOptional()
@IsArray()
@IsString({ each: true })
roleIds?: string[];

}

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    password?: string;

 @IsOptional()
@IsArray()
@IsString({ each: true })
roleIds?: string[];


    @IsOptional()
    @IsString()
    updatedBy?: string;

    @IsOptional()
    @IsString()
    refreshToken?: string;
}
