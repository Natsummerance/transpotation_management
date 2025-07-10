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

    // 调试信息
    console.log('邮箱配置信息:', {
      host: mailConfig.host,
      port: mailConfig.port,
      user: mailConfig.user ? `${mailConfig.user.substring(0, 3)}***` : '未配置',
      pass: mailConfig.pass ? '已配置' : '未配置'
    });

    this.transporter = nodemailer.createTransport({
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
      console.log('正在发送邮件到:', email);
      await this.transporter.sendMail(mailOptions);
      console.log(`验证码邮件已发送到: ${email}`);
    } catch (error: any) {
      console.error('发送邮件失败:', error);
      console.error('错误详情:', {
        code: error?.code,
        command: error?.command,
        response: error?.response,
        responseCode: error?.responseCode
      });
      throw new Error(`邮件发送失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 测试邮件发送
   */
  async testEmail(email: string): Promise<void> {
    await this.sendCodeEmail(email, '123456');
  }
} 