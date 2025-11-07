import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async registrarEvento(actor: string, action: string, motivo: string) {
    const log = this.auditRepository.create({
      actor,
      action,
      motivo,
    });
    await this.auditRepository.save(log);
  }
}
