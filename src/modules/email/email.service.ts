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

    if (!emailHost || !emailUser || !emailPass) {
      throw new InternalServerErrorException(
        'Las variables de entorno de configuración de correo (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) no están configuradas.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  async sendWelcomeEmail(user: User) {
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
    // No se compila con handlebars por ahora, solo se envía el template.
    // Para una implementación completa, se necesitaría handlebars.

    const mailOptions = {
      from: '"No Reply" <noreply@example.com>',
      to: user.email,
      subject: '¡Bienvenido a nuestra plataforma!',
      html: source.replace('{{name}}', user.nombre), // Reemplazo simple
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      // Ya no se usa Ethereal, así que no hay URL de previsualización.
    } catch (error) {
      console.error('Error sending email: ', error);
    }
  }

  async sendPasswordResetEmail(user: User, code: string) {
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
      from: '"Soporte de Cuenta" <support@example.com>',
      to: user.email,
      subject: 'Código de Recuperación de Contraseña',
      html: source
        .replace('{{name}}', user.nombre)
        .replace('{{resetPasswordCode}}', code),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent: %s', info.messageId);
    } catch (error) {
      console.error('Error sending password reset email: ', error);
    }
  }
}
