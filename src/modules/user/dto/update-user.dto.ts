import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  apellido?: string;

  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  motivo?: string;
}
