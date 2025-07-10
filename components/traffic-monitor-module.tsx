"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Camera, AlertTriangle, Clock, MapPin, Play, Eye, Download } from "lucide-react"

export default function TrafficMonitorModule() {
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const violations = [
    {
      id: 1,
      type: "闯红灯",
      location: "中山路与解放路交叉口",
      time: "2024-01-15 14:30:25",
      camera: "CAM-001",
      status: "已确认",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 2,
      type: "逆行",
      location: "人民大道主干道",
      time: "2024-01-15 14:28:15",
      camera: "CAM-002",
      status: "待审核",
      image: "/placeholder.svg?height=80&width=80",
    },
    {
      id: 3,
      type: "占道",
      location: "建设路商业街",
      time: "2024-01-15 14:25:10",
      camera: "CAM-003",
      status: "已处理",
      image: "/placeholder.svg?height=80&width=80",
    },
  ]

  const simulateViolation = () => {
    const violationTypes = ["闯红灯", "逆行", "占道", "行人横穿"]
    const randomType = violationTypes[Math.floor(Math.random() * violationTypes.length)]

    setAlertData({
      type: randomType,
      location: "中山路与解放路交叉口",
      time: currentTime.toLocaleString(),
      camera: "CAM-001",
      image: "/placeholder.svg?height=200&width=300",
    })
    setShowAlert(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">实时交通监控</h2>
          <p className="text-gray-600 mt-1">AI智能检测交通违章行为，实时告警处理</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            全屏监控
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            导出记录
          </Button>
        </div>
      </div>

      {/* 实时监控画面 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">监控点 CAM-001</CardTitle>
              <Badge variant="default" className="bg-green-600">
                在线
              </Badge>
            </div>
            <CardDescription>中山路与解放路交叉口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
              <img src="/placeholder.svg?height=200&width=300" alt="监控画面" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                LIVE
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
            <Button className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white" onClick={simulateViolation}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              模拟违章检测
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">监控点 CAM-002</CardTitle>
              <Badge variant="default" className="bg-green-600">
                在线
              </Badge>
            </div>
            <CardDescription>人民大道主干道</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
              <img src="/placeholder.svg?height=200&width=300" alt="监控画面" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                LIVE
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button size="sm" variant="outline" className="bg-transparent">
                <Play className="w-3 h-3 mr-1" />
                回放
              </Button>
              <Button size="sm" variant="outline" className="bg-transparent">
                <Camera className="w-3 h-3 mr-1" />
                截图
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">监控点 CAM-003</CardTitle>
              <Badge variant="secondary">维护中</Badge>
            </div>
            <CardDescription>建设路商业街</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">摄像头维护中</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-3 bg-transparent" disabled>
              设备离线
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 统计面板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">今日违章</p>
                <p className="text-3xl font-bold text-red-600">89</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">在线摄像头</p>
                <p className="text-3xl font-bold text-blue-600">24</p>
              </div>
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">检测准确率</p>
                <p className="text-3xl font-bold text-green-600">94%</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待处理</p>
                <p className="text-3xl font-bold text-orange-600">12</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 违章记录表格 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">违章记录</CardTitle>
          <CardDescription>AI检测到的交通违章行为记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>违章类型</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>摄像头</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>截图</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell className="font-mono text-sm">{violation.time}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{violation.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {violation.location}
                    </div>
                  </TableCell>
                  <TableCell>{violation.camera}</TableCell>
                  <TableCell>
                    <Badge variant={violation.status === "已确认" ? "default" : "secondary"}>{violation.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <img
                      src={violation.image || "/placeholder.svg"}
                      alt="违章截图"
                      className="w-12 h-8 rounded object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="bg-transparent">
                        <Play className="w-3 h-3 mr-1" />
                        回放
                      </Button>
                      <Button size="sm" variant="outline" className="bg-transparent">
                        详情
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 违章告警弹窗 */}
      {showAlert && alertData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-600">违章行为检测</CardTitle>
              <CardDescription>AI检测到{alertData.type}行为</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img src={alertData.image || "/placeholder.svg"} alt="违章截图" className="w-full h-48 object-cover" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{alertData.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{alertData.time}</span>
                </div>
                <div className="flex items-center">
                  <Camera className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{alertData.camera}</span>
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{alertData.type}</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowAlert(false)}>
                  忽略
                </Button>
                <Button className="flex-1 bg-red-600 text-white" onClick={() => setShowAlert(false)}>
                  确认处理
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
