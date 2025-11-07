import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  actor: string; // usuario/admin que hizo el cambio

  @Column()
  action: string; // tipo de acción (crear, actualizar, desactivar)

  @Column()
  motivo: string;

  @CreateDateColumn()
  createdAt: Date;
}
