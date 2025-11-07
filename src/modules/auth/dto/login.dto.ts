import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El email o nombre de usuario es requerido' })
  @IsString({
    message: 'El email o nombre de usuario debe ser una cadena de texto',
  })
  emailOrUsername: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  password: string;
}
