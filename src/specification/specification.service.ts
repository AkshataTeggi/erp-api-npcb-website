


import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Specification, Prisma, Unit, $Enums } from '@prisma/client';
import { CreateSpecificationDto, UpdateSpecificationDto } from './dto/create-specification.dto';
import slugify from 'slugify';

@Injectable()
export class SpecificationsService {
  constructor(private prisma: PrismaService) {}

 async getSpecifications(serviceId?: string): Promise<any[]> {
  try {
    const where: Prisma.SpecificationWhereInput = {
      isDeleted: false,
      parentId: null,
    };

    if (serviceId) {
      where.serviceId = serviceId;
    }

    const parentSpecifications = await this.prisma.specification.findMany({
      where,
      include: {
        service: { select: { id: true, name: true } }, // 👈 include service info
      },
      orderBy: {
        priority: 'asc',
      },
    });

    const result = await Promise.all(
      parentSpecifications.map(async (spec) => {
        const fullSpec = await this.buildSpecificationTree(spec);
        return {
          ...fullSpec,
          serviceId: spec.service?.id || null,
          serviceName: spec.service?.name || null,
        };
      }),
    );

    return result;
  } catch (error) {
    console.error('Error fetching specifications:', error);
    throw new InternalServerErrorException('Failed to fetch specifications');
  }
}
private async buildSpecificationTree(spec: any): Promise<any> {
  const subSpecifications = await this.prisma.specification.findMany({
    where: {
      parentId: spec.id,
      isDeleted: false,
    },
    include: {
      service: { select: { id: true, name: true } }, // Include service for each sub-spec
    },
    orderBy: {
      priority: 'asc',
    },
  });

  const subSpecsWithChildren = await Promise.all(
    subSpecifications.map(async (sub) => {
      const { service, ...rest } = await this.buildSpecificationTree(sub);
      return {
        ...rest,
        serviceId: service?.id || null,
        serviceName: service?.name || null,
      };
    }),
  );

  const { service, ...rest } = spec;

  return {
    ...rest,
    serviceId: service?.id || null,
    serviceName: service?.name || null,
    subSpecifications: subSpecsWithChildren,
  };
}

