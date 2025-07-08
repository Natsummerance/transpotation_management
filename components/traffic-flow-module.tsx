"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, TrendingUp, TrendingDown, MapPin, Activity, Eye, BarChart3 } from "lucide-react"
import MapComponent from "@/components/map-component"

export default function TrafficFlowModule() {
  const [timeRange, setTimeRange] = useState("1h")
  const [selectedRoad, setSelectedRoad] = useState("all")

  const trafficData = [
    {
      id: 1,
      roadName: "中山路",
      section: "解放路-人民路段",
      currentFlow: 1247,
      avgFlow: 980,
      status: "拥堵",
      trend: "up",
      congestionLevel: 85,
      speed: 15,
    },
    {
      id: 2,
      roadName: "人民大道",
      section: "建设路-文化路段",
      currentFlow: 892,
      avgFlow: 750,
      status: "缓慢",
      trend: "up",
      congestionLevel: 65,
      speed: 25,
    },
    {
      id: 3,
      roadName: "建设路",
      section: "环城路-中山路段",
      currentFlow: 456,
      avgFlow: 520,
      status: "畅通",
      trend: "down",
      congestionLevel: 30,
      speed: 45,
    },
    {
      id: 4,
      roadName: "环城路",
      section: "东段",
      currentFlow: 678,
      avgFlow: 600,
      status: "缓慢",
      trend: "up",
      congestionLevel: 55,
      speed: 35,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "拥堵":
        return "destructive"
      case "缓慢":
        return "secondary"
      case "畅通":
        return "default"
      default:
        return "outline"
    }
  }

  const getCongestionColor = (level: number) => {
    if (level >= 80) return "bg-red-500"
    if (level >= 60) return "bg-orange-500"
    if (level >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">车流量监控</h2>
          <p className="text-gray-600 mt-1">基于GPS数据分析城市交通流量</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            实时监控
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <BarChart3 className="w-4 h-4 mr-2" />
            生成报告
          </Button>
        </div>
      </div>

      {/* 控制面板 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full md:w-40 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">最近1小时</SelectItem>
                <SelectItem value="6h">最近6小时</SelectItem>
                <SelectItem value="24h">最近24小时</SelectItem>
                <SelectItem value="7d">最近7天</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedRoad} onValueChange={setSelectedRoad}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部路段</SelectItem>
                <SelectItem value="中山路">中山路</SelectItem>
                <SelectItem value="人民大道">人民大道</SelectItem>
                <SelectItem value="建设路">建设路</SelectItem>
                <SelectItem value="环城路">环城路</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 px-6 border-gray-200 hover:bg-gray-50 bg-transparent">
              <Activity className="w-4 h-4 mr-2" />
              实时刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总车流量</p>
                <p className="text-3xl font-bold text-blue-600">3,273</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均速度</p>
                <p className="text-3xl font-bold text-green-600">28 km/h</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">拥堵路段</p>
                <p className="text-3xl font-bold text-red-600">2</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">监控点位</p>
                <p className="text-3xl font-bold text-purple-600">24</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 车流量监控地图 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">车流量监控地图</CardTitle>
          <CardDescription>显示各监控点位置和车流量热力图</CardDescription>
        </CardHeader>
        <CardContent>
          <MapComponent
            points={trafficData.map((road) => ({
              id: road.id.toString(),
              lat: 39.9042 + (road.id - 1) * 0.01,
              lng: 116.4074 + (road.id - 1) * 0.01,
              type: "traffic" as const,
              title: road.roadName,
              description: `${road.section} - 当前车流: ${road.currentFlow}辆/小时`,
              status: road.status,
              data: road,
            }))}
            height="500px"
            showHeatmap={true}
            onPointClick={(point) => {
              console.log("选中监控点:", point)
            }}
          />
        </CardContent>
      </Card>

      {/* 路段详情 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">路段车流详情</CardTitle>
          <CardDescription>各路段实时车流量和拥堵情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trafficData.map((road) => (
              <div
                key={road.id}
                className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{road.roadName}</h4>
                    <p className="text-sm text-gray-600">{road.section}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(road.status)} className="font-medium">
                      {road.status}
                    </Badge>
                    {road.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">当前车流</p>
                    <p className="font-bold text-blue-600">{road.currentFlow} 辆/小时</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">平均车流</p>
                    <p className="font-bold text-green-600">{road.avgFlow} 辆/小时</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">平均速度</p>
                    <p className="font-bold text-orange-600">{road.speed} km/h</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">拥堵指数</p>
                    <p className="font-bold text-purple-600">{road.congestionLevel}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getCongestionColor(road.congestionLevel)}`}
                    style={{ width: `${road.congestionLevel}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
