"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, User, Clock, MapPin, Search, Eye } from "lucide-react"
import MapComponent from "@/components/map-component"

export default function ViolationModule() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  const violations = [
    {
      id: 1,
      type: "闯红灯",
      location: "中山路与解放路交叉口",
      time: "2024-01-15 14:25:30",
      plateNumber: "京A12345",
      driverFace: "/placeholder.svg?height=60&width=60",
      confidence: 95,
      status: "已确认",
      fine: 200,
    },
    {
      id: 2,
      type: "超速行驶",
      location: "人民大道128号",
      time: "2024-01-15 13:42:15",
      plateNumber: "京B67890",
      driverFace: "/placeholder.svg?height=60&width=60",
      confidence: 88,
      status: "待审核",
      fine: 150,
    },
    {
      id: 3,
      type: "违停",
      location: "建设路商业街",
      time: "2024-01-15 12:18:45",
      plateNumber: "京C11111",
      driverFace: "/placeholder.svg?height=60&width=60",
      confidence: 92,
      status: "已处理",
      fine: 100,
    },
    {
      id: 4,
      type: "不按道行驶",
      location: "环城路东段",
      time: "2024-01-15 11:55:20",
      plateNumber: "京D22222",
      driverFace: "/placeholder.svg?height=60&width=60",
      confidence: 85,
      status: "待审核",
      fine: 100,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "已确认":
        return "default"
      case "待审核":
        return "secondary"
      case "已处理":
        return "outline"
      default:
        return "outline"
    }
  }

  const getViolationColor = (type: string) => {
    switch (type) {
      case "闯红灯":
        return "destructive"
      case "超速行驶":
        return "secondary"
      case "违停":
        return "outline"
      case "不按道行驶":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">违章识别系统</h2>
        <p className="text-gray-600">基于AI和人脸识别的智能违章检测</p>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索车牌号或位置..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部违章</SelectItem>
                <SelectItem value="闯红灯">闯红灯</SelectItem>
                <SelectItem value="超速行驶">超速行驶</SelectItem>
                <SelectItem value="违停">违停</SelectItem>
                <SelectItem value="不按道行驶">不按道行驶</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Camera className="w-4 h-4 mr-2" />
              实时监控
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计面板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今日违章</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <Camera className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">待审核</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">识别准确率</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">罚款总额</p>
                <p className="text-2xl font-bold">¥12,450</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>违章监控点分布</CardTitle>
          <CardDescription>显示违章检测摄像头位置和覆盖范围</CardDescription>
        </CardHeader>
        <CardContent>
          <MapComponent
            points={[
              {
                id: "cam1",
                lat: 39.9042,
                lng: 116.4074,
                type: "camera" as const,
                title: "监控点 #001",
                description: "中山路与解放路交叉口 - 闯红灯检测",
                status: "在线",
              },
              {
                id: "cam2",
                lat: 39.9142,
                lng: 116.4174,
                type: "camera" as const,
                title: "监控点 #002",
                description: "人民大道主干道 - 超速检测",
                status: "在线",
              },
              {
                id: "cam3",
                lat: 39.8942,
                lng: 116.3974,
                type: "camera" as const,
                title: "监控点 #003",
                description: "建设路商业街 - 违停检测",
                status: "维护中",
              },
              {
                id: "cam4",
                lat: 39.9242,
                lng: 116.4274,
                type: "camera" as const,
                title: "监控点 #004",
                description: "环城路东段 - 综合检测",
                status: "在线",
              },
            ]}
            height="400px"
            onPointClick={(point) => {
              console.log("选中摄像头:", point)
            }}
          />
        </CardContent>
      </Card>

      {/* 实时监控视频 */}
      <Card>
        <CardHeader>
          <CardTitle>实时监控画面</CardTitle>
          <CardDescription>AI智能识别违章行为</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-2" />
                <p>监控点 #001</p>
                <p className="text-sm opacity-75">中山路与解放路交叉口</p>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-2" />
                <p>监控点 #002</p>
                <p className="text-sm opacity-75">人民大道主干道</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 违章记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>违章记录</CardTitle>
          <CardDescription>AI识别的违章行为记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {violations.map((violation) => (
              <div key={violation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={violation.driverFace || "/placeholder.svg"}
                      alt="驾驶员"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={getViolationColor(violation.type)}>{violation.type}</Badge>
                      <Badge variant={getStatusColor(violation.status)}>{violation.status}</Badge>
                      <span className="text-sm text-gray-500">识别度: {violation.confidence}%</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1 text-gray-400" />
                        车牌: {violation.plateNumber}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                        {violation.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        {violation.time}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">罚款金额: </span>
                      <span className="font-semibold text-red-600">¥{violation.fine}</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button size="sm" variant="outline">
                      查看详情
                    </Button>
                    <Button size="sm">处理</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
