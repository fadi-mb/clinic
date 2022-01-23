import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
// import * as nodemailer from 'nodemailer';
const nodemailer = require('nodemailer');
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import AppointmentService from './appointment/appointment.service';
import moment from 'moment';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private oauth2Client;
  constructor(
    private readonly configService: ConfigService,
    private readonly appointmentService: AppointmentService,
  ) {
    const OAuth2 = google.auth.OAuth2;
    this.oauth2Client = new OAuth2(
      this.configService.get('OAUTH_GOOGLE_ID'),
      this.configService.get('OAUTH_GOOGLE_SECRET'),
      this.configService.get('OAUTH_GOOGLE_REDIRECT_URL'),
    );
    this.oauth2Client.setCredentials({
      refresh_token: this.configService.get('GOOGLE_MAIL_REFRESH_TOKEN'),
    });
  }

  async createTransporter() {
    const accessToken = await new Promise((resolve, reject) => {
      this.oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.error(err);
          reject('Failed to create access token :(');
        }
        resolve(token);
      });
    }).catch();

    const auth = {
      type: 'OAuth2',
      user: this.configService.get('APP_MAIL'),
      clientId: this.configService.get('OAUTH_GOOGLE_ID'),
      clientSecret: this.configService.get('OAUTH_GOOGLE_SECRET'),
      refreshToken: this.configService.get('GOOGLE_MAIL_REFRESH_TOKEN'),
      accessToken: accessToken,
    };
    const smtpTransport = nodemailer.createTransport({
      service: 'gmail',
      auth,
      tls: {
        rejectUnauthorized: false,
      },
    });
    return smtpTransport;
  }

  async sendMail(
    to: string,
    name: string,
    clinicName: string,
    address: string,
    date: Date,
  ) {
    const mailOptions = {
      from: this.configService.get('APP_MAIL'),
      to,
      subject: 'Appointment Reminder',
      generateTextFromHTML: true,
      html: ` <b>Dear ${name}, Kindly a reminder to your appointment in ${clinicName} - ${address} at ${date} </b>`,
    };

    return this.createTransporter().then((smtpTransport) =>
      smtpTransport.sendMail(mailOptions, (error: any, response: any) => {
        smtpTransport.close();
      }),
    );
  }

  dispatchReminder() {
    return this.appointmentService
      .getAppointmentsToRemind()
      .then((appointments) => {
        appointments.forEach((appointment) => {
          this.sendMail(
            appointment.patient.email,
            appointment.patient.firstName + ' ' + appointment.patient.lastName,
            appointment.clinic.name ?? 'clinic X',
            `${appointment.clinic.city ?? ''} ${
              appointment.clinic.street ?? ''
            }`,
            appointment.date,
          );
        });
      });
  }
  @Cron('0 0 * * * *')
  handleCron() {
    this.dispatchReminder();
  }
}
