import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/userService';
import { Result } from '@/lib/result';
import { UserDao } from '@/lib/userDao';
import fs from 'fs';
import path from 'path';

/**
 * @swagger
 * /api/user/sync-face-users:
 *   post:
 *     summary: 同步人脸识别用户
 *     description: 读取人脸识别系统配置文件，将用户信息同步到数据库。
 *     responses:
 *       200:
 *         description: 同步成功，返回同步用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     faceUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                     syncedUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           action:
 *                             type: string
 *                     total:
 *                       type: integer
 *                 msg:
 *                   type: string
 *       404:
 *         description: 配置文件不存在
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 msg:
 *                   type: string
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 msg:
 *                   type: string
 */
export async function POST(request: NextRequest) {
  try {
    // 读取人脸识别系统的配置文件
    const configPath = path.join(process.cwd(), 'face-recognition-cv2-master', 'face-recognition-cv2-master', 'config.txt');
    
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(Result.error('404', '人脸识别配置文件不存在'));
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    const lines = configContent.split('\n').filter(line => line.trim());
    
    const faceUsers: { id: number; username: string }[] = [];
    
    for (const line of lines) {
      if (line.includes('Total_face_num')) continue;
      
      const parts = line.split(':');
      if (parts.length === 2) {
        const id = parseInt(parts[0].trim());
        const username = parts[1].trim();
        if (!isNaN(id)) {
          faceUsers.push({ id, username });
        }
      }
    }
    
    console.log('发现人脸识别用户:', faceUsers);
    
    // 同步用户到数据库
    const syncedUsers = [];
    for (const faceUser of faceUsers) {
      try {
        // 检查用户是否已存在
        let user = await UserDao.findById(faceUser.id);
        
        if (!user) {
          // 直接创建用户，指定uid
          const hashedPassword = await require('bcryptjs').hash(`face_user_${faceUser.id}`, 10);
          
          // 使用原始SQL插入，指定uid
          const { pool } = require('@/lib/database');
          const [result] = await pool.execute(
            'INSERT INTO user (uid, uname, password_hash, email) VALUES (?, ?, ?, ?)',
            [faceUser.id, faceUser.username, hashedPassword, `${faceUser.username}@face.local`]
          );
          
          syncedUsers.push({
            id: faceUser.id,
            username: faceUser.username,
            action: 'created'
          });
        } else {
          syncedUsers.push({
            id: faceUser.id,
            username: faceUser.username,
            action: 'exists'
          });
        }
      } catch (error) {
        console.error(`同步用户 ${faceUser.username} 失败:`, error);
      }
    }
    
    return NextResponse.json(Result.success('1', {
      faceUsers,
      syncedUsers,
      total: syncedUsers.length
    }, '用户同步完成'));
    
  } catch (error) {
    console.error('同步人脸识别用户失败:', error);
    return NextResponse.json(Result.error('500', '服务器内部错误'));
  }
} 