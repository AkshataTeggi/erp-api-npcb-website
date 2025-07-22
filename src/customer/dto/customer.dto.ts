// import { IsEmail, IsOptional, IsString, IsBoolean ,IsNotEmpty} from 'class-validator';

// export class CreateCustomerDto {
//   @IsString()
//   name: string;

  
//     @IsEmail({}, { message: 'Invalid email format' })
//     @IsNotEmpty()
//     email: string;
  

//   @IsString()
//   @IsOptional()
//   company?: string;

//   @IsString()
//   @IsOptional()
//   mobile?: string;

//   @IsBoolean()
//   @IsOptional()
//   newsletter?: boolean;
// }



// export class UpdateCustomerDto {
//   @IsString()
//   @IsOptional()
//   name?: string;

//   @IsString()
//   @IsOptional()
//   company?: string;

//   @IsString()
//   @IsOptional()
//   mobile?: string;

//   @IsEmail({}, { message: 'Invalid email format' })
//   @IsNotEmpty()
//   email: string;

//   @IsOptional()
//   @IsString()
//   address?: string;
// }


import { IsEmail, IsOptional, IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  newsletter?: boolean;

  // Optional user fields
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  roleId?: string;
}


export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  newsletter?: boolean;
}
