import { NextRequest, NextResponse } from 'next/server';
import { pool, checkPoolHealth } from '@/lib/database';

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic'

// 高德地图逆地理编码API
async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const key = 'c6115796bfbad53bd639041995b5b123'; // 高德地图API密钥
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${key}&location=${lng},${lat}&output=json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.regeocode) {
      const formattedAddress = data.regeocode.formatted_address;
      if (formattedAddress) return formattedAddress;
      const addressComponent = data.regeocode.addressComponent;
      // 构建详细地址
      let address = '';
      if (addressComponent.province && addressComponent.province !== addressComponent.city) {
        address += addressComponent.province;
      }
      if (addressComponent.city) {
        address += addressComponent.city;
      }
      if (addressComponent.district) {
        address += addressComponent.district;
      }
      if (addressComponent.township) {
        address += addressComponent.township;
      }
      if (addressComponent.street) {
        address += addressComponent.street;
      }
      if (addressComponent.streetNumber) {
        address += addressComponent.streetNumber;
      }
      return address;
    }
    
    return '未知位置';
  } catch (error) {
    console.error('坐标转地址失败:', error);
    return '未知位置';
  }
}

// 格式化时间戳为MySQL兼容格式
function formatTimestampForMySQL(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      // 格式化为 YYYY-MM-DD HH:mm:ss
      return date.toISOString().slice(0, 19).replace('T', ' ');
    }
  } catch (error) {
    console.warn('时间戳格式化失败:', error);
  }
  
  // 如果解析失败，尝试手动处理
  return String(timestamp)
    .replace('T', ' ')
    .replace('Z', '')
    .replace(/\.\d{3}$/, ''); // 移除毫秒
}

// GET接口 - 查询检测历史
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const { searchParams } = new URL(request.url);
    
    // 获取查询参数
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';
    
    console.log('API请求参数:', { page, limit, type, search });
    
    const offset = (page - 1) * limit;
    
    // 获取连接
    connection = await pool.getConnection();
    
    // 构建查询条件
    let whereClause = '';
    const whereParams: any[] = [];
    
    // 基于检测结果进行筛选
    let dbType = '';
    if (type && type !== 'all') {
      const validTypes = ['D0纵向裂缝', 'D1横向裂缝', 'D20龟裂', 'D40坑洼'];
      const typeMap: Record<string, string> = {
        'D0纵向裂缝': 'D0纵向裂缝',
        'D1横向裂缝': 'D1横向裂缝',
        'D20龟裂': 'D20龟裂',
        'D40坑洼': 'D40坑洼',
      };
      const cleanType = (type + '').replace(/\s/g, '').trim();
      dbType = Object.keys(typeMap).find(t => t.replace(/\s/g, '') === cleanType) || '';
      if (dbType && validTypes.includes(dbType)) {
        whereClause = `WHERE JSON_EXTRACT(results, '$.${dbType}.count') > 0`;
      } else {
        // 非法type，忽略type筛选
        dbType = '';
      }
    }
    
    if (search) {
      // 在检测结果中搜索关键词
      if (whereClause) {
        whereClause += ' AND results LIKE ?';
      } else {
        whereClause = 'WHERE results LIKE ?';
      }
      whereParams.push(`%${String(search)}%`);
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM damage_reports ${whereClause}`;
    console.log('计数查询:', countQuery);
    console.log('计数参数:', whereParams);
    
    let total = 0;
    try {
      const [countResult] = await connection.execute(countQuery, whereParams);
      total = Number((countResult as any)[0].total);
      console.log('总记录数:', total);
    } catch (countError) {
      console.error('计数查询失败:', countError);
      // 如果计数查询失败，尝试检查表是否存在
      try {
        const [tableCheck] = await connection.execute('SHOW TABLES LIKE "damage_reports"');
        if ((tableCheck as any[]).length === 0) {
          throw new Error('damage_reports表不存在');
        }
      } catch (tableError) {
        throw new Error(`数据库表检查失败: ${tableError}`);
      }
      throw countError;
    }
    
    // 获取数据记录 - 根据实际表结构调整字段
    const dataQuery = `
      SELECT 
        id,
        module,
        location_lat,
        location_lng,
        results,
        result_image,
        timestamp
       FROM damage_reports 
       ${whereClause}
       ORDER BY id DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;
    
    // 只传递whereParams，不再传递limit/offset
    const allParams = [...whereParams];
    
    console.log('数据查询:', dataQuery);
    console.log('查询参数:', allParams);
    console.log('参数数量:', allParams.length);
    console.log('SQL占位符数量:', (dataQuery.match(/\?/g) || []).length);
    console.log('WHERE条件:', whereClause);
    console.log('WHERE参数:', whereParams);
    console.log('分页参数:', { limit, offset });
    console.log('参数类型检查:', allParams.map((param, index) => `${index}: ${typeof param} = ${param}`));
    
    // 验证参数数量是否匹配
    const placeholderCount = (dataQuery.match(/\?/g) || []).length;
    if (allParams.length !== placeholderCount) {
      throw new Error(`参数数量不匹配: 期望 ${placeholderCount} 个参数，实际提供 ${allParams.length} 个参数`);
    }
    
    const [rows] = await connection.execute(dataQuery, allParams);
    
    console.log('查询结果行数:', (rows as any[]).length);
    
    // 为每条记录添加详细信息和地址
    const enrichedRows = await Promise.all(
      (rows as any[]).map(async (row) => {
        // 确保坐标是数字类型
        const lat = Number(row.location_lat);
        const lng = Number(row.location_lng);
        
        // 解析results JSON
        let parsedResults: any = null;
        let mainDamageType = '未知';
        let totalCount = 0;
        let avgConfidence = 0;
        let severity = '轻微';
        
        try {
          if (row.results) {
            parsedResults = typeof row.results === 'string' ? JSON.parse(row.results) : row.results;
            
            // 计算主要类型、总数量和平均置信度
            const damageTypes = ['D0纵向裂缝', 'D1横向裂缝', 'D20龟裂', 'D40坑洼'];
            let maxCount = 0;
            let totalConfidence = 0;
            let confidenceCount = 0;
            
            damageTypes.forEach(type => {
              if (parsedResults[type] && parsedResults[type].count > 0) {
                totalCount += parsedResults[type].count;
                if (parsedResults[type].confidence > 0) {
                  totalConfidence += parsedResults[type].confidence;
                  confidenceCount++;
                }
                if (parsedResults[type].count > maxCount) {
                  maxCount = parsedResults[type].count;
                  mainDamageType = type;
                }
              }
            });
            
            avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
            
            // 根据实际数据计算严重程度
            if (totalCount >= 5 || avgConfidence >= 0.8) {
              severity = '严重';
            } else if (totalCount >= 3 || avgConfidence >= 0.6) {
              severity = '中等';
            } else {
              severity = '轻微';
            }
          }
        } catch (error) {
          console.error('解析results失败:', error);
        }
        
        // 获取地址信息（不依赖数据库字段，直接通过坐标获取）
        const address = await getAddressFromCoordinates(lat, lng);
        
        // 使用数据库中的实际图片路径和时间
        const resultImage = row.result_image || `/api/static/RDD_yolo11/runs/detect/predict/result_${row.id}.jpg`;
        
        // 格式化时间戳
        const formattedTimestamp = row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString();
        
        return {
          id: row.id,
          module: row.module || 'road-damage',
          location_lat: lat,
          location_lng: lng,
          results: parsedResults,
          result_image: resultImage,
          timestamp: formattedTimestamp,
          address, // 直接返回通过坐标获取的地址
          coordinates: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          // 新增字段用于前端显示
          mainDamageType,
          totalCount,
          avgConfidence: Number(avgConfidence.toFixed(2)),
          severity
        };
      })
    );
    
    const response = {
      data: enrichedRows,
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
    return NextResponse.json({ error: '获取检测历史失败' }, { status: 500 });
  } finally {
    // 确保连接被释放
    if (connection) {
      connection.release();
    }
  }
}

