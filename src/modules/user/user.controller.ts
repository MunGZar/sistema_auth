import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Delete,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeactivateUserDto } from './dto/desactivate-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Crear usuario
   * Ejemplo JSON:
   * {
   *   "nombre": "Carlos",
   *   "apellido": "Ramírez",
   *   "nombreUsuario": "carlosr",
   *   "email": "carlos@mail.com",
   *   "contraseña": "123456",
   *   "role": "user"
   * }
   */
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() data: CreateUserDto) {
    return await this.usersService.create(data);
  }

  /**
   * Listar todos los usuarios
   */
  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  /**
   * Obtener un usuario por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findOne(id);
  }

  /**
   * Actualizar usuario
   * Ejemplo JSON:
   * {
   *   "apellido": "Ramírez Gómez",
   *   "motivo": "Corrección de apellido"
   * }
   */
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
    return await this.usersService.update(id, data);
  }

  /**
   * Desactivar usuario (solo admin)
   * Ejemplo JSON:
   * {
   *   "motivo": "Inactividad prolongada"
   * }
   */
  @Delete(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: DeactivateUserDto,
  ) {
    return await this.usersService.deactivate(id, data.motivo);
  }
}
