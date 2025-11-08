import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  actor: string; // Usuario o admin que ejecutó la acción

  @Column()
  action: string; // Tipo de acción (crear, actualizar, desactivar)

  @Column({ nullable: true })
  motivo: string; // Motivo o razón del cambio

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
