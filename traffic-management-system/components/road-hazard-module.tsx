"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, MapPin, Clock, Search, Filter } from "lucide-react"

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
    },
    {
      id: 2,
      type: "路面积水",
      location: "人民大道128号附近",
      severity: "中",
      status: "处理中",
      reportTime: "2024-01-15 13:45",
      coordinates: { lat: 39.9142, lng: 116.4174 },
    },
    {
      id: 3,
      type: "道路施工",
      location: "建设路与文化路交叉口",
      severity: "中",
      status: "已完成",
      reportTime: "2024-01-15 12:20",
      coordinates: { lat: 39.8942, lng: 116.3974 },
    },
    {
      id: 4,
      type: "交通标志损坏",
      location: "环城路东段",
      severity: "低",
      status: "待处理",
      reportTime: "2024-01-15 11:15",
      coordinates: { lat: 39.9242, lng: 116.4274 },
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "高":
        return "destructive"
      case "中":
        return "secondary"
      case "低":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "待处理":
        return "destructive"
      case "处理中":
        return "secondary"
      case "已完成":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">道路危害识别报警</h2>
        <p className="text-gray-600">实时监控和识别道路安全隐患</p>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索位置或危害类型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="待处理">待处理</SelectItem>
                <SelectItem value="处理中">处理中</SelectItem>
                <SelectItem value="已完成">已完成</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 地图区域 */}
      <Card>
        <CardHeader>
          <CardTitle>危害分布地图</CardTitle>
          <CardDescription>实时显示道路危害位置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">地图视图</p>
              <p className="text-sm text-gray-500">显示所有道路危害点位置</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 危害列表 */}
      <Card>
        <CardHeader>
          <CardTitle>危害报警列表</CardTitle>
          <CardDescription>按时间排序的道路危害记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hazards.map((hazard) => (
              <div key={hazard.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{hazard.type}</h4>
                        <Badge variant={getSeverityColor(hazard.severity)}>{hazard.severity}危险</Badge>
                        <Badge variant={getStatusColor(hazard.status)}>{hazard.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center mb-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {hazard.location}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {hazard.reportTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
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
