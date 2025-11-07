import { IsNotEmpty } from 'class-validator';

export class DeactivateUserDto {
  @IsNotEmpty()
  motivo: string;
}
