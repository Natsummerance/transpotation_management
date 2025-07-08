"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Camera, Upload, Shield, AlertTriangle, Clock, MapPin, Eye, Download } from "lucide-react"

export default function FaceRecognitionModule() {
  const [isRecording, setIsRecording] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState(false)

  const recognitionLogs = [
    {
      id: 1,
      time: "2024-01-15 14:30:25",
      ip: "192.168.1.100",
      result: "成功",
      user: "张三",
      confidence: 95.6,
      location: "主入口",
    },
    {
      id: 2,
      time: "2024-01-15 14:28:15",
      ip: "192.168.1.101",
      result: "失败",
      user: "未知用户",
      confidence: 45.2,
      location: "侧门",
    },
    {
      id: 3,
      time: "2024-01-15 14:25:10",
      ip: "192.168.1.102",
      result: "成功",
      user: "李四",
      confidence: 88.9,
      location: "主入口",
    },
  ]

  const handleFaceCapture = () => {
    setIsRecording(true)
    setTimeout(() => {
      setIsRecording(false)
      setIsEncrypting(true)
      setTimeout(() => {
        setIsEncrypting(false)
      }, 2000)
    }, 3000)
  }

  const simulateUnauthorizedAccess = () => {
    setShowUnauthorizedAlert(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">人脸识别管理</h2>
          <p className="text-gray-600 mt-1">用户人脸录入、验证与访问控制管理</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            实时监控
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </Button>
        </div>
      </div>

      {/* 人脸录入与验证区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">人脸录入</CardTitle>
            <CardDescription>录入新用户人脸信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="w-64 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                {isRecording ? (
                  <div className="text-center">
                    <div className="relative">
                      <Camera className="w-12 h-12 mx-auto mb-3 text-blue-600 animate-pulse" />
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping"></div>
                    </div>
                    <p className="text-sm text-blue-600 font-medium">正在录入...</p>
                  </div>
                ) : isEncrypting ? (
                  <div className="text-center">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-green-600 animate-spin" />
                    <p className="text-sm text-green-600 font-medium">加密中...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600">摄像头预览</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                onClick={handleFaceCapture}
                disabled={isRecording || isEncrypting}
              >
                <Camera className="w-4 h-4 mr-2" />
                开始录入
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Upload className="w-4 h-4 mr-2" />
                上传图片
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">实时验证</CardTitle>
            <CardDescription>实时人脸识别与访问控制</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="w-64 h-48 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-3 text-green-600" />
                  <p className="text-sm text-green-600 font-medium">识别中...</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>置信度: 95.6%</p>
                    <p>用户: 张三</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                onClick={simulateUnauthorizedAccess}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                模拟未授权访问
              </Button>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">今日成功</p>
                  <p className="text-lg font-bold text-green-600">156</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">今日失败</p>
                  <p className="text-lg font-bold text-red-600">23</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">识别率</p>
                  <p className="text-lg font-bold text-blue-600">87%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 识别日志 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">识别日志</CardTitle>
          <CardDescription>人脸识别访问记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Input placeholder="搜索用户或IP..." className="max-w-xs" />
              <Button variant="outline" className="bg-transparent">
                <Clock className="w-4 h-4 mr-2" />
                时间筛选
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>识别结果</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>置信度</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recognitionLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">{log.time}</TableCell>
                    <TableCell>{log.ip}</TableCell>
                    <TableCell>
                      <Badge variant={log.result === "成功" ? "default" : "destructive"}>{log.result}</Badge>
                    </TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.confidence}%</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {log.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="bg-transparent">
                        查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 未授权访问警告弹窗 */}
      {showUnauthorizedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-600">未授权访问警告</CardTitle>
              <CardDescription>检测到未授权人员尝试访问</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <img src="/placeholder.svg?height=120&width=120" alt="抓拍图像" className="mx-auto rounded-lg" />
                <p className="text-sm text-gray-600 mt-2">抓拍时间: {new Date().toLocaleString()}</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowUnauthorizedAlert(false)}
                >
                  关闭
                </Button>
                <Button className="flex-1 bg-red-600 text-white">立即处理</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
