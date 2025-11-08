import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../../entities/user.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    console.log('Configuración inicial de email:', {
      host: emailHost,
      port: emailPort,
      user: emailUser,
      hasPass: !!emailPass
    });

    if (!emailHost || !emailUser || !emailPass) {
      console.warn(
        'Configuración de email incompleta. Usando modo de prueba.',
      );
      // En modo de prueba, usar un transporte que solo loguea
      this.transporter = nodemailer.createTransport({
        jsonTransport: true
      });
      return;
    }

    // Configuración específica para Gmail
    const transportConfig = {
      service: 'gmail', // Usar el servicio predefinido de Gmail
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass, // Debe ser una contraseña de aplicación
      },
      tls: {
        rejectUnauthorized: false // Necesario en algunos entornos
      },
      logger: true,
      debug: true
    };

    this.transporter = nodemailer.createTransport(transportConfig);
    
    // Verificar la conexión
    this.transporter.verify((error) => {
      if (error) {
        console.error('Error al verificar la configuración de email:', error);
      } else {
        console.log('Servidor de email listo para enviar mensajes');
      }
    });
  }

  async sendWelcomeEmail(user: User) {
    console.log(`Intentando enviar correo de bienvenida a: ${user.email}`);

    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'modules',
      'auth',
      'templates',
      'welcome.hbs',
    );
    const source = fs.readFileSync(templatePath, 'utf-8').toString();
    
    const mailOptions = {
      from: `"Sistema Auth" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '¡Bienvenido a nuestra plataforma!',
      html: source.replace('{{name}}', user.nombre),
    };

    try {
      console.log('Configuración del transporter:', {
        auth: {
          user: process.env.EMAIL_USER,
          // No mostramos la contraseña por seguridad
        }
      });

      console.log('Intentando enviar email con las siguientes opciones:', {
        to: mailOptions.to,
        from: mailOptions.from,
        subject: mailOptions.subject
      });

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email de bienvenida enviado exitosamente:', {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      });

    } catch (error) {
      console.error('Error al enviar email de bienvenida:', {
        error: error.message,
        stack: error.stack,
        errorCode: error.code,
        errorResponse: error.response
      });
      throw new Error(`Error al enviar email de bienvenida: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(user: User, code: string) {
    console.log(`Intentando enviar correo de recuperación a: ${user.email}`);
    
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'modules',
      'auth',
      'templates',
      'reset-password.hbs',
    );
    const source = fs.readFileSync(templatePath, 'utf-8').toString();

    const mailOptions = {
      from: `"Sistema Auth" <${process.env.EMAIL_USER}>`, // Usar el email configurado
      to: user.email,
      subject: 'Código de Recuperación de Contraseña',
      html: source
        .replace('{{name}}', user.nombre)
        .replace('{{resetPasswordCode}}', code),
    };

    try {
      console.log('Intentando enviar email con las siguientes opciones:', {
        to: mailOptions.to,
        from: mailOptions.from,
        subject: mailOptions.subject
      });
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado exitosamente:', {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      });
      
      // Imprimir el código en desarrollo para facilitar pruebas
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Código de recuperación para ${user.email}: ${code}`);
      }
    } catch (error) {
      console.error('Error al enviar email:', {
        error: error.message,
        stack: error.stack,
        errorCode: error.code,
        errorResponse: error.response
      });
      throw new Error(`Error al enviar email: ${error.message}`);
    }
  }
}
