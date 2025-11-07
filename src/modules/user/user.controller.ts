import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeactivateUserDto } from './dto/desactivate-user.dto';

// 🔹 Imports agregados
import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import { RolesGuard } from './../auth/guards/roles.guard';
import { ActiveUserGuard } from './../auth/guards/active-user.guard';
import { Roles } from './../auth/decorators/roles.decorator';


@Controller('users')
// 🔐 Protegemos todas las rutas con los guards
@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Crear usuario (solo admin)
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateUserDto, @Req() req) {
    // actor viene del token JWT (req.user)
    return this.usersService.create(dto, req.user);
  }

  // ✅ Ver todos los usuarios (solo admin)
  @Get()
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  // ✅ Ver un usuario por ID (solo admin o moderador)
  @Get(':id')
  @Roles('admin', 'moderator')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  // ✅ Actualizar usuario (solo admin)
  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: number, @Body() dto: UpdateUserDto, @Req() req) {
    return this.usersService.update(id, dto, req.user);
  }

  // ✅ Desactivar usuario (solo admin)
  @Patch(':id/deactivate')
  @Roles('admin')
  deactivate(@Param('id') id: number, @Body() dto: DeactivateUserDto, @Req() req) {
    return this.usersService.deactivate(id, dto, req.user);
  }
}
