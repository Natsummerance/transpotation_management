import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    
    // 参数验证和类型转换
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10') || 10));
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';
    
    console.log('API请求参数:', { page, limit, type, search });
    
    const offset = (page - 1) * limit;
    
    // 获取连接
    connection = await pool.getConnection();
    
    // 构建查询条件
    let whereClause = '';
    const whereParams: any[] = [];
    
    if (type && type !== 'all') {
      whereClause = 'WHERE module = ?';
      whereParams.push(String(type));
    }
    
    if (search) {
      if (whereClause) {
        whereClause += ' AND module LIKE ?';
      } else {
        whereClause = 'WHERE module LIKE ?';
      }
      whereParams.push(`%${String(search)}%`);
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM damage_reports ${whereClause}`;
    console.log('计数查询:', countQuery);
    console.log('计数参数:', whereParams);
    
    const [countResult] = await connection.execute(countQuery, whereParams);
    const total = Number((countResult as any)[0].total);
    
    console.log('总记录数:', total);
    
    // 获取数据 - 明确指定所有字段
    const dataQuery = `
      SELECT 
        id,
        module,
        location_lat,
        location_lng,
        results,
        result_image,
        timestamp,
        created_at
       FROM damage_reports 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?
    `;
    
    // 合并WHERE参数和分页参数，确保LIMIT和OFFSET是数字类型
    const allParams = [...whereParams, Number(limit), Number(offset)];
    
    console.log('数据查询:', dataQuery);
    console.log('查询参数:', allParams);
    console.log('参数数量:', allParams.length);
    console.log('SQL占位符数量:', (dataQuery.match(/\?/g) || []).length);
    
    // 验证参数数量是否匹配
    const placeholderCount = (dataQuery.match(/\?/g) || []).length;
    if (allParams.length !== placeholderCount) {
      throw new Error(`参数数量不匹配: 期望 ${placeholderCount} 个参数，实际提供 ${allParams.length} 个参数`);
    }
    
    // 验证参数类型
    console.log('参数类型检查:', allParams.map((param, index) => `${index}: ${typeof param} = ${param}`));
    
    // 验证LIMIT和OFFSET参数
    const limitParam = allParams[allParams.length - 2];
    const offsetParam = allParams[allParams.length - 1];
    
    if (typeof limitParam !== 'number' || limitParam <= 0) {
      throw new Error(`无效的LIMIT参数: ${limitParam}`);
    }
    
    if (typeof offsetParam !== 'number' || offsetParam < 0) {
      throw new Error(`无效的OFFSET参数: ${offsetParam}`);
    }
    
    const [rows] = await connection.execute(dataQuery, allParams);
    
    console.log('查询结果行数:', (rows as any[]).length);
    
    const response = {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('获取检测历史错误:', error);
    return NextResponse.json({ 
      error: '获取数据失败', 
      details: (error as Error).message 
    }, { status: 500 });
  } finally {
    // 确保连接被释放
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { module, location, results, resultImage, timestamp } = await request.json();

    console.log('POST请求数据:', { module, location, results, resultImage, timestamp });

    // 验证必需字段
    if (!location || !results || !timestamp) {
      console.log('缺少必需字段:', { location: !!location, results: !!results, timestamp: !!timestamp });
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // 验证location对象
    if (!location.lat || !location.lng) {
      return NextResponse.json({ message: 'Invalid location data' }, { status: 400 });
    }

    // 获取连接
    connection = await pool.getConnection();

    // 插入数据 - 确保数据类型匹配数据库表结构
    const insertQuery = `
      INSERT INTO damage_reports 
        (module, location_lat, location_lng, results, result_image, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    // 类型转换和验证
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ message: 'Invalid coordinates' }, { status: 400 });
    }
    
    const insertParams = [
      String(module || 'road-damage'),
      lat,
      lng,
      JSON.stringify(results),
      resultImage ? String(resultImage) : null,
      String(timestamp),
    ];
    
    console.log('插入查询:', insertQuery);
    console.log('插入参数:', insertParams);
    console.log('参数类型:', insertParams.map((param, index) => `${index}: ${typeof param} = ${param}`));
    
    await connection.execute(insertQuery, insertParams);

    console.log('数据插入成功');
    return NextResponse.json({ message: '成功保存' });
  } catch (error) {
    console.error('数据库错误:', error);
    return NextResponse.json({ 
      message: '网络错误', 
      details: (error as Error).message 
    }, { status: 500 });
  } finally {
    // 确保连接被释放
    if (connection) {
      connection.release();
    }
  }
}