// POST接口 - 保存检测结果
export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const { module, location, results, resultImage, timestamp } = await request.json();
    
    console.log('POST请求数据:', { module, location, results, resultImage, timestamp });

    // 验证必需字段
    if (!location || !results || !timestamp) {
      console.log('缺少必需字段:', { location: !!location, results: !!results, timestamp: !!timestamp });
      return NextResponse.json({ 
        error: '缺少必需字段',
        details: 'location、results、timestamp 都是必需的'
      }, { status: 400 });
    }

    // 验证location对象
    if (!location.lat || !location.lng) {
      return NextResponse.json({ 
        error: '位置数据无效',
        details: 'location对象必须包含lat和lng字段'
      }, { status: 400 });
    }

    // 检查连接池健康状态
    const isHealthy = await checkPoolHealth();
    if (!isHealthy) {
      throw new Error('数据库连接池不健康，请稍后重试');
    }
    
    // 获取数据库连接
    connection = await pool.getConnection();

    // 验证坐标数据
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ 
        error: '坐标数据无效',
        details: 'latitude和longitude必须是有效的数字'
      }, { status: 400 });
    }
    
    // 格式化时间戳
    const formattedTimestamp = formatTimestampForMySQL(timestamp);
    console.log('时间戳格式化:', { original: timestamp, formatted: formattedTimestamp });
    
    // 插入数据
    const insertQuery = `
      INSERT INTO damage_reports 
        (location_lat, location_lng, results, result_image, timestamp)
       VALUES (?, ?, ?, ?, ?)
    `;
    
    const insertParams = [
      lat,
      lng,
      JSON.stringify(results),
      resultImage ? String(resultImage) : null,
      formattedTimestamp,
    ];
    
    console.log('插入查询:', insertQuery);
    console.log('插入参数:', insertParams);
    
    const [insertResult] = await connection.execute(insertQuery, insertParams);
    const insertId = (insertResult as any).insertId;
    
    console.log('数据插入成功，ID:', insertId);
    
    return NextResponse.json({ 
      message: '检测结果保存成功',
      id: insertId,
      timestamp: formattedTimestamp
    });
    
  } catch (error) {
    console.error('保存检测结果错误:', error);
    
    let errorMessage = '保存数据失败';
    let errorDetails = (error as Error).message;
    
    if (errorDetails.includes('Incorrect arguments to mysqld_stmt_execute')) {
      errorMessage = '数据库插入参数错误';
      errorDetails = 'SQL预处理语句参数类型或数量不匹配';
    } else if (errorDetails.includes('ER_NO_SUCH_TABLE')) {
      errorMessage = '数据库表不存在';
      errorDetails = 'damage_reports表不存在';
    } else if (errorDetails.includes('ER_ACCESS_DENIED_ERROR')) {
      errorMessage = '数据库访问权限错误';
      errorDetails = '数据库连接权限不足';
    } else if (errorDetails.includes('ECONNREFUSED')) {
      errorMessage = '数据库连接失败';
      errorDetails = '无法连接到数据库服务器';
    } else if (errorDetails.includes('ER_DATA_TOO_LONG')) {
      errorMessage = '数据长度超出限制';
      errorDetails = '插入的数据长度超过数据库字段限制';
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      details: errorDetails,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
