import { pool } from './database';

export interface User {
  uid: number;
  uname: string;
  password_hash: string;
  email: string;
  phone?: string; // 新增
  avatar?: string;
  role?: string; // 新增
}

export class UserDao {
  /**
   * 根据用户名查找用户
   */
  static async findByUsername(uname: string): Promise<User | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user WHERE uname = ?',
        [uname]
      );
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('查询用户失败:', error);
      throw error;
    }
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user WHERE email = ?',
        [email]
      );
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('查询用户失败:', error);
      throw error;
    }
  }

  /**
   * 根据手机号查找用户
   */
  static async findByPhone(phone: string): Promise<User | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user WHERE phone = ?',
        [phone]
      );
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('查询用户失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户ID查找用户
   */
  static async findById(uid: number): Promise<User | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM user WHERE uid = ?',
        [uid]
      );
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('查询用户失败:', error);
      throw error;
    }
  }

  /**
   * 创建新用户
   */
  static async create(user: Omit<User, 'uid'>): Promise<User> {
    try {
      const [result] = await pool.execute(
        'INSERT INTO user (uname, password_hash, email, phone, role) VALUES (?, ?, ?, ?, ?)',
        [user.uname, user.password_hash, user.email, user.phone || null, user.role || 'unauthenticated']
      );
      const insertResult = result as any;
      return {
        uid: insertResult.insertId,
        ...user,
        role: user.role || 'unauthenticated'
      };
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  static async update(uid: number, updates: Partial<User>): Promise<boolean> {
    try {
      const fields = Object.keys(updates).filter(key => key !== 'uid');
      const values = fields.map(field => updates[field as keyof User]);
      
      if (fields.length === 0) return false;

      const [result] = await pool.execute(
        `UPDATE user SET ${fields.map(field => `${field} = ?`).join(', ')} WHERE uid = ?`,
        [...values, uid]
      );
      
      const updateResult = result as any;
      return updateResult.affectedRows > 0;
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户
   */
  static async delete(uid: number): Promise<boolean> {
    try {
      const [result] = await pool.execute(
        'DELETE FROM user WHERE uid = ?',
        [uid]
      );
      const deleteResult = result as any;
      return deleteResult.affectedRows > 0;
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有用户
   */
  static async findAll(): Promise<User[]> {
    try {
      const [rows] = await pool.execute('SELECT * FROM user');
      return rows as User[];
    } catch (error) {
      console.error('查询所有用户失败:', error);
      throw error;
    }
  }
} 