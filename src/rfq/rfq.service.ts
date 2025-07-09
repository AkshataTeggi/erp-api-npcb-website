// // correct
import { Injectable, HttpException, HttpStatus, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRfqDto, UpdateRfqDto } from './dto/rfq.dto';
import { EmailService } from '../email/email.service';
import { NotificationService } from 'src/notification/notification.service';
import * as path from 'path';
import * as fs from 'fs';
import { ApiResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { throwError } from 'rxjs';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { Rfq } from '@prisma/client';
import { connect } from 'http2';
import { UploadService } from '../upload/upload.service';
import { CustomerService } from '../customer/customer.service';
import { NewRFQService } from '../rfq/newrfq.service'; 
import moment from 'moment-timezone';


const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

@Injectable()
export class RfqService {
  uploadService: any;
  constructor(
    private readonly prisma: PrismaService,private emailService: EmailService,
    private newRFQService: NewRFQService,
     private readonly customerService: CustomerService,
     private readonly notificationService: NotificationService,
  ) { }


  async generateRfqId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last two digits of year
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Two-digit month
    const prefix = `${year}${month}`; // e.g., "2502" for Feb 2025

    // Step 1: Find the latest RFQ created in the current month
    const lastRfq = await this.prisma.rfq.findFirst({
      where: {
        id: { startsWith: prefix }, // Search RFQs of this month
      },
      orderBy: { id: "desc" }, // Get the latest RFQ
      select: { id: true }, // Fetch only the ID
    });

    // Step 2: Extract and increment sequence
    let newSequence = "0001"; // Default for first RFQ of the month
    if (lastRfq) {
      const lastSequence = parseInt(lastRfq.id.slice(-4), 10); // Extract last 4 digits
      newSequence = String(lastSequence + 1).padStart(4, "0"); // Increment sequence
    }

    // Step 3: Return new unique RFQ ID
    return `${prefix}${newSequence}`; // e.g., "25020001", "25020002"
  }


async createRFQ(createRfqDto: any, rfqFiles?: any[]) {
  const { services, rfqSpecs = [], files = [], createdAt, newsletter, ..._data } = createRfqDto;

  try {
    const rfqId = await this.generateRfqId();
    const now = new Date();
    const downloadUrls = [];

    if (createdAt && new Date(createdAt).toISOString() !== now.toISOString()) {
      throw new HttpException("Invalid date: You cannot set a custom createdAt value.", HttpStatus.BAD_REQUEST);
    }

    const { name: customerName, email: customerEmail, company, mobile } = _data;

    if (!customerEmail) {
      throw new HttpException("Customer email is required", HttpStatus.BAD_REQUEST);
    }

    // Find or create customer
    let customer = await this.prisma.customer.findFirst({
      where: { OR: [{ email: customerEmail }, { mobile }] },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: { name: customerName, email: customerEmail, company, mobile, newsletter },
      });
      console.log(`✅ Customer created: ${customer.id}`);
    } else {
      console.log(`ℹ️ Customer already exists: ${customer.id}`);
    }

    // Validate existing files
    const existingFiles = files?.length
      ? await this.prisma.file.findMany({
          where: { id: { in: files.map((file) => file.id) } },
          select: { id: true },
        })
      : [];

    const validFileIds = existingFiles.map((file) => file.id);

    // Create RFQ
    const _newRfq = await this.prisma.rfq.create({
      data: {
        ..._data,
        id: rfqId,
        customerId: customer.id,
        services: {
          connect: services?.map((service) => ({ id: service.id })) || [],
        },
        rfqSpecifications: {
          createMany: {
            data: await Promise.all(
              rfqSpecs.map(async (spec) => ({
                specificationId: spec.specId,
                value: spec.value === true ? 'true' : spec.value === false ? 'false' : spec.value,
              })),
            ),
          },
        },
        files: {
          connect: validFileIds.map((id) => ({ id })),
        },
      },
      include: {
        services: true,
        rfqSpecifications: {
          include: {
            specification: {
              select: { id: true, name: true, allowedUnits: true, allowCustom: true },
            },
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            originalname: true,
            mimetype: true,
            size: true,
          },
        },
      },
    });

    // 🔗 Build download URLs (no attachments)
    for (const file of _newRfq.files) {
      downloadUrls.push({
        name: file.originalname,
        url: `https://server.networkpcb.com/upload/download/${_newRfq.id}/${file.filename}`,
      });
    }

    // ✅ Send confirmation email to customer
    if (_newRfq.email && _newRfq.name) {
      try {
        const formattedCreatedAt = moment(_newRfq.createdAt)
          .tz('America/Los_Angeles')
          .format('YYYY-MM-DD hh:mm A z');

        const customerEmailData = {
          id: _newRfq.id,
          name: _newRfq.name,
          company: _newRfq.company,
          quantity: _newRfq.quantity,
          mobile: _newRfq.mobile,
          email: _newRfq.email,
          projectName: _newRfq.projectName,
          address: _newRfq.address,
          description: _newRfq.description,
          createdAt: formattedCreatedAt,
          services: _newRfq.services,
          rfqSpecifications: _newRfq.rfqSpecifications,
          files: _newRfq.files,
        };

        console.log("📧 Sending customer email:", JSON.stringify(customerEmailData, null, 2));

        await this.emailService.sendEmail(
          _newRfq.email,
          "Confirmation – We've Received Your Request",
          "rfq_customer",
          customerEmailData,
        );

        console.log(`✅ Email sent to customer: ${_newRfq.email}`);
      } catch (emailError) {
        console.error("⚠️ Email error (customer):", emailError.message);
      }
    } else {
      console.warn("⚠️ Missing email or name — skipping customer email.");
    }

    // ✅ Send RFQ to admin (only with download URLs)
    try {
      await this.newRFQService.sendNewRFQEmail({
        ..._newRfq,
        downloadUrls,
      });

      console.log('✅ RFQ sent to admin with download URLs');
    } catch (adminEmailError) {
      console.error('⚠️ Error sending RFQ to admin:', adminEmailError.message);
    }

    // ✅ Save notification
    await this.prisma.notification.create({
      data: {
        type: 'RFQ',
        user: customerName,
        message: `New RFQ Submitted: ${_newRfq.id} with services: ${_newRfq.services.map(s => s.name).join(', ')}`,
        rfqId: _newRfq.id,
        customerId: customer.id,
        isRead: false,
      },
    });

    return _newRfq;
  } catch (error) {
    console.error('❌ Error submitting RFQ:', error);
    throw new HttpException(error.message || 'Error submitting RFQ', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}



  async archiveRfq(id: string): Promise<Rfq> {
    return await this.prisma.rfq.update({
      where: { id },
      data: { isArchived: true }, // Update this based on your schema
    });
  }

  async findArchivedRfqs(): Promise<Rfq[]> {
    console.log('Fetching archived RFQs from the database...');

    const archivedRfqs = await this.prisma.rfq.findMany({
      where: { isArchived: true }, // Only get RFQs where isArchived = true
      orderBy: { createdAt: 'desc' }, // Latest first
    });

    console.log('Found Archived RFQs:', archivedRfqs);

    if (archivedRfqs.length === 0) {
      console.log(' No archived RFQs found!');
      throw new NotFoundException('No archived RFQs found');
    }

    return archivedRfqs;
  }

  async unarchiveRfq(id: string): Promise<Rfq> {
    try {
      const unarchivedRfq = await this.prisma.rfq.update({
        where: { id },
        data: { isArchived: false }, // Set isArchived to false
      });

      console.log(`RFQ with ID: ${id} has been unarchived.`);
      return unarchivedRfq;
    } catch (error) {
      console.error("Error unarchiving RFQ:", error);
      throw new HttpException('Error unarchiving RFQ', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllRfq(
    page: number = 1,
    limit: number = 10,
    date?: string,
    searchQuery?: string,
    serviceId?: string
  ) {
    try {
      console.log(
        `Fetching RFQs - Page: ${page}, Limit: ${limit}, Search: ${searchQuery}, Date: ${date}, Service: ${serviceId}`
      );

      const pageNumber = Math.max(1, page);
      const pageSize = Math.max(1, limit);

      let whereClause: any = {
        isArchived: false,
        deletedAt: null,
      };
      const total = await this.prisma.rfq.count({ where: whereClause });

      const rfqs = await this.prisma.rfq.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          services: true,
          rfqSpecifications: {
            include: {
              specification: { select: { id: true, name: true } },
            },
          },
          files: true,
        },
      });

      return {
        data: rfqs.map((rfq) => ({
          ...rfq,
          services: rfq.services || [],
          rfqSpecifications: rfq.rfqSpecifications || [],
          files: rfq.files || [],
        })),
        total,
        page: pageNumber,
        limit: pageSize,
      };
    } catch (error) {
      console.error('Error fetching RFQs:', error.message);
      throw new HttpException('Failed to fetch RFQs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async searchRFQs(
    query?: string,
    service?: string,
    toDate?: string,
    fromDate?: string,
    page: Number = 1,
    limit?: number 
  ) {
    try {

 console.log(" search query started")
 
 const allowedLimits = [10, 25, 50, 100,250,500, 1000,2000];
 const pageNumber = Math.max(1, Number(page));
 const pageSize = allowedLimits.includes(Number(limit)) ? Number(limit) : 10;

      let whereClause: any = { deletedAt: null };

      if (query && query.trim() !== "") {

        whereClause.OR = [
          { id: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ];

      }

      
      if (service && service.trim() !== ""&&service!=undefined) {
        whereClause.services = { some: { id: service } };
      } else {
        // Ensure the filter is cleared if no service is selected
        delete whereClause.services;
      }


      const parseDate = (dateString: string) => {
        const parsedDate = new Date(dateString);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
      };
      
      const fromDateParsed = fromDate ? parseDate(fromDate) : null;
      const toDateParsed = toDate ? parseDate(toDate) : null;
      
      if (toDateParsed) {
        toDateParsed.setHours(23, 59, 59, 999); // Ensure the full day is covered
      }
      
      if (fromDateParsed && toDateParsed) {
        whereClause.createdAt = {
          gte: fromDateParsed,
          lte: toDateParsed,
        };
      } else if (fromDateParsed) {
        whereClause.createdAt = { gte: fromDateParsed };
      } else if (toDateParsed) {
        whereClause.createdAt = { lte: toDateParsed };
      }
      
   console.log("Final whereClause:", JSON.stringify(whereClause, null, 2));
      
      const totalResults = await this.prisma.rfq.count({ where: whereClause });

      if (totalResults === 0) {
        return {
          total: 0,
          page: pageNumber,
          limit: pageSize,
          data: [],
          message: "No results found",
        };
      }


      const matchingRFQs = await this.prisma.rfq.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        include: {
          services: true,
          rfqSpecifications: {
            include: { specification: { select: { id: true, name: true } } },
          },
          files: true,
        },
      });

      console.log("GTE (fromDateParsed):", fromDateParsed);
      console.log("LTE (toDateParsed):", toDateParsed);

      console.log("Pagination - Page:", pageNumber, "Limit:", pageSize);
      return {
        total:totalResults,
        page: pageNumber,
        limit: pageSize,
        data: matchingRFQs,
      };

    } catch (error) {
      console.error('Error in searchRFQs:', error);
      throw new Error('Something went wrong!');
    }
  }


  async findRfqById(id: string): Promise<Rfq> {
    console.log(`Fetching RFQ with ID: ${id}`);

    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        files: true,
        services: true, // Include related services
        rfqSpecifications: {
          include: {
            specification: { select: { id: true, name: true } }, // Include specification details
          },
        },
      },
    });

    if (!rfq) {
      throw new HttpException('RFQ not found', HttpStatus.NOT_FOUND);
    }

    if (rfq.files) {
      rfq.files = rfq.files.map(file => ({
        ...file,
        path: `assets/${file.path}`, // Adjust file path to be relative
      }));
    }

    return rfq;
  }


  async deleteRfqFileById(fileId: string): Promise<any> {
    const file = await this.prisma.file.delete({
      where: { id: fileId },
    });

    if (file) {
      // Delete file from assets folder
      const fullFilePath = path.join(__dirname, '..', 'assets', file.path);

      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath); // Remove the file from the filesystem
      }
      await this.prisma.file.delete({
        where: { id: fileId },
      });

      return file;
    }
  }

  async softDeleteRFQ(id: string) {
    return this.prisma.rfq.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async moveRFQToTrash(rfqId: string) {
    return this.prisma.rfq.update({
      where: { id: rfqId },
      data: {
        deletedAt: new Date(), // Mark as deleted (soft delete)
      },
    });
  }
  async getSoftDeletedRFQs(page: number = 1, limit: number = 10): Promise<{ data: Rfq[]; total: number; page: number; limit: number }> {
    try {
      console.log(`Fetching Soft-Deleted RFQs - Page: ${page}, Limit: ${limit}`);

      const pageNumber = Math.max(1, page);
      const pageSize = Math.max(1, limit);

      // Get total count of soft-deleted RFQs
      const total = await this.prisma.rfq.count({
        where: { deletedAt: { not: null } },
      });

      // Fetch paginated soft-deleted RFQs
      const rfqs = await this.prisma.rfq.findMany({
        where: { deletedAt: { not: null } },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { deletedAt: 'desc' },
      });

      return {
        data: rfqs,
        total,
        page: pageNumber,
        limit: pageSize,
      };
    } catch (error) {
      console.error('Error fetching soft-deleted RFQs:', error);
      throw new HttpException('Failed to fetch soft-deleted RFQs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findArchivedRfqById(page: number = 1, limit: number = 10): Promise<{ data: Rfq[]; total: number; page: number; limit: number }> {
    try {
      console.log(`Fetching Archived RFQs - Page: ${page}, Limit: ${limit}`);

      const pageNumber = Math.max(1, page);
      const pageSize = Math.max(1, limit);

      // Get total count of archived RFQs
      const total = await this.prisma.rfq.count({
        where: { isArchived: true },
      });

      // Fetch paginated archived RFQs
      const rfqs = await this.prisma.rfq.findMany({
        where: { isArchived: true },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      });

      return {
        data: rfqs,
        total,
        page: pageNumber,
        limit: pageSize,
      };
    } catch (error) {
      console.error('Error fetching archived RFQs:', error);
      throw new HttpException('Failed to fetch archived RFQs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async restoreRFQ(id: string) {
    return this.prisma.rfq.update({
      where: { id },
      data: { deletedAt: null },
    });
  }


  async updateRfq(id: string, updateRfqDto: UpdateRfqDto): Promise<Rfq> {
    try {
      const existingRfq = await this.prisma.rfq.findUnique({
        where: { id },
      });

      if (!existingRfq) {
        throw new HttpException('Rfq not found', HttpStatus.NOT_FOUND);
      }
      const updatedRfq = await this.prisma.rfq.update({
        where: { id },
        data: {
          ...updateRfqDto
        },
        include: {
          files: true,
          services: true
        }
      });
      return updatedRfq;
    } catch (error) {
      console.error('Error updating Rfq:', error.message);
      throw new HttpException('Failed to update Rfq', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async deleteTrashRFQ(rfqId: string) {
    try {
      const rfq = await this.prisma.rfq.findUnique({
        where: { id: rfqId },
      });

      if (!rfq) {
        throw new HttpException('RFQ not found', HttpStatus.NOT_FOUND);
      }

      if (!rfq.deletedAt) {
        throw new HttpException('RFQ is not in trash', HttpStatus.BAD_REQUEST);
      }

      await this.prisma.rfq.delete({
        where: { id: rfqId },
      });

      return { message: 'RFQ deleted' };
    } catch (error) {
      console.error('Error deleting RFQ:', error);
      throw new HttpException(error.message || 'Failed to delete RFQ', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
