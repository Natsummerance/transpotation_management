import bcrypt from 'bcryptjs';
import { UserDao, User } from './userDao';

export class UserService {
  /**
   * 用户登录服务
   */
  static async loginService(account: string, password: string): Promise<User | null> {
    try {
      let user: User | null = null;
      if (/^1[3-9]\d{9}$/.test(account)) {
        user = await UserDao.findByPhone(account);
      } else if (account.includes('@')) {
        user = await UserDao.findByEmail(account);
      } else {
        user = await UserDao.findByUsername(account);
      }
      if (!user) return null;
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) return null;
      return user;
    } catch (error) {
      console.error('登录服务失败:', error);
      throw error;
    }
  }

  /**
   * 用户注册服务
   */
  static async registService(newUser: { uname: string; password: string; email: string; phone?: string }): Promise<User | null> {
    try {
      // 检查用户名是否已存在
      const existingUser = await UserDao.findByUsername(newUser.uname);
      if (existingUser) {
        return null; // 用户名已存在
      }

      // 校验邮箱格式
      if (newUser.email && !newUser.email.includes('@')) {
        throw new Error('邮箱格式不正确');
      }
      // 校验手机号格式
      if (newUser.phone && !/^1[3-9]\d{9}$/.test(newUser.phone)) {
        throw new Error('手机号格式不正确');
      }

      // 检查邮箱是否已存在
      if (newUser.email) {
        const existingEmail = await UserDao.findByEmail(newUser.email);
        if (existingEmail) {
          return null; // 邮箱已存在
        }
      }

      // 检查手机号是否已存在
      if (newUser.phone) {
        const existingPhone = await UserDao.findByPhone(newUser.phone);
        if (existingPhone) {
          return null; // 手机号已存在
        }
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(newUser.password, 10);

      // 创建新用户
      const user = await UserDao.create({
        uname: newUser.uname,
        email: newUser.email,
        phone: newUser.phone,
        password_hash: hashedPassword
      });

      return user;
    } catch (error) {
      console.error('注册服务失败:', error);
      throw error;
    }
  }

  /**
   * 邮箱验证码登录服务
   */
  static async loginByEmail(email: string): Promise<User | null> {
    try {
      // 根据邮箱查找用户
      const user = await UserDao.findByEmail(email);
      return user;
    } catch (error) {
      console.error('邮箱登录服务失败:', error);
      throw error;
    }
  }

  /**
   * 人脸识别服务（模拟实现）
   */
  static async faceRecognitionService(imageBase64: string): Promise<User | null> {
    try {
      // 调用后端人脸识别API
      const response = await fetch('http://localhost:5000/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64
        }),
      });

      const result = await response.json();
      
      if (result.success && result.user_id) {
        // 根据识别到的用户ID查找用户信息
        const user = await UserDao.findById(result.user_id);
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('人脸识别服务失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户ID获取用户信息
   */
  static async getUserById(uid: number): Promise<User | null> {
    try {
      return await UserDao.findById(uid);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUser(uid: number, updates: Partial<User> & { password?: string; avatar?: string }): Promise<boolean> {
    try {
      // 如果要更新密码，需要加密并存储到 password_hash 字段
      if (updates.password) {
        const hashedPassword = await bcrypt.hash(updates.password, 10);
        updates.password_hash = hashedPassword;
        delete updates.password; // 删除原始密码字段
      }

      return await UserDao.update(uid, updates);
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户
   */
  static async deleteUser(uid: number): Promise<boolean> {
    try {
      return await UserDao.delete(uid);
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有用户
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      return await UserDao.findAll();
    } catch (error) {
      console.error('获取所有用户失败:', error);
      throw error;
    }
  }
}