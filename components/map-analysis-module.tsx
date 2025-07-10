"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Eye, Layers, Filter, Calendar, Loader2 } from "lucide-react"

// 声明高德地图全局变量
declare global {
  interface Window {
    AMap: any
  }
}

export default function MapAnalysisModule() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("today")
  const [selectedLayer, setSelectedLayer] = useState("heatmap")
  const [isLoading, setIsLoading] = useState(true)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // 加载高德地图和数据
  useEffect(() => {
    const loadMapAndData = async () => {
      try {
        // 加载高德地图API
        if (!window.AMap) {
          const script = document.createElement("script")
          script.src = `https://webapi.amap.com/maps?v=2.0&key=4c0958011b7f86aca896a60d37f1d7c5&plugin=AMap.HeatMap,AMap.MarkerCluster`
          script.async = true
          document.head.appendChild(script)

          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })
        }

        // 初始化地图
        if (mapRef.current && window.AMap) {
          const map = new window.AMap.Map(mapRef.current, {
            zoom: 11,
            center: [117.0009, 36.6758], // 济南市中心
            mapStyle: "amap://styles/normal",
          })

          setMapInstance(map)
        }

        // 获取分析数据
        await fetchAnalysisData()
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load map:", error)
        setIsLoading(false)
      }
    }

    loadMapAndData()
  }, [])

  // 获取时空分析数据
  const fetchAnalysisData = async () => {
    try {
      const response = await fetch(`/api/analysis/spatiotemporal?timeRange=${selectedTimeRange}&layer=${selectedLayer}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysisData(data)
        updateMapVisualization(data)
      }
    } catch (error) {
      console.error("Failed to fetch analysis data:", error)
    }
  }

  // 更新地图可视化
  const updateMapVisualization = (data: any) => {
    if (!mapInstance || !data) return

    // 清除现有图层
    mapInstance.clearMap()

    if (selectedLayer === "heatmap") {
      // 热力图
      const heatmapData =
        data.heatmapPoints?.map((point: any) => ({
          lng: point.longitude,
          lat: point.latitude,
          count: point.intensity,
        })) || []

      if (heatmapData.length > 0) {
        const heatmap = new window.AMap.HeatMap(mapInstance, {
          radius: 25,
          opacity: [0, 0.8],
          gradient: {
            0.4: "blue",
            0.6: "cyan",
            0.7: "lime",
            0.8: "yellow",
            1.0: "red",
          },
        })

        heatmap.setDataSet({
          data: heatmapData,
          max: 100,
        })
      }
    } else if (selectedLayer === "trajectory") {
      // 轨迹图
      data.trajectories?.forEach((trajectory: any) => {
        const path = trajectory.points.map((point: any) => [point.longitude, point.latitude])
        const polyline = new window.AMap.Polyline({
          path,
          strokeColor: trajectory.color || "#3b82f6",
          strokeWeight: 3,
          strokeOpacity: 0.8,
        })
        mapInstance.add(polyline)
      })
    } else if (selectedLayer === "hotspots") {
      // 热门上客点
      data.hotspots?.forEach((spot: any) => {
        const marker = new window.AMap.Marker({
          position: [spot.longitude, spot.latitude],
          title: spot.name,
          icon: new window.AMap.Icon({
            image: createHotspotIcon(spot.level),
            size: new window.AMap.Size(24, 24),
          }),
        })
        mapInstance.add(marker)
      })
    }
  }

  // 创建热点图标
  const createHotspotIcon = (level: string) => {
    const canvas = document.createElement("canvas")
    canvas.width = 24
    canvas.height = 24
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.beginPath()
      ctx.arc(12, 12, 10, 0, 2 * Math.PI)
      ctx.fillStyle = level === "high" ? "#ef4444" : level === "medium" ? "#f97316" : "#10b981"
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    return canvas.toDataURL()
  }

  // 重新获取数据
  useEffect(() => {
    if (mapInstance) {
      fetchAnalysisData()
    }
  }, [selectedTimeRange, selectedLayer, mapInstance])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">地图时空分析</h2>
          <p className="text-gray-600 mt-1">基于济南地图的时空数据分析与可视化</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            全屏显示
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            导出分析报告
          </Button>
        </div>
      </div>

      {/* 控制面板 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">时间范围</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">图层类型</label>
              <Select value={selectedLayer} onValueChange={setSelectedLayer}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heatmap">热力图</SelectItem>
                  <SelectItem value="trajectory">轨迹图</SelectItem>
                  <SelectItem value="hotspots">热门上客点</SelectItem>
                  <SelectItem value="flow">客流分析</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">起始时间</label>
              <Input type="datetime-local" className="h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">结束时间</label>
              <Input type="datetime-local" className="h-12" />
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <Button variant="outline" className="bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              高级筛选
            </Button>
            <Button variant="outline" className="bg-transparent">
              <Layers className="w-4 h-4 mr-2" />
              图层管理
            </Button>
            <Button variant="outline" className="bg-transparent">
              <Calendar className="w-4 h-4 mr-2" />
              时间轴播放
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 高德地图显示区域 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">济南市交通时空分析地图</CardTitle>
          <CardDescription>
            当前显示:{" "}
            {selectedLayer === "heatmap"
              ? "出租车热力图"
              : selectedLayer === "trajectory"
                ? "乘客轨迹分析"
                : selectedLayer === "hotspots"
                  ? "热门上客点分布"
                  : "客流分析"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">加载高德地图中...</p>
                  <p className="text-xs text-gray-400 mt-1">API Key: 4c0958011b7f86aca896a60d37f1d7c5</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-96 rounded-xl border" />
            <div className="absolute bottom-2 left-2 text-xs text-gray-400">© 高德地图</div>
          </div>
        </CardContent>
      </Card>

      {/* 分析结果 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">时空分析结果</CardTitle>
            <CardDescription>基于选定时间范围的数据分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">总订单数</p>
                <p className="text-2xl font-bold text-blue-600">{analysisData?.totalOrders || "12,456"}</p>
                <p className="text-xs text-green-600">↑ 15.3%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">平均距离</p>
                <p className="text-2xl font-bold text-green-600">{analysisData?.avgDistance || "8.5"}km</p>
                <p className="text-xs text-red-600">↓ 2.1%</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">热门时段</p>
                <p className="text-2xl font-bold text-orange-600">{analysisData?.peakHour || "18:00"}</p>
                <p className="text-xs text-gray-600">晚高峰</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">活跃区域</p>
                <p className="text-2xl font-bold text-purple-600">{analysisData?.activeArea || "历下区"}</p>
                <p className="text-xs text-gray-600">商业中心</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">热门上客点排行</h4>
              <div className="space-y-2">
                {(
                  analysisData?.topPickupPoints || [
                    { rank: 1, name: "济南火车站", count: 2345 },
                    { rank: 2, name: "泉城广场", count: 1876 },
                    { rank: 3, name: "济南机场", count: 1234 },
                  ]
                ).map((spot: any) => (
                  <div key={spot.rank} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant={spot.rank <= 3 ? "destructive" : "outline"}>#{spot.rank}</Badge>
                      <span className="text-sm">{spot.name}</span>
                    </div>
                    <span className="text-sm font-medium">{spot.count}次</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">时间分布分析</CardTitle>
            <CardDescription>24小时客流量变化趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-t from-blue-50 to-white rounded-lg flex items-end justify-center p-4">
              {/* 模拟柱状图 */}
              <div className="flex items-end space-x-2 h-full">
                {Array.from({ length: 24 }, (_, i) => {
                  const height = analysisData?.hourlyData?.[i] || Math.random() * 80 + 20
                  const isHighPeak = i === 8 || i === 18 // 早晚高峰
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className={`w-3 ${isHighPeak ? "bg-red-500" : "bg-blue-500"} rounded-t`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{i}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                高峰时段: <span className="text-red-600 font-medium">8:00-9:00, 18:00-19:00</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
