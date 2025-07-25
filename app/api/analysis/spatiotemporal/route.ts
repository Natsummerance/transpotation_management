import { NextRequest, NextResponse } from 'next/server'

// 强制动态渲染，避免静态生成错误
export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/analysis/spatiotemporal:
 *   get:
 *     summary: 获取时空分析数据
 *     description: 调用Django后端API，获取指定时间范围和图层的时空分析结果。
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *         description: 时间范围，格式如 '2013-09-12 00:00:00,2013-09-12 23:59:59'
 *       - in: query
 *         name: layer
 *         schema:
 *           type: string
 *         description: 图层类型
 *       - in: query
 *         name: current_time
 *         schema:
 *           type: string
 *         description: 当前时间点
 *     responses:
 *       200:
 *         description: 成功返回时空分析数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 result: "分析结果数据"
 *       500:
 *         description: 获取数据失败
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange')
    const layer = searchParams.get('layer')
    const currentTime = searchParams.get('current_time')
    
    console.log('API请求参数:', { timeRange, layer, currentTime })
    
    // 构建Django API URL
    const djangoUrl = new URL('http://localhost:8000/api/spatiotemporal/')
    djangoUrl.searchParams.set('start_time', '2013-09-12 00:00:00')
    djangoUrl.searchParams.set('end_time', '2013-09-12 23:59:59')
    djangoUrl.searchParams.set('layer_type', layer || 'none')
    if (currentTime) {
      djangoUrl.searchParams.set('current_time', currentTime)
    }
    
    console.log('Django API URL:', djangoUrl.toString())
    
    // 调用Django API
    const response = await fetch(djangoUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Django API响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Django API错误响应:', errorText)
      throw new Error(`Django API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('Django API返回数据:', data)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Spatiotemporal analysis API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spatiotemporal data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 