"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, MapPin, Clock, Search, Filter, Plus, Eye, CheckCircle, XCircle } from "lucide-react"
import MapComponent from "@/components/map-component"

export default function RoadHazardModule() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const hazards = [
    {
      id: 1,
      type: "路面坑洞",
      location: "中山路与解放路交叉口",
      severity: "高",
      status: "待处理",
      reportTime: "2024-01-15 14:30",
      coordinates: { lat: 39.9042, lng: 116.4074 },
      reporter: "市民举报",
      description: "路面出现大型坑洞，影响车辆通行",
    },
    {
      id: 2,
      type: "路面积水",
      location: "人民大道128号附近",
      severity: "中",
      status: "处理中",
      reportTime: "2024-01-15 13:45",
      coordinates: { lat: 39.9142, lng: 116.4174 },
      reporter: "巡检发现",
      description: "雨后积水严重，需要排水处理",
    },
    {
      id: 3,
      type: "道路施工",
      location: "建设路与文化路交叉口",
      severity: "中",
      status: "已完成",
      reportTime: "2024-01-15 12:20",
      coordinates: { lat: 39.8942, lng: 116.3974 },
      reporter: "施工单位",
      description: "道路维修施工已完成",
    },
    {
      id: 4,
      type: "交通标志损坏",
      location: "环城路东段",
      severity: "低",
      status: "待处理",
      reportTime: "2024-01-15 11:15",
      coordinates: { lat: 39.9242, lng: 116.4274 },
      reporter: "AI检测",
      description: "交通标志牌倾斜，需要修复",
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "高":
        return "from-red-500 to-pink-500"
      case "中":
        return "from-orange-500 to-yellow-500"
      case "低":
        return "from-blue-500 to-cyan-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "待处理":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "处理中":
        return <Clock className="w-4 h-4 text-orange-500" />
      case "已完成":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">道路危害识别</h2>
          <p className="text-gray-600 mt-1">实时监控和识别道路安全隐患</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            实时监控
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            新增报告
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索位置或危害类型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-blue-500"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="待处理">待处理</SelectItem>
                <SelectItem value="处理中">处理中</SelectItem>
                <SelectItem value="已完成">已完成</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 px-6 border-gray-200 hover:bg-gray-50 bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              高级筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">高危险</p>
                <p className="text-2xl font-bold text-red-600">5</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">中危险</p>
                <p className="text-2xl font-bold text-orange-600">12</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">低危险</p>
                <p className="text-2xl font-bold text-blue-600">6</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已处理</p>
                <p className="text-2xl font-bold text-green-600">18</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 地图区域 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">危害分布地图</CardTitle>
          <CardDescription>实时显示道路危害位置分布</CardDescription>
        </CardHeader>
        <CardContent>
          <MapComponent
            points={hazards.map((hazard) => ({
              id: hazard.id.toString(),
              lat: hazard.coordinates.lat,
              lng: hazard.coordinates.lng,
              type: "hazard" as const,
              title: hazard.type,
              description: hazard.location,
              status: hazard.status,
              severity: hazard.severity,
              data: hazard,
            }))}
            height="500px"
            onPointClick={(point) => {
              console.log("选中危害点:", point)
            }}
          />
        </CardContent>
      </Card>

      {/* 危害列表 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">危害报警列表</CardTitle>
          <CardDescription>按时间排序的道路危害记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hazards.map((hazard) => (
              <div
                key={hazard.id}
                className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${getSeverityColor(hazard.severity)} rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-lg text-gray-900">{hazard.type}</h4>
                        <Badge variant="outline" className="text-xs">
                          {hazard.severity}危险
                        </Badge>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(hazard.status)}
                          <span className="text-sm font-medium">{hazard.status}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{hazard.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {hazard.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {hazard.reportTime}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {hazard.reporter}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                    >
                      查看详情
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      立即处理
                    </Button>
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
