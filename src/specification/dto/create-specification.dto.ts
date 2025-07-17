

import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, ValidateIf, IsArray, IsInt, Min, IsNotEmpty, ArrayNotEmpty, IsUUID } from 'class-validator';
import { Type, Unit } from '@prisma/client';




export class CreateSpecificationDto {
  @IsString()
  name: string; // Specification name

  @IsEnum(Type)
  type: Type; // Type of specification (TEXT, BOOLEAN, SELECT)

  @IsOptional()
  @IsEnum(Unit)
  defaultUnit?: Unit; // ✅ Corrected: Should be enum not string

  @IsOptional()
  @IsArray()
  @IsEnum(Unit, { each: true }) // ✅ Use IsEnum for array elements
  allowedUnits?: Unit[];

  @IsOptional()

  @IsArray()
  @IsString({ each: true })
  suggestions?: string[]; // Predefined values for SELECT & BOOLEAN

  @IsOptional()
  @IsBoolean()
  @ValidateIf((obj) => obj.type === Type.CHECKBOX)
  valueBoolean?: boolean; // BOOLEAN values

  @IsOptional()
  @IsString()
  @ValidateIf((obj) => obj.type === Type.TEXT || obj.type === Type.DROPDOWN)
  valueString?: string; // TEXT and SELECT values

  
  @IsOptional()
  @IsString()
  serviceId?: string;

  
  @IsOptional()
  @IsInt()
  @Min(0) // Ensures priority is always 0 or greater
  priority?: number; // Priority field (default to 0)

  @IsOptional()
  @IsBoolean()
  allowCustom?: boolean; 

  @IsOptional()
  @IsBoolean()
  hasDimension?: boolean;
  static hasDimension: any;
  static unit: string;

  @IsString()
  @IsOptional()
  specificationGroupId?: string;


  @IsOptional()
  @IsUUID() // Ensures it's a valid UUID
  parentId?: string; 

  isRequired: any;
  isActive: any;

  subSpecifications?: CreateSubSpecificationDto[];

}


// dto/update-specification.dto.ts
export class UpdateSpecificationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  suggestions?: string[];
  
  @IsOptional()
  @IsInt()
  @Min(0) // Ensures priority is always 0 or greater
  priority?: number; // Priority field (default to 0)

  @IsOptional()
  @IsBoolean()
  allowCustom?: boolean; 

  @IsOptional()
  @IsString() // ✅ `unit` should be a single string, not an array
  defaultUnit?: Unit;

  @IsOptional()
  @IsBoolean()
  hasDimension?: boolean;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true }) 
  allowedUnits?: Unit[];
   
  @IsOptional()
  @IsUUID() // Ensures it's a valid UUID
  parentId?: string;


  @IsOptional()
  subSpecifications?: (CreateSubSpecificationDto & { id?: string })[]; // Optional sub-specifications with optional id
}


// export class CreateSubSpecificationDto {
//   name: string;
//   type: Type;
//   isRequired: boolean;  // ✅ changed from isRequires to isRequired
//   isActive: boolean;
//   defaultUnit:string;
//   allowedUnits:Unit[];
// }


export class CreateSubSpecificationDto {
  @IsString()
  name: string; // Sub-specification name

  @IsEnum(Type)
  type: Type; // Type of specification (TEXT, BOOLEAN, SELECT)

  @IsBoolean()
  isRequired: boolean;  // Whether this sub-specification is required

  @IsBoolean()
  isActive: boolean; // Whether this sub-specification is active

   @IsOptional()
  @IsEnum(Unit)
  defaultUnit?: Unit; // ✅ Corrected: Should be enum not string

  @IsArray()
  @IsEnum(Unit, { each: true })
  allowedUnits: Unit[];
}