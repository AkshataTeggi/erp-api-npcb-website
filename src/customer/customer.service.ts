import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto ,UpdateCustomerDto} from './dto/customer.dto';
import { PasswordHelper } from 'src/common/helpers/password-helper';


@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}



  
  // async createCustomer(customerDto: CreateCustomerDto) {
  //   console.log("Received Customer Data:", customerDto);
  //   const { email, name, ...customerData } = customerDto; // Extract name separately
  //   const now = new Date();
  
  //   if (!email) {
  //     throw new HttpException("Customer email is required", HttpStatus.BAD_REQUEST);
  //   }
  
  //   const existingCustomer = await this.prisma.customer.findUnique({
  //     where: { email },
  //   });
  
  //   return this.prisma.customer.upsert({
  //     where: { email },
  //     update: {
  //       ...customerData, // ✅ Update other details
  //       updatedAt: now,
  //     },
  //     create: {
  //       email, 
  //       name, // ✅ Set name only when creating
  //       ...customerData,
  //       createdAt: now,
  //     },
  //   });
  // }
 


//customer with user 

async createCustomer(dto: CreateCustomerDto, createdBy?: string) {
  const { email, name, mobile, address, company, username, password, roleId } = dto;

  try {
    let userCreateData: any = undefined;

    // Step 1: Prepare user creation data only if username is provided
    if (username) {
      if (!password) {
        throw new Error('Password is required when username is provided.');
      }

      const hashedPassword = await PasswordHelper.hashPassword(password);

      userCreateData = {
        create: {
          username,
          email,
          password: hashedPassword,
          mobile,
          fullname: name,
          userType: 'CUSTOMER',
        },
      };
    }

    // Step 2: Create Customer (with optional user)
    const customer = await this.prisma.customer.create({
      data: {
        email,
        name,
        mobile,
        address,
        company,
        ...(createdBy && { createdBy }),
        ...(userCreateData && { users: userCreateData }),
      },
      include: {
        users: {
          include: {
            userRoles: {
              include: { role: true },
            },
          },
        },
      },
    });

    // Step 3: Assign role if user was created and roleId is provided
    if (customer.users?.length && roleId) {
      await this.prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: customer.users[0].id,
            roleId,
          },
        },
        update: {},
        create: {
          userId: customer.users[0].id,
          roleId,
        },
      });
    }

    // Step 4: Return only customer with embedded users
    return {
      message: 'Customer created successfully',
      customer,
    };

  } catch (error) {
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (target?.includes('username')) {
        throw new Error(`Username '${username}' is already taken.`);
      }
      if (target?.includes('email')) {
        throw new Error(`Email '${email}' is already in use.`);
      }
    }

    throw error;
  }
}


 async updateCustomer(customerId: string, updateData: UpdateCustomerDto) {
    const now = new Date();
  
    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        ...updateData,       // ✅ Includes name now
        updatedAt: now,
      },
    });
  }
async getCustomerById(customerId: string) {
  const customer = await this.prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      users: {
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      },
      rfqs: {
        include: {
          services: true,
          rfqSpecifications: {
            include: {
              specification: true,
            },
          },
          files: true,
        },
      },
    },
  });

  if (!customer) {
    throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
  }

  return customer;
}

  async findAll() {
  return this.prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      users: {
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });
}

  async deleteCustomer(id: string) {
    try {
      const customer = await this.prisma.customer.delete({
        where: { id },
      });
  
      return {
        status: 'success',
        message: 'Customer deleted permanently',
        customer,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to delete customer: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}  