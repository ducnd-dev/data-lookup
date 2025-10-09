import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RoleService } from './role.service';

class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class AssignPermissionDto {
  @IsNumber()
  permissionId: number;
}

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Post()
  @Roles('admin')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto.name, createRoleDto.description);
  }

  @Get()
  @Roles('admin')
  findAll(@Query() paginationDto: PaginationDto) {
    return this.roleService.findAll(paginationDto.page, paginationDto.limit);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(+id);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(+id, updateRoleDto.name, updateRoleDto.description);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.roleService.delete(+id);
  }

  @Post(':id/permissions')
  @Roles('admin')
  assignPermission(@Param('id') id: string, @Body() dto: AssignPermissionDto) {
    return this.roleService.assignPermission(+id, dto.permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  @Roles('admin')
  removePermission(@Param('id') id: string, @Param('permissionId') permissionId: string) {
    return this.roleService.removePermission(+id, +permissionId);
  }
}