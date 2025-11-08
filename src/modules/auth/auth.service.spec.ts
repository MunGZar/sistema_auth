import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  actor: string; // quien realizó la acción (admin o usuario)

  @Column()
  action: string; // tipo de acción: crear, actualizar, desactivar

  @Column({ nullable: true })
  motivo: string; // razón o detalle de la acción

  @CreateDateColumn()
  createdAt: Date;
}
