import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  organizationId: string;

  @IsString()
  @IsOptional()
  parentId?: string;

    @IsOptional()
  @IsString()
  slug?: string; // 👈 Add this

}


export class UpdateServiceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;


  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
 
  @IsOptional()
  @IsString()
  slug?: string; // 👈 Add this

}
