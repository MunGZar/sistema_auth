import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Asignar un ID único a cada request
    const requestId = randomUUID();
    const timestamp = new Date().toISOString();

    // Guardar el ID y la hora en el request
    (req as any).requestId = requestId;
    (req as any).timestamp = timestamp;

    // Mostrar en consola la petición
    console.log(
      `[${timestamp}] [${requestId}] ${req.method} ${req.originalUrl}`,
    );

    next();
  }
}
