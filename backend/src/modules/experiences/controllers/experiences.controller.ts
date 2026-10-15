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
import { CreateExperienceDto } from '../dto/create-experience.dto.js';
import { ExperiencePaginationQueryDto } from '../dto/experience-pagination-query.dto.js';
import { ExperienceResponseDto } from '../dto/experience-response.dto.js';
import { UpdateExperienceDto } from '../dto/update-experience.dto.js';
import { ExperiencesService } from '../services/experiences.service.js';

@ApiTags('experiences')
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Get()
  @ApiOperation({ summary: '/experiences' })
  @ApiResponse({ status: 200 })
  findAll(
    @Query() pagination: ExperiencePaginationQueryDto,
  ): Promise<PaginatedResponseDto<ExperienceResponseDto>> {
    return this.experiencesService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: '/experiences/:id' })
  @ApiResponse({ status: 200, type: ExperienceResponseDto })
  @ApiResponse({ status: 404, description: 'Experience not found' })
  findOne(@Param('id') id: string): Promise<ExperienceResponseDto> {
    return this.experiencesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/experiences' })
  @ApiResponse({ status: 201, type: ExperienceResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 400, description: 'Invalid dates' })
  create(
    @Body() createExperienceDto: CreateExperienceDto,
  ): Promise<ExperienceResponseDto> {
    return this.experiencesService.create(createExperienceDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/experiences/:id' })
  @ApiResponse({ status: 200, type: ExperienceResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 404, description: 'Experience not found' })
  update(
    @Param('id') id: string,
    @Body() updateExperienceDto: UpdateExperienceDto,
  ): Promise<ExperienceResponseDto> {
    return this.experiencesService.update(id, updateExperienceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/experiences/:id' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 404, description: 'Experience not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.experiencesService.delete(id);
  }
}
