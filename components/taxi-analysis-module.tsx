"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, TrendingUp, MapPin, Download, Eye, BarChart3, Users, Loader2 } from "lucide-react"

// 声明高德地图全局变量
declare global {
  interface Window {
    AMap: any
  }
}

export default function TaxiAnalysisModule() {
  const [selectedMetric, setSelectedMetric] = useState("orders")
  const [timeRange, setTimeRange] = useState("today")
  const [isLoading, setIsLoading] = useState(true)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [heatmapInstance, setHeatmapInstance] = useState<any>(null)
  const [taxiData, setTaxiData] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const trajectoryMapRef = useRef<HTMLDivElement>(null)

  // 加载高德地图和出租车数据
  useEffect(() => {
    const loadMapAndData = async () => {
      try {
        // 加载高德地图API
        if (!window.AMap) {
          const script = document.createElement("script")
          script.src = `https://webapi.amap.com/maps?v=2.0&key=72ea028abc28fc7412f92d884311e74a&plugin=AMap.HeatMap,AMap.MarkerCluster,AMap.Polyline`
          script.async = true
          document.head.appendChild(script)

          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })
        }

        // 初始化热力图地图
        if (mapRef.current && window.AMap) {
          const heatMap = new window.AMap.Map(mapRef.current, {
            zoom: 11,
            center: [117.0009, 36.6758], // 济南市中心
            mapStyle: "amap://styles/normal",
          })
          setMapInstance(heatMap)
        }

        // 初始化轨迹图地图
        if (trajectoryMapRef.current && window.AMap) {
          const trajectoryMap = new window.AMap.Map(trajectoryMapRef.current, {
            zoom: 11,
            center: [117.0009, 36.6758],
            mapStyle: "amap://styles/normal",
          })
        }

        // 获取出租车数据
        await fetchTaxiData()
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load map:", error)
        setIsLoading(false)
      }
    }

    loadMapAndData()
  }, [])

  // 获取出租车分析数据
  const fetchTaxiData = async () => {
    try {
      const response = await fetch(`/api/analysis/taxi?metric=${selectedMetric}&timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setTaxiData(data)
        updateHeatmap(data)
      }
    } catch (error) {
      console.error("Failed to fetch taxi data:", error)
      // 使用模拟数据
      const mockData = {
        totalOrders: 12456,
        activeVehicles: 2847,
        avgDistance: 8.5,
        totalRevenue: 892000,
        heatmapData: generateMockHeatmapData(),
        trajectoryData: generateMockTrajectoryData(),
        hotspots: [
          { rank: 1, name: "济南火车站", orders: 2345, growth: "+15.3%" },
          { rank: 2, name: "泉城广场", orders: 1876, growth: "+8.7%" },
          { rank: 3, name: "济南机场", orders: 1234, growth: "+12.1%" },
          { rank: 4, name: "山东大学", orders: 987, growth: "+5.4%" },
          { rank: 5, name: "趵突泉", orders: 756, growth: "+3.2%" },
          { rank: 6, name: "大明湖", orders: 654, growth: "+7.8%" },
        ],
        hourlyData: Array.from({ length: 24 }, (_, i) => {
          let base = 20 + Math.random() * 30
          if (i >= 7 && i <= 9) base += 30 // 早高峰
          if (i >= 17 && i <= 19) base += 40 // 晚高峰
          if (i >= 0 && i <= 5) base = 10 + Math.random() * 10 // 深夜
          return base
        }),
      }
      setTaxiData(mockData)
      updateHeatmap(mockData)
    }
  }

  // 生成模拟热力图数据
  const generateMockHeatmapData = () => {
    const points = []
    const centerLng = 117.0009
    const centerLat = 36.6758

    for (let i = 0; i < 100; i++) {
      points.push({
        lng: centerLng + (Math.random() - 0.5) * 0.1,
        lat: centerLat + (Math.random() - 0.5) * 0.1,
        count: Math.floor(Math.random() * 100) + 10,
      })
    }
    return points
  }

  // 生成模拟轨迹数据
  const generateMockTrajectoryData = () => {
    const trajectories = []
    const centerLng = 117.0009
    const centerLat = 36.6758

    for (let i = 0; i < 20; i++) {
      const points = []
      let currentLng = centerLng + (Math.random() - 0.5) * 0.08
      let currentLat = centerLat + (Math.random() - 0.5) * 0.08

      for (let j = 0; j < 10; j++) {
        points.push({
          longitude: currentLng,
          latitude: currentLat,
        })
        currentLng += (Math.random() - 0.5) * 0.01
        currentLat += (Math.random() - 0.5) * 0.01
      }

      trajectories.push({
        id: i,
        points,
        color: ["#3b82f6", "#10b981", "#f59e0b"][i % 3],
      })
    }
    return trajectories
  }

  // 更新热力图
  const updateHeatmap = (data: any) => {
    if (!mapInstance || !data?.heatmapData) return

    // 清除现有热力图
    if (heatmapInstance) {
      mapInstance.remove(heatmapInstance)
    }

    // 创建新的热力图
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
      data: data.heatmapData,
      max: 100,
    })

    setHeatmapInstance(heatmap)
  }

  // 重新获取数据
  useEffect(() => {
    if (mapInstance) {
      fetchTaxiData()
    }
  }, [selectedMetric, timeRange, mapInstance])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">出租车数据分析</h2>
          <p className="text-gray-600 mt-1">出租车运营数据分析与可视化展示</p>
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

      {/* 控制面板 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">订单分析</SelectItem>
                <SelectItem value="distance">距离分析</SelectItem>
                <SelectItem value="revenue">收入分析</SelectItem>
                <SelectItem value="efficiency">效率分析</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="year">本年</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 bg-transparent">
              <BarChart3 className="w-4 h-4 mr-2" />
              切换图表类型
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总订单数</p>
                <p className="text-3xl font-bold text-blue-600">
                  {taxiData?.totalOrders?.toLocaleString() || "12,456"}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+15.3%</span>
                </div>
              </div>
              <Car className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃车辆</p>
                <p className="text-3xl font-bold text-green-600">
                  {taxiData?.activeVehicles?.toLocaleString() || "2,847"}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+8.7%</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均距离</p>
                <p className="text-3xl font-bold text-orange-600">{taxiData?.avgDistance || "8.5"}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-red-600 rotate-180" />
                  <span className="text-sm text-red-600">-2.1%</span>
                </div>
              </div>
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总收入</p>
                <p className="text-3xl font-bold text-purple-600">
                  ¥{((taxiData?.totalRevenue || 892000) / 10000).toFixed(1)}万
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+12.4%</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 高德地图热力图与轨迹分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">出租车热力图</CardTitle>
            <CardDescription>基于订单密度的热力分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
                    <p className="text-xs text-gray-600">加载地图中...</p>
                    <p className="text-xs text-gray-400">API: 72ea028abc28fc7412f92d884311e74a</p>
                  </div>
                </div>
              )}
              <div ref={mapRef} className="w-full h-80 rounded-xl border" />
              <div className="absolute bottom-2 left-2 text-xs text-gray-400">© 高德地图</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">客流轨迹分析</CardTitle>
            <CardDescription>主要出行路线与流向</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div ref={trajectoryMapRef} className="w-full h-80 rounded-xl border" />
              <div className="absolute bottom-2 left-2 text-xs text-gray-400">© 高德地图</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据分析图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">订单距离分布</CardTitle>
            <CardDescription>不同距离区间的订单占比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {/* 模拟饼图 */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#e5e7eb" strokeWidth="16" />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="16"
                    strokeDasharray="125.6 376.8"
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray="100.5 401.9"
                    strokeDashoffset="-125.6"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="16"
                    strokeDasharray="75.4 427"
                    strokeDashoffset="-226.1"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="16"
                    strokeDasharray="50.2 452.2"
                    strokeDashoffset="-301.5"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{taxiData?.totalOrders?.toLocaleString() || "12,456"}</p>
                    <p className="text-sm text-gray-600">总订单</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">0-5km (25%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">5-10km (20%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">10-20km (15%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">20km+ (10%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">时段客流变化</CardTitle>
            <CardDescription>24小时订单量变化趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-t from-blue-50 to-white rounded-lg flex items-end justify-center p-4">
              {/* 模拟折线图 */}
              <div className="flex items-end space-x-1 h-full w-full">
                {(
                  taxiData?.hourlyData ||
                  Array.from({ length: 24 }, (_, i) => {
                    let height = 20 + Math.random() * 30
                    if (i >= 7 && i <= 9) height += 30
                    if (i >= 17 && i <= 19) height += 40
                    if (i >= 0 && i <= 5) height = 10 + Math.random() * 10
                    return height
                  })
                ).map((height: number, i: number) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    {i % 4 === 0 && <span className="text-xs text-gray-500 mt-1">{i}:00</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-600">
              <span>早高峰: 7:00-9:00</span>
              <span>晚高峰: 17:00-19:00</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 热门上客点排行 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">热门上客点排行</CardTitle>
          <CardDescription>基于订单数量的热门地点统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(
              taxiData?.hotspots || [
                { rank: 1, name: "济南火车站", orders: 2345, growth: "+15.3%" },
                { rank: 2, name: "泉城广场", orders: 1876, growth: "+8.7%" },
                { rank: 3, name: "济南机场", orders: 1234, growth: "+12.1%" },
                { rank: 4, name: "山东大学", orders: 987, growth: "+5.4%" },
                { rank: 5, name: "趵突泉", orders: 756, growth: "+3.2%" },
                { rank: 6, name: "大明湖", orders: 654, growth: "+7.8%" },
              ]
            ).map((spot: any) => (
              <Card key={spot.rank} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={spot.rank <= 3 ? "destructive" : "outline"}>#{spot.rank}</Badge>
                    <span className="text-sm text-green-600 font-medium">{spot.growth}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{spot.name}</h4>
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{spot.orders} 订单</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
