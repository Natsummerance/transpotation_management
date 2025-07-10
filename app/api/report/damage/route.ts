import type { NextApiRequest, NextApiResponse } from 'next'
import mysql from 'mysql2/promise'

// 数据库连接配置
const dbConfig = {
  host: '111.161.121.11',
  port: 47420,
  user: 'root',
  password: '239108',
  database: 'tm',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { module, location, results, resultImage, timestamp } = req.body

  if (!location || !results || !timestamp) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    const connection = await mysql.createConnection(dbConfig)

    // 插入数据
    await connection.execute(
      `INSERT INTO damage_reports 
        (module, location_lat, location_lng, results, result_image, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        module,
        location.lat,
        location.lng,
        JSON.stringify(results),
        resultImage,
        timestamp,
      ]
    )

    await connection.end()
    return res.status(200).json({ message: '成功保存' })
  } catch (error) {
    console.error('数据库错误:', error)
    return res.status(500).json({ message: '网络错误' })
  }
}
