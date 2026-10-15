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
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto.js';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard.js';
import { CreateProjectDto } from '../dto/create-project.dto.js';
import { ProjectResponseDto } from '../dto/project-response.dto.js';
import { UpdateProjectDto } from '../dto/update-project.dto.js';
import { ProjectsService } from '../services/projects.service.js';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: '/projects' })
  @ApiResponse({ status: 200 })
  findAll(
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProjectResponseDto>> {
    return this.projectsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: '/projects/:id' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/projects' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  create(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/projects/:id' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/projects/:id' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.projectsService.delete(id);
  }
}
