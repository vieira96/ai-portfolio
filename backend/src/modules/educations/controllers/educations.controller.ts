import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto.js';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard.js';
import { CreateEducationDto } from '../dto/create-education.dto.js';
import { ExperiencePaginationQueryDto } from '../../experiences/dto/experience-pagination-query.dto.js';
import { EducationResponseDto } from '../dto/education-response.dto.js';
import { UpdateEducationDto } from '../dto/update-education.dto.js';
import { EducationsService } from '../services/educations.service.js';

@ApiTags('educations')
@Controller('educations')
export class EducationsController {
  constructor(private readonly educationsService: EducationsService) {}

  @Get()
  @ApiOperation({ summary: '/educations' })
  @ApiResponse({ status: 200 })
  findAll(
    @Query() pagination: ExperiencePaginationQueryDto,
  ): Promise<PaginatedResponseDto<EducationResponseDto>> {
    return this.educationsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: '/educations/:id' })
  @ApiResponse({ status: 200, type: EducationResponseDto })
  @ApiResponse({ status: 404, description: 'Education not found' })
  findOne(@Param('id') id: string): Promise<EducationResponseDto> {
    return this.educationsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/educations' })
  @ApiResponse({ status: 201, type: EducationResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 400, description: 'Invalid dates' })
  create(
    @Body() createEducationDto: CreateEducationDto,
  ): Promise<EducationResponseDto> {
    return this.educationsService.create(createEducationDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/educations/:id' })
  @ApiResponse({ status: 200, type: EducationResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 404, description: 'Education not found' })
  update(
    @Param('id') id: string,
    @Body() updateEducationDto: UpdateEducationDto,
  ): Promise<EducationResponseDto> {
    return this.educationsService.update(id, updateEducationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/educations/:id' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 404, description: 'Education not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.educationsService.delete(id);
  }
}
