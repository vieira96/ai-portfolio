import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard.js';
import { UploadsService } from '../services/uploads.service.js';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiCookieAuth()
  @ApiOperation({ summary: '/uploads' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'avatars' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Uploaded file url',
    schema: {
      type: 'object',
      properties: { url: { type: 'string', example: 'avatars/uuid.png' } },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<{ url: string }> {
    return this.uploadsService.upload(file.buffer, file.mimetype, folder);
  }
}
