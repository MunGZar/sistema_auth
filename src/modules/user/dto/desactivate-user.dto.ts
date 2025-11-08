import { IsString, MinLength } from 'class-validator';

export class DeactivateUserDto {
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  motivo: string;
}
