"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, User, Clock, MapPin, Eye, Shield, Camera, Bell, Download } from "lucide-react"

export default function SuspectAlertModule() {
  const [showAlert, setShowAlert] = useState(false)

  const suspectRecords = [
    {
      id: 1,
      name: "张某某",
      type: "通缉犯",
      level: "A级",
      location: "中山路与解放路交叉口",
      time: "2024-01-15 14:30:25",
      confidence: 95.6,
      status: "已确认",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 2,
      name: "李某某",
      type: "失踪人员",
      level: "B级",
      location: "人民大道128号附近",
      time: "2024-01-15 13:45:10",
      confidence: 87.3,
      status: "待核实",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 3,
      name: "王某某",
      type: "重点关注",
      level: "C级",
      location: "建设路商业街",
      time: "2024-01-15 12:20:15",
      confidence: 78.9,
      status: "已处理",
      image: "/placeholder.svg?height=60&width=60",
    },
  ]

  const getLevelColor = (level: string) => {
    switch (level) {
      case "A级":
        return "destructive"
      case "B级":
        return "secondary"
      case "C级":
        return "outline"
      default:
        return "outline"
    }
  }

  const simulateSuspectAlert = () => {
    setShowAlert(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">嫌疑人识别告警</h2>
          <p className="text-gray-600 mt-1">AI人脸识别系统，实时监控重点人员</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            实时监控
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 实时监控与告警 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">实时监控画面</CardTitle>
              <CardDescription>AI人脸识别实时分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                  <img
                    src="/placeholder.svg?height=200&width=300"
                    alt="监控画面"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                    LIVE
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    主入口 - CAM-001
                  </div>
                  <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs">识别中</div>
                </div>
                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                  <img
                    src="/placeholder.svg?height=200&width=300"
                    alt="监控画面"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                    LIVE
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    侧门 - CAM-002
                  </div>
                  <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs">识别中</div>
                </div>
              </div>
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white" onClick={simulateSuspectAlert}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                模拟嫌疑人检测
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">告警统计</CardTitle>
            <CardDescription>今日识别统计</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">A级通缉犯</p>
                  <p className="text-2xl font-bold text-red-600">2</p>
                </div>
                <Shield className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">B级重点人员</p>
                  <p className="text-2xl font-bold text-orange-600">5</p>
                </div>
                <User className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">C级关注人员</p>
                  <p className="text-2xl font-bold text-blue-600">12</p>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">识别准确率</p>
                  <p className="text-2xl font-bold text-green-600">94%</p>
                </div>
                <Camera className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 识别记录表格 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">识别记录</CardTitle>
          <CardDescription>嫌疑人识别历史记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Input placeholder="搜索姓名或位置..." className="max-w-xs" />
              <Button variant="outline" className="bg-transparent">
                <Clock className="w-4 h-4 mr-2" />
                时间筛选
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>照片</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>等级</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>置信度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspectRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <img
                        src={record.image || "/placeholder.svg"}
                        alt="嫌疑人照片"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>
                      <Badge variant={getLevelColor(record.level)}>{record.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {record.location}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{record.time}</TableCell>
                    <TableCell>{record.confidence}%</TableCell>
                    <TableCell>
                      <Badge variant={record.status === "已确认" ? "default" : "secondary"}>{record.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="bg-transparent">
                          详情
                        </Button>
                        <Button size="sm" className="bg-red-600 text-white">
                          处理
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 嫌疑人告警弹窗 */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-600">高危嫌疑人检测</CardTitle>
              <CardDescription>AI识别到A级通缉犯</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg">
                <img
                  src="/placeholder.svg?height=80&width=80"
                  alt="嫌疑人照片"
                  className="w-20 h-20 rounded-full object-cover border-2 border-red-200"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-red-800">张某某</h4>
                  <p className="text-sm text-red-600">A级通缉犯</p>
                  <p className="text-xs text-gray-600 mt-1">置信度: 95.6%</p>
                </div>
                <Badge variant="destructive" className="animate-pulse">
                  A级
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  <span>中山路与解放路交叉口</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <Camera className="w-4 h-4 mr-2 text-gray-500" />
                  <span>CAM-001</span>
                </div>
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-2 text-gray-500" />
                  <span>自动告警</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowAlert(false)}>
                  稍后处理
                </Button>
                <Button className="flex-1 bg-red-600 text-white" onClick={() => setShowAlert(false)}>
                  立即处理
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
