import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  apellido: string;

  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @MinLength(3, {
    message: 'El nombre de usuario debe tener al menos 3 caracteres',
  })
  @MaxLength(30, {
    message: 'El nombre de usuario no puede exceder 30 caracteres',
  })
  nombreUsuario: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial',
  })
  password: string;

    @IsEnum(UserRole, { message: 'El rol debe ser "admin" o "user"' })
    role: UserRole;
}
