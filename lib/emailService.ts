import nodemailer from 'nodemailer';

interface MailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const mailConfig: MailConfig = {
      host: process.env.MAIL_HOST || 'smtp.qq.com',
      port: parseInt(process.env.MAIL_PORT || '465'),
      user: process.env.MAIL_USER || '',
      pass: process.env.MAIL_PASS || ''
    };

    this.transporter = nodemailer.createTransporter({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: true, // 使用 SSL
      auth: {
        user: mailConfig.user,
        pass: mailConfig.pass
      }
    });
  }

  /**
   * 发送验证码邮件
   */
  async sendCodeEmail(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: '登录验证码',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">验证码</h2>
          <p>您的登录验证码是：</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0;">
            ${code}
          </div>
          <p>验证码有效期为5分钟，请尽快使用。</p>
          <p>如果这不是您的操作，请忽略此邮件。</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`验证码邮件已发送到: ${email}`);
    } catch (error) {
      console.error('发送邮件失败:', error);
      throw new Error('邮件发送失败');
    }
  }

  /**
   * 测试邮件发送
   */
  async testEmail(email: string): Promise<void> {
    await this.sendCodeEmail(email, '123456');
  }
} 