 async getSpecificationById(id: string): Promise<any> {
  try {
    const specification = await this.prisma.specification.findUnique({
      where: { id },
      include: {
        subSpecifications: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!specification) {
      throw new NotFoundException(`Specification with ID ${id} not found`);
    }

    const { service, ...rest } = specification;

    return {
      ...rest,
      serviceId: service?.id || null,
      serviceName: service?.name || null,
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    console.error(`Error fetching specification ${id}:`, error);
    throw new InternalServerErrorException(`Failed to fetch specification: ${error.message}`);
  }
}


async searchSpecifications(query: string): Promise<any[]> {
  try {
    const specifications = await this.prisma.specification.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
        isDeleted: false,
      },
      include: {
        subSpecifications: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  return specifications.map(({ service, ...spec }) => ({
  ...spec,
  serviceId: service?.id || null,
  serviceName: service?.name || null,
}));

  } catch (error) {
    console.error(`Error searching specifications with query "${query}":`, error);
    throw new InternalServerErrorException(`Failed to search specifications: ${error.message}`);
  }
}

async createSpecification(createDto: CreateSpecificationDto): Promise<any> {
  try {
    const slug = createDto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingSpec = await this.prisma.specification.findFirst({
      where: {
        OR: [
          { name: { equals: createDto.name, mode: 'insensitive' } },
          { slug: { equals: slug, mode: 'insensitive' } },
        ],
        isDeleted: false,
      },
    });

    if (existingSpec) {
      throw new BadRequestException(`A specification with the name "${createDto.name}" already exists`);
    }

    // Create the main specification
    const parentSpec = await this.prisma.specification.create({
      data: {
        name: createDto.name,
        slug,
        type: createDto.type,
        priority: createDto.priority || 0,
        isRequired: createDto.isRequired || false,
        isActive: createDto.isActive ?? true,
        parentId: createDto.parentId || null,
        serviceId: createDto.serviceId || null,
        defaultUnit: createDto.defaultUnit as Unit,
        allowedUnits:createDto.allowedUnits,
      },
    });

    // Create sub-specifications (if any)
    if (Array.isArray(createDto.subSpecifications) && createDto.subSpecifications.length > 0) {
      for (const sub of createDto.subSpecifications) {
        await this.prisma.specification.create({
          data: {
            name: sub.name,
            slug: slugify(sub.name),
            type: sub.type,
            defaultUnit: sub.defaultUnit as Unit,
            allowedUnits: sub.allowedUnits,
            isRequired: sub.isRequired,
            isActive: sub.isActive,
            parentId: parentSpec.id,
          },
        });
      }
    }

    // Fetch the full spec including service
    const result = await this.prisma.specification.findUnique({
      where: { id: parentSpec.id },
      include: {
        subSpecifications: true,
        service: { select: { id: true, name: true } },
      },
    });

    // Prepare clean response
    const { service, serviceId, ...rest } = result;
    return {
      ...rest,
      serviceId: service?.id || null,
      serviceName: service?.name || null,
    };

  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    console.error('Error creating specification:', error);
    throw new InternalServerErrorException(`Failed to create specification: ${error.message}`);
  }
}

async updateSubSpecifications(id: string, subSpecifications: any[]): Promise<Specification> {
  try {
    const parentSpec = await this.prisma.specification.findUnique({ where: { id } });
    if (!parentSpec) {
      throw new NotFoundException(`Parent specification with ID ${id} not found`);
    }

    const currentSubSpecs = await this.prisma.specification.findMany({
      where: { parentId: id },
      select: { id: true },
    });
    const currentSubSpecIds = currentSubSpecs.map(spec => spec.id);

    const newSubSpecIds: string[] = [];

    for (const spec of subSpecifications) {
      if (spec.id) {
        newSubSpecIds.push(spec.id);

        await this.prisma.specification.update({
          where: { id: spec.id },
          data: {
            name: spec.name,
            type: spec.type,
            isActive: spec.isActive,
            isRequired: spec.isRequired,
            defaultUnit: spec.defaultUnit as Unit,
            allowedUnits: spec.allowedUnits,
            hasSubSpecification: false,
            parentId: id,
            slug: this.slugify(spec.name),
          },
        });
      } else if (spec.name && spec.type) {
        const created = await this.prisma.specification.create({
          data: {
            name: spec.name,
            type: spec.type,
            isActive: spec.isActive,
            isRequired: spec.isRequired,
            defaultUnit: spec.defaultUnit as Unit,
            allowedUnits: spec.allowedUnits,
            hasSubSpecification: false,
            parentId: id,
            slug: this.slugify(spec.name),
          } as Prisma.SpecificationUncheckedCreateInput,
        });

        newSubSpecIds.push(created.id);
      } else {
        throw new BadRequestException(`Invalid subspecification: ${JSON.stringify(spec)}`);
      }
    }

    const toRemove = currentSubSpecIds.filter(subId => !newSubSpecIds.includes(subId));
    const toAdd = newSubSpecIds.filter(subId => !currentSubSpecIds.includes(subId));

    if (toRemove.length > 0) {
      await this.prisma.specification.updateMany({
        where: { id: { in: toRemove } },
        data: { parentId: null },
      });
    }

    if (toAdd.length > 0) {
      const existingSpecs = await this.prisma.specification.findMany({
        where: { id: { in: toAdd } },
        select: { id: true },
      });

      const existingSpecIds = existingSpecs.map(spec => spec.id);
      const nonExistentIds = toAdd.filter(id => !existingSpecIds.includes(id));
      if (nonExistentIds.length > 0) {
        throw new BadRequestException(`Some subspecifications do not exist: ${nonExistentIds.join(', ')}`);
      }

      for (const addId of toAdd) {
        const childrenTree = await this.getChildrenTree(addId);
        if (childrenTree.some(child => child.id === id)) {
          throw new BadRequestException(
            `Cannot add specification ${addId} as a subspecification because it would create a circular reference`
          );
        }
      }

      await this.prisma.specification.updateMany({
        where: { id: { in: toAdd } },
        data: { parentId: id },
      });
    }

    const updatedChildrenCount = await this.prisma.specification.count({
      where: { parentId: id },
    });

    await this.prisma.specification.update({
      where: { id },
      data: { hasSubSpecification: updatedChildrenCount > 0 },
    });

    const updatedSpec = await this.prisma.specification.findUnique({
      where: { id },
      include: {
        subSpecifications: true,
        service: { select: { id: true, name: true } },
      },
    });

    return updatedSpec;
  } catch (error) {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    console.error('Error updating subspecifications:', error);
    throw new InternalServerErrorException(`Failed to update subspecifications: ${error.message}`);
  }
}



private slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-');    // Replace multiple - with single -
}


  
  private async getChildrenTree(specId: string): Promise<Specification[]> {
    const children = await this.prisma.specification.findMany({
      where: { parentId: specId },
    });

    let allChildren = [...children];

    for (const child of children) {
      const grandchildren = await this.getChildrenTree(child.id);
      allChildren = [...allChildren, ...grandchildren];
    }

    return allChildren;

  }


  async deleteSpecification(id: string): Promise<{ message: string }> {
    try {
      // Check if the specification exists
      const spec = await this.prisma.specification.findUnique({
        where: { id },
        include: { subSpecifications: true },
      });

      if (!spec) {
        throw new NotFoundException(`Specification with ID ${id} not found`);
      }

      // If it has subspecifications, remove the parent reference
      if (spec.subSpecifications.length > 0) {
        await this.prisma.specification.updateMany({
          where: { parentId: id },
          data: { parentId: null },
        });
      }

      // Soft delete the specification
      await this.prisma.specification.delete({
        where: { id },
      });

      return { message: `Specification ${id} has been deleted` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error deleting specification ${id}:`, error);
      throw new InternalServerErrorException(`Failed to delete specification: ${error.message}`);
    }
  }

async updateSpecification(id: string, updateSpecificationDto: UpdateSpecificationDto): Promise<any> {
  try {
    const specification = await this.prisma.specification.findUnique({ where: { id } });
    if (!specification) throw new NotFoundException('Specification not found');

    const updateData: any = {};

    for (const key of Object.keys(updateSpecificationDto)) {
      const newValue = updateSpecificationDto[key];
      const oldValue = specification[key];

      if (Array.isArray(newValue)) {
        if (!Array.isArray(oldValue) || newValue.sort().join(',') !== oldValue.sort().join(',')) {
          updateData[key] = newValue;
        }
      } else if (newValue !== undefined && newValue !== oldValue) {
        updateData[key] = newValue;
      }
    }

    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
    }

    const validUnits: string[] = Object.values($Enums.Unit);

    if (updateSpecificationDto.hasDimension !== undefined) {
      updateData.hasDimension = updateSpecificationDto.hasDimension;

      if (updateSpecificationDto.hasDimension) {
        const selectedUnits = [
          ...new Set(
            (updateSpecificationDto.allowedUnits || []).map((u) => u.toUpperCase())
          ),
        ];

        if (!selectedUnits.every((unit) => validUnits.includes(unit))) {
          throw new BadRequestException(
            `Invalid units: ${updateSpecificationDto.allowedUnits}`
          );
        }

        updateData.allowedUnits = selectedUnits;

        if (updateSpecificationDto.defaultUnit) {
          const formattedUnit = updateSpecificationDto.defaultUnit.toUpperCase();
          if (!validUnits.includes(formattedUnit)) {
            throw new BadRequestException(`Invalid unit: ${formattedUnit}`);
          }

          if (!selectedUnits.includes(formattedUnit)) {
            throw new BadRequestException(
              `Default unit must be one of the allowed units`
            );
          }

          updateData.defaultUnit = formattedUnit;
        } else {
          updateData.defaultUnit = null;
        }
      } else {
        updateData.allowedUnits = [];
        updateData.defaultUnit = null;
      }
    }

    // Update or create sub-specifications
    if (updateSpecificationDto.subSpecifications) {
      const subSpecs = updateSpecificationDto.subSpecifications;
      const updatedSubSpecs = [];

      for (const sub of subSpecs) {
        if (sub.id) {
          const existingSubSpec = await this.prisma.specification.findUnique({
            where: { id: sub.id },
          });

          if (!existingSubSpec) {
            throw new BadRequestException(
              `Sub-specification with ID ${sub.id} does not exist.`
            );
          }

          await this.prisma.specification.update({
            where: { id: sub.id },
            data: {
              name: sub.name,
              slug: sub.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
              type: sub.type,
              defaultUnit: sub.defaultUnit?.toUpperCase() as Unit,
              allowedUnits: sub.allowedUnits?.map((u) => u.toUpperCase() as Unit),
              isRequired: sub.isRequired,
              isActive: sub.isActive,
            },
          });

          updatedSubSpecs.push(sub.id);
        } else {
          const created = await this.prisma.specification.create({
            data: {
              name: sub.name,
              slug: sub.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
              type: sub.type,
              defaultUnit: sub.defaultUnit?.toUpperCase() as Unit,
allowedUnits: sub.allowedUnits?.map((u) => u.toUpperCase() as Unit),
              isRequired: sub.isRequired,
              isActive: sub.isActive,
              parentId: id,
            },
          });

          updatedSubSpecs.push(created.id);
        }
      }

      updateData.subSpecifications = {
        connect: updatedSubSpecs.map((subId) => ({ id: subId })),
      };
    }

    // Skip update if nothing changed
    if (Object.keys(updateData).length === 0) {
      return specification;
    }

    const updated = await this.prisma.specification.update({
      where: { id },
      data: updateData,
      include: {
        subSpecifications: true,
        service: { select: { id: true, name: true } },
      },
    });

    const { service, ...rest } = updated;
    return {
      ...rest,
      serviceId: service?.id || null,
      serviceName: service?.name || null,
    };
  } catch (error) {
    console.error('Error updating specification:', error);
    throw new HttpException(
      error.message || 'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}



}



