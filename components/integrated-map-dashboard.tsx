"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MapComponent from "@/components/map-component"
import { AlertTriangle, Car, Camera, Filter, Layers, Eye } from "lucide-react"

export default function IntegratedMapDashboard() {
  const [activeLayer, setActiveLayer] = useState("all")
  const [timeFilter, setTimeFilter] = useState("24h")

  // 综合所有地图点位数据
  const allMapPoints = [
    // 道路危害点
    {
      id: "hazard1",
      lat: 39.9042,
      lng: 116.4074,
      type: "hazard" as const,
      title: "路面坑洞",
      description: "中山路与解放路交叉口",
      status: "待处理",
      severity: "高",
    },
    {
      id: "hazard2",
      lat: 39.9142,
      lng: 116.4174,
      type: "hazard" as const,
      title: "路面积水",
      description: "人民大道128号附近",
      status: "处理中",
      severity: "中",
    },
    // 车流监控点
    {
      id: "traffic1",
      lat: 39.9242,
      lng: 116.4274,
      type: "traffic" as const,
      title: "中山路监控",
      description: "解放路-人民路段 - 车流量: 1247辆/小时",
      status: "拥堵",
    },
    {
      id: "traffic2",
      lat: 39.8942,
      lng: 116.3974,
      type: "traffic" as const,
      title: "人民大道监控",
      description: "建设路-文化路段 - 车流量: 892辆/小时",
      status: "缓慢",
    },
    // 违章摄像头
    {
      id: "camera1",
      lat: 39.9342,
      lng: 116.4374,
      type: "camera" as const,
      title: "违章监控 #001",
      description: "中山路与解放路交叉口 - 闯红灯检测",
      status: "在线",
    },
    {
      id: "camera2",
      lat: 39.8842,
      lng: 116.3874,
      type: "camera" as const,
      title: "违章监控 #002",
      description: "人民大道主干道 - 超速检测",
      status: "在线",
    },
  ]

  const getFilteredPoints = () => {
    if (activeLayer === "all") return allMapPoints
    return allMapPoints.filter((point) => point.type === activeLayer)
  }

  const getLayerStats = () => {
    const hazards = allMapPoints.filter((p) => p.type === "hazard").length
    const traffic = allMapPoints.filter((p) => p.type === "traffic").length
    const cameras = allMapPoints.filter((p) => p.type === "camera").length
    return { hazards, traffic, cameras }
  }

  const stats = getLayerStats()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">综合地图监控中心</h2>
        <p className="text-gray-600">集成显示道路危害、车流量和违章监控信息</p>
      </div>

      {/* 控制面板 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <Select value={activeLayer} onValueChange={setActiveLayer}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">显示全部</SelectItem>
                  <SelectItem value="hazard">道路危害</SelectItem>
                  <SelectItem value="traffic">车流监控</SelectItem>
                  <SelectItem value="camera">违章摄像</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">最近1小时</SelectItem>
                  <SelectItem value="6h">最近6小时</SelectItem>
                  <SelectItem value="24h">最近24小时</SelectItem>
                  <SelectItem value="7d">最近7天</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                高级筛选
              </Button>
              <Button variant="outline" size="sm">
                <Layers className="w-4 h-4 mr-2" />
                图层管理
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                实时模式
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">道路危害点</p>
                <p className="text-2xl font-bold">{stats.hazards}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">车流监控点</p>
                <p className="text-2xl font-bold">{stats.traffic}</p>
              </div>
              <Car className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">违章摄像头</p>
                <p className="text-2xl font-bold">{stats.cameras}</p>
              </div>
              <Camera className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主地图 */}
      <Card>
        <CardHeader>
          <CardTitle>城市交通综合监控地图</CardTitle>
          <CardDescription>
            实时显示{" "}
            {activeLayer === "all"
              ? "所有监控信息"
              : activeLayer === "hazard"
                ? "道路危害分布"
                : activeLayer === "traffic"
                  ? "车流量监控点"
                  : "违章检测摄像头"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MapComponent
            points={getFilteredPoints()}
            height="600px"
            showHeatmap={activeLayer === "traffic" || activeLayer === "all"}
            onPointClick={(point) => {
              console.log("选中地图点:", point)
            }}
          />
        </CardContent>
      </Card>

      {/* 详细信息面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>实时警报</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">紧急道路危害</p>
                  <p className="text-xs text-gray-600">中山路发现大型坑洞</p>
                </div>
                <Badge variant="destructive">紧急</Badge>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <Car className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">交通拥堵</p>
                  <p className="text-xs text-gray-600">人民大道车流量异常</p>
                </div>
                <Badge variant="secondary">中等</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">地图服务</span>
                <Badge variant="default">正常</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">数据同步</span>
                <Badge variant="default">正常</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">监控摄像头</span>
                <Badge variant="secondary">部分离线</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">GPS数据</span>
                <Badge variant="default">正常</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
