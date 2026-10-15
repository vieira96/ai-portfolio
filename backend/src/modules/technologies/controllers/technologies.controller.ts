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
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard.js';
import { CreateTechnologyDto } from '../dto/create-technology.dto.js';
import { TechnologyResponseDto } from '../dto/technology-response.dto.js';
import { UpdateTechnologyDto } from '../dto/update-technology.dto.js';
import { TechnologiesService } from '../services/technologies.service.js';

@ApiTags('technologies')
@Controller('technologies')
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) {}

  @Get()
  @ApiOperation({ summary: '/technologies' })
  @ApiResponse({ status: 200, type: [TechnologyResponseDto] })
  findAll(): Promise<TechnologyResponseDto[]> {
    return this.technologiesService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/technologies' })
  @ApiResponse({ status: 201, type: TechnologyResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 409, description: 'Technology already exists' })
  create(
    @Body() createTechnologyDto: CreateTechnologyDto,
  ): Promise<TechnologyResponseDto> {
    return this.technologiesService.create(createTechnologyDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/technologies/:id' })
  @ApiResponse({ status: 200, type: TechnologyResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 404, description: 'Technology not found' })
  @ApiResponse({ status: 409, description: 'Technology already exists' })
  update(
    @Param('id') id: string,
    @Body() updateTechnologyDto: UpdateTechnologyDto,
  ): Promise<TechnologyResponseDto> {
    return this.technologiesService.update(id, updateTechnologyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/technologies/:id' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 404, description: 'Technology not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.technologiesService.delete(id);
  }
}
