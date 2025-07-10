// 内存存储验证码（临时方案）
const codeStorage = new Map<string, { code: string; expireTime: number }>();

export class EmailCodeUtil {
  private static readonly CODE_EXPIRE_TIME = 300; // 5分钟过期

  /**
   * 生成6位数字验证码
   */
  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 保存验证码到内存
   */
  static async saveCode(email: string, code: string): Promise<void> {
    const expireTime = Date.now() + this.CODE_EXPIRE_TIME * 1000;
    codeStorage.set(email, { code, expireTime });
    
    // 5分钟后自动清理
    setTimeout(() => {
      codeStorage.delete(email);
    }, this.CODE_EXPIRE_TIME * 1000);
  }

  /**
   * 检查验证码是否正确
   */
  static async checkCode(email: string, code: string): Promise<boolean> {
    const stored = codeStorage.get(email);
    if (!stored) return false;
    
    // 检查是否过期
    if (Date.now() > stored.expireTime) {
      codeStorage.delete(email);
      return false;
    }
    
    return stored.code === code;
  }

  /**
   * 移除验证码
   */
  static async removeCode(email: string): Promise<void> {
    codeStorage.delete(email);
  }
} 