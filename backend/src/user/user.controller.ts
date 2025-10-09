import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { IsNumber } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

class AssignRoleDto {
  @IsNumber()
  roleId: number;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles('admin')
  findAll(@Query() paginationDto: PaginationDto) {
    return this.userService.findAll(paginationDto.page, paginationDto.limit);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Post(':id/roles')
  @Roles('admin')
  assignRole(@Param('id') id: string, @Body() assignRoleDto: AssignRoleDto) {
    return this.userService.assignRole(+id, assignRoleDto.roleId);
  }

  @Put(':id/toggle-status')
  @Roles('admin')
  toggleStatus(@Param('id') id: string) {
    return this.userService.toggleStatus(+id);
  }

  @Delete(':id/roles/:roleId')
  @Roles('admin')
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.userService.removeRole(+id, +roleId);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.userService.delete(+id);
  }

  @Post('export')
  @Roles('admin')
  async exportUsers(@Query() paginationDto: PaginationDto) {
    return this.userService.exportUsers(paginationDto.page, paginationDto.limit);
  }
}