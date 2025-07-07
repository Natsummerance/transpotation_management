"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, TrendingUp, TrendingDown, MapPin, Activity } from "lucide-react"

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">车流量路段识别</h2>
        <p className="text-gray-600">基于GPS数据分析城市交通流量</p>
      </div>

      {/* 控制面板 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
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
            <Select value={selectedRoad} onValueChange={setSelectedRoad}>
              <SelectTrigger className="w-40">
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
            <Button variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              实时刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总车流量</p>
                <p className="text-2xl font-bold">3,273</p>
              </div>
              <Car className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均速度</p>
                <p className="text-2xl font-bold">28 km/h</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">拥堵路段</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">监控点位</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 流量图表 */}
      <Card>
        <CardHeader>
          <CardTitle>车流量趋势图</CardTitle>
          <CardDescription>显示选定时间范围内的车流量变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">车流量趋势图</p>
              <p className="text-sm text-gray-500">显示实时和历史车流量数据</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 路段详情 */}
      <Card>
        <CardHeader>
          <CardTitle>路段车流详情</CardTitle>
          <CardDescription>各路段实时车流量和拥堵情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trafficData.map((road) => (
              <div key={road.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-lg">{road.roadName}</h4>
                    <p className="text-sm text-gray-600">{road.section}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(road.status)}>{road.status}</Badge>
                    {road.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">当前车流</p>
                    <p className="font-semibold">{road.currentFlow} 辆/小时</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">平均车流</p>
                    <p className="font-semibold">{road.avgFlow} 辆/小时</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">平均速度</p>
                    <p className="font-semibold">{road.speed} km/h</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">拥堵指数</p>
                    <p className="font-semibold">{road.congestionLevel}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getCongestionColor(road.congestionLevel)}`}
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
