import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

export class CreateUserDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  apellido: string;

  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  nombreUsuario: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contraseña: string;

  @IsEnum(UserRole, { message: 'El rol debe ser "admin" o "user"' })
  role: UserRole;
}
