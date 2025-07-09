import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, PrismaService],
})
export class UploadModule {}




// import { Module } from "@nestjs/common"
// import { UploadController } from "./upload.controller"
// import { UploadService } from "./upload.service"
// import { PrismaModule } from "../../prisma/prisma.module" // Adjust path as needed
// import { MulterModule } from "@nestjs/platform-express"
// import { diskStorage } from "multer"
// import { extname } from "path"
// import * as fs from "fs"

// @Module({
//   imports: [
//     PrismaModule, // Import PrismaModule to make PrismaService available
//     MulterModule.register({
//       storage: diskStorage({
//         destination: (req, file, cb) => {
//           // Ensure upload directories exist
//           const uploadDir = "./assets"
//           const tempChunksDir = "./temp-chunks"

//           if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir, { recursive: true })
//           }

//           if (!fs.existsSync(tempChunksDir)) {
//             fs.mkdirSync(tempChunksDir, { recursive: true })
//           }

//           cb(null, uploadDir)
//         },
//         filename: (req, file, cb) => {
//           const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
//           cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`)
//         },
//       }),
//       limits: {
//         fileSize: 5 * 1024 * 1024 * 1024, // 5GB
//         files: 200,
//       },
//     }),
//   ],
//   controllers: [UploadController],
//   providers: [UploadService],
//   exports: [UploadService], // Export if other modules need to use UploadService
// })
// export class UploadModule {}
