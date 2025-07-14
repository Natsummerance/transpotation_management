"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, TrendingUp, MapPin, Download, Eye, BarChart3, Users, Loader2, Calendar, Layers, Route, Target, Clock } from "lucide-react"

// 声明高德地图全局变量
declare global {
  interface Window {
    AMap: any
  }
}

// 时间范围选项
const timeRangeOptions = [
  { value: "historical", label: "历史数据 (2013-09-12)" },
  { value: "today", label: "今天" },
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
  { value: "custom", label: "自定义" },
]

// 获取时间范围的起止时间字符串
function getTimeRange(range: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  let start: Date, end: Date;
  
  if (range === "historical") {
    // 使用2013年9月12日的历史数据
    start = new Date(2013, 8, 12, 0, 0, 0); // 月份从0开始，所以9月是8
    end = new Date(2013, 8, 12, 23, 59, 59);
  } else if (range === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  } else if (range === "week") {
    const day = now.getDay() || 7;
    start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (range === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (range === "custom" && customStart && customEnd) {
    start = new Date(customStart);
    end = new Date(customEnd);
  } else {
    // 默认使用历史数据
    start = new Date(2013, 8, 12, 0, 0, 0);
    end = new Date(2013, 8, 12, 23, 59, 59);
  }
  // 格式化为 MySQL DATETIME 字符串
  const pad = (n: number) => n.toString().padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return { start: format(start), end: format(end) };
}

export default function TaxiAnalysisModule() {
  const [timeRange, setTimeRange] = useState("historical") // 默认选择历史数据
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [heatmapInstance, setHeatmapInstance] = useState<any>(null)
  const [trajectoryMapInstance, setTrajectoryMapInstance] = useState<any>(null) // 新增
  const [taxiData, setTaxiData] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [hotspotsData, setHotspotsData] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const trajectoryMapRef = useRef<HTMLDivElement>(null)
  const [vehicleIds, setVehicleIds] = useState<string[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all")
  const [trajectories, setTrajectories] = useState<any[]>([])


  const [activeView, setActiveView] = useState("heatmap") // heatmap, trajectory, hotspots

  // 新增：路程分布分析数据
  const [distanceDistribution, setDistanceDistribution] = useState<any[]>([])

  // 模拟数据
  const mockData = {
    totalOrders: 12456,
    activeVehicles: 2847,
    avgDistance: 8.5,
    totalRevenue: 892000,
    hotspots: [
      { rank: 1, name: "济南火车站", orders: 2345, growth: "+15.3%", lat: 36.6758, lng: 117.0009 },
      { rank: 2, name: "泉城广场", orders: 1876, growth: "+8.7%", lat: 36.6658, lng: 116.9909 },
      { rank: 3, name: "济南机场", orders: 1234, growth: "+12.1%", lat: 36.6858, lng: 117.0109 },
      { rank: 4, name: "山东大学", orders: 987, growth: "+5.4%", lat: 36.6558, lng: 116.9809 },
      { rank: 5, name: "趵突泉", orders: 756, growth: "+3.2%", lat: 36.6458, lng: 116.9709 },
      { rank: 6, name: "大明湖", orders: 654, growth: "+7.8%", lat: 36.6358, lng: 116.9609 },
    ],
    hourlyData: Array.from({ length: 24 }, (_, i) => {
      let base = 20 + Math.random() * 30
      if (i >= 7 && i <= 9) base += 30 // 早高峰
      if (i >= 17 && i <= 19) base += 40 // 晚高峰
      if (i >= 0 && i <= 5) base = 10 + Math.random() * 10 // 深夜
      return base
    }),
    weeklyData: [
      { day: "周一", orders: 1200, revenue: 85000 },
      { day: "周二", orders: 1350, revenue: 92000 },
      { day: "周三", orders: 1100, revenue: 78000 },
      { day: "周四", orders: 1400, revenue: 95000 },
      { day: "周五", orders: 1600, revenue: 110000 },
      { day: "周六", orders: 1800, revenue: 125000 },
      { day: "周日", orders: 1500, revenue: 105000 },
    ],
    distanceDistribution: [
      { range: "0-5km", percentage: 25, count: 3114 },
      { range: "5-10km", percentage: 20, count: 2491 },
      { range: "10-20km", percentage: 15, count: 1868 },
      { range: "20km+", percentage: 10, count: 1246 },
    ]
  }

  // 加载高德地图和出租车数据
  useEffect(() => {
    const loadMapAndData = async () => {
      try {
        console.log("🚀 开始加载高德地图...")
        
        // 加载高德地图API
        if (!window.AMap) {
          console.log("📡 加载高德地图API...")
          const script = document.createElement("script")
          script.src = `https://webapi.amap.com/maps?v=2.0&key=72ea028abc28fc7412f92d884311e74a&plugin=AMap.HeatMap,AMap.MarkerCluster,AMap.Polyline`
          script.async = true
          document.head.appendChild(script)

          await new Promise((resolve, reject) => {
            script.onload = () => {
              console.log("✅ 高德地图API加载成功")
              resolve(true)
            }
            script.onerror = reject
          })
        }

        // 初始化热力图地图
        if (mapRef.current && window.AMap) {
          console.log("🗺️ 初始化地图...")
          const heatMap = new window.AMap.Map(mapRef.current, {
            zoom: 11,
            center: [117.0009, 36.6758], // 济南市中心
            mapStyle: "amap://styles/normal",
          })
          
          console.log("✅ 地图初始化成功")
          setMapInstance(heatMap)
          setIsLoading(false)
        } else {
          console.error("❌ 地图容器或API未准备好")
        setIsLoading(false)
        }
      } catch (error) {
        console.error("❌ 地图加载失败:", error)
        setIsLoading(false)
      }
    }
    loadMapAndData()
  }, [])

  // 初始化轨迹地图
  useEffect(() => {
    const loadTrajectoryMap = async () => {
      try {
        if (!window.AMap) {
          const script = document.createElement("script")
          script.src = `https://webapi.amap.com/maps?v=2.0&key=72ea028abc28fc7412f92d884311e74a&plugin=AMap.Polyline`
          script.async = true
          document.head.appendChild(script)
          await new Promise((resolve, reject) => {
            script.onload = () => resolve(true)
            script.onerror = reject
          })
        }
        if (trajectoryMapRef.current && window.AMap) {
          const trajMap = new window.AMap.Map(trajectoryMapRef.current, {
            zoom: 11,
            center: [117.0009, 36.6758],
            mapStyle: "amap://styles/normal",
          })
          setTrajectoryMapInstance(trajMap)
        }
      } catch (error) {
        // ignore
      }
    }
    loadTrajectoryMap()
  }, [])

  // 获取出租车热力图数据（调用Django后端）
  const fetchTaxiHeatmapData = async () => {
    setIsLoading(true)
    try {
      const { start, end } = getTimeRange(timeRange, customStart, customEnd)
      const url = `http://localhost:8000/api/heatmap/?event_type=pickup&start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}&limit=1000`
      
      console.log("🔍 请求热力图数据:", {
        url,
        timeRange,
        start,
        end
      })
      
      const response = await fetch(url)
      console.log("📡 API响应状态:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("📊 接收到的数据:", {
          pointsCount: data.points?.length || 0,
          totalCount: data.total_count,
          timeRange: data.time_range
        })
        
        // 转换为高德热力图格式
        const heatmapData = (data.points || []).map((p: any) => ({
          lng: p.lng,
          lat: p.lat,
          count: p.count,
        }))
        setTaxiData({ 
          heatmapData, 
          total_count: data.total_count, 
          time_range: data.time_range,
          ...mockData // 合并模拟数据
        })
        updateHeatmap({ heatmapData })
      } else {
        const errorText = await response.text()
        console.error("❌ API请求失败:", response.status, errorText)
        setTaxiData(mockData) // 使用模拟数据
        updateHeatmap({ heatmapData: [] })
      }
    } catch (error) {
      console.error("❌ 请求异常:", error)
      setTaxiData(mockData) // 使用模拟数据
      updateHeatmap({ heatmapData: [] })
    }
    setIsLoading(false)
  }

  // 获取仪表板综合数据
  const fetchDashboardData = async () => {
    console.log("📊 开始获取仪表板数据...")
    
    const { start, end } = getTimeRange(timeRange, customStart, customEnd)
    
    try {
      const response = await fetch(`http://localhost:8000/api/dashboard/?start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("📈 仪表板数据:", data)
      
      setDashboardData(data)
      
    } catch (error) {
      console.error("❌ 获取仪表板数据失败:", error)
    }
  }

  // 获取热点分析数据
  const fetchHotspotsData = async () => {
    console.log("🔥 开始获取热点分析数据...")
    const { start, end } = getTimeRange(timeRange, customStart, customEnd)
    try {
      // 调用后端新API
      const response = await fetch(`http://localhost:8000/api/hotspots/?start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("📍 热门区域分析数据:", data)
      setHotspotsData(data)
    } catch (error) {
      console.error("❌ 获取热门区域数据失败:", error)
    }
  }

  // 获取路程分布分析数据（调用Django后端新API）
  const fetchDistanceDistribution = async () => {
    const { start, end } = getTimeRange(timeRange, customStart, customEnd)
    try {
      const response = await fetch(`http://localhost:8000/api/distance-distribution/?start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setDistanceDistribution(data)
    } catch (error) {
      console.error("❌ 获取路程分布分析数据失败:", error)
      setDistanceDistribution([])
    }
  }

  // 获取所有车辆ID
  useEffect(() => {
    fetch("http://localhost:8000/api/trajectory/vehicles/")
      .then(res => res.json())
      .then(data => setVehicleIds(data.vehicle_ids || []))
      .catch(() => setVehicleIds([]))
  }, [])

  // 获取轨迹数据
  const fetchTrajectories = async () => {
    if (!trajectoryMapInstance) return // 修改为轨迹地图实例
    setIsLoading(true)
    setTrajectories([])
    if (selectedVehicle === "all") {
      // 全部车辆（只取前10辆，防止卡死）
      const ids = vehicleIds.slice(0, 10)
      const all = await Promise.all(ids.map(async id => {
        const { start, end } = getTimeRange(timeRange, customStart, customEnd)
        const res = await fetch(`http://localhost:8000/api/trajectory/?car_plate=${id}&start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`)
        if (res.ok) {
          const data = await res.json()
          return { id, trajectory: data.trajectory }
        }
        return null
      }))
      setTrajectories(all.filter(Boolean))
      drawTrajectories(all.filter(Boolean))
    } else {
      // 单车
      if (!selectedVehicle) return; // 新增：car_plate 为空不请求
      const { start, end } = getTimeRange(timeRange, customStart, customEnd)
      const res = await fetch(`http://localhost:8000/api/trajectory/?car_plate=${selectedVehicle}&start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`)
      if (res.ok) {
        const data = await res.json()
        setTrajectories([{ id: selectedVehicle, trajectory: data.trajectory }])
        drawTrajectories([{ id: selectedVehicle, trajectory: data.trajectory }])
      }
    }
    setIsLoading(false)
  }

  // 绘制轨迹
  const drawTrajectories = (trajs: any[]) => {
    if (!trajectoryMapInstance) return // 修改为轨迹地图实例
    trajectoryMapInstance.clearMap()
    const colorList = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#a21caf", "#6366f1", "#14b8a6", "#eab308", "#f43f5e", "#0ea5e9"]
    trajs.forEach((traj, idx) => {
      if (!traj.trajectory?.length) return
      const path = traj.trajectory.map((p: any) => [p.lng, p.lat])
      const polyline = new window.AMap.Polyline({
        path,
        strokeColor: colorList[idx % colorList.length],
        strokeWeight: 3,
        strokeOpacity: 0.8,
        })
      trajectoryMapInstance.add(polyline)
    })
  }

  // 轨迹窗口切换或车辆选择变化时自动加载轨迹
  useEffect(() => {
    if (activeView === "trajectory" && trajectoryMapInstance) { // 修改为轨迹地图实例
      fetchTrajectories()
    }
    // eslint-disable-next-line
  }, [activeView, selectedVehicle, trajectoryMapInstance, timeRange, customStart, customEnd])

  // 更新热力图
  const updateHeatmap = (data: any) => {
    if (!mapInstance) {
      console.log("❌ 地图实例未准备好")
      return
    }
    
    console.log("🔄 更新热力图...")

    // 清除现有热力图
    if (heatmapInstance) {
      mapInstance.remove(heatmapInstance)
      setHeatmapInstance(null)
    }

    // 创建新的热力图
    if (data.heatmapData && data.heatmapData.length > 0) {
      console.log("🔥 创建热力图，数据点数:", data.heatmapData.length)
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
      console.log("✅ 热力图创建成功")
    } else {
      console.log("⚠️ 无热力图数据")
    }
  }

  // 地图加载后和时间范围变化时自动请求数据
  useEffect(() => {
    if (mapInstance) {
      console.log("🗺️ 地图已加载，开始获取数据...")
      fetchTaxiHeatmapData()
      fetchDashboardData()
      fetchHotspotsData()
      fetchDistanceDistribution() // 新增
    }
    // eslint-disable-next-line
  }, [mapInstance, timeRange, customStart, customEnd])



  // 自定义时间选择
  const renderCustomTimeInputs = () => (
    <div className="flex space-x-2 items-center">
      <input
        type="datetime-local"
        value={customStart}
        onChange={e => setCustomStart(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      />
      <span>至</span>
      <input
        type="datetime-local"
        value={customEnd}
        onChange={e => setCustomEnd(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      />
      <Button size="sm" onClick={fetchTaxiHeatmapData} className="ml-2">查询</Button>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">出租车数据分析</h2>
          <p className="text-gray-600 mt-1">出租车运营数据分析与可视化展示</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />全屏显示
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />导出分析报告
          </Button>
          <Button variant="secondary" onClick={fetchTaxiHeatmapData} className="ml-2">
            刷新数据
          </Button>
        </div>
      </div>



      {/* 控制面板 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">时间范围</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                  {timeRangeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            </div>
            {timeRange === "custom" && (
              <div className="col-span-2">{renderCustomTimeInputs()}</div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">数据总量</label>
              <div className="text-lg font-bold text-blue-600">{taxiData?.total_count ?? "-"}</div>
            </div>
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
                  {dashboardData?.stats?.totalOrders?.toLocaleString() || taxiData?.totalOrders?.toLocaleString() || "12,456"}
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
                  {dashboardData?.stats?.activeVehicles?.toLocaleString() || taxiData?.activeVehicles?.toLocaleString() || "2,847"}
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
                <p className="text-3xl font-bold text-orange-600">{dashboardData?.stats?.avgDistance || taxiData?.avgDistance || "8.5"}</p>
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
                  ¥{((dashboardData?.stats?.totalRevenue || taxiData?.totalRevenue || 892000) / 10000).toFixed(1)}万
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

      {/* 地图可视化区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">出租车上客热力图</CardTitle>
            <CardDescription>上客点密度分布</CardDescription>
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
            <CardTitle className="text-xl font-bold">车辆轨迹可视化</CardTitle>
            <CardDescription>主要出行路线与流向</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center space-x-2">
              <span className="text-sm text-gray-700">选择车辆：</span>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="全部车辆" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部车辆（前10）</SelectItem>
                  {vehicleIds.map(id => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={fetchTrajectories}>刷新轨迹</Button>
            </div>
            <div className="relative">
              <div ref={trajectoryMapRef} className="w-full h-80 rounded-xl border bg-gradient-to-br from-blue-50 to-cyan-50" />
              <div className="absolute bottom-2 left-2 text-xs text-gray-400">© 高德地图</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据分析图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">周客流量分布</CardTitle>
            <CardDescription>一周内各天的订单量变化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-t from-green-50 to-white rounded-lg flex items-end justify-center p-4">
              <div className="flex items-end space-x-2 h-full w-full">
                {(dashboardData?.weeklyFlow || taxiData?.weeklyData || []).map((hour: any, i: number) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t"
                      style={{ height: `${((hour.pickup || hour.orders || 0) / 1000) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">{hour.hour || hour.day}</span>
                    <span className="text-xs font-medium">{hour.pickup || hour.orders || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">路程分布分析</CardTitle>
            <CardDescription>不同距离区间的订单占比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#e5e7eb" strokeWidth="16" />
                  {/* 动态渲染各区间的环形进度 */}
                  {distanceDistribution.map((item, i) => {
                    // 计算每段的strokeDasharray
                    const total = distanceDistribution.reduce((sum, d) => sum + d.count, 0) || 1
                    const percent = item.count / total
                    const circumference = 2 * Math.PI * 80
                    let prevPercent = distanceDistribution.slice(0, i).reduce((sum, d) => sum + d.count, 0) / total
                    return (
                      <circle
                        key={i}
                        cx="96"
                        cy="96"
                        r="80"
                        fill="none"
                        stroke={
                          i === 0 ? '#3b82f6' :
                          i === 1 ? '#10b981' :
                          i === 2 ? '#f59e0b' : '#ef4444'
                        }
                        strokeWidth="16"
                        strokeDasharray={`${percent * circumference} ${circumference}`}
                        strokeDashoffset={`-${prevPercent * circumference}`}
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{distanceDistribution.reduce((sum, d) => sum + d.count, 0)}</p>
                    <p className="text-sm text-gray-600">总订单</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {distanceDistribution.map((item, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    i === 0 ? 'bg-blue-500' : 
                    i === 1 ? 'bg-green-500' : 
                    i === 2 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm">{item.range} ({item.count}单, {item.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 热门上客点排行 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">热门区域排行</CardTitle>
          <CardDescription>基于GPS记录密度的热门区域统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(hotspotsData?.hotspots || []).map((spot: any) => (
              <Card key={spot.rank} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={spot.rank <= 3 ? "destructive" : "outline"}>#{spot.rank}</Badge>
                    <span className="text-sm text-green-600 font-medium">{spot.growth}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{spot.name}</h4>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{spot.orders} 记录</span>
                  </div>
                  {spot.avgSpeed && (
                    <div className="text-xs text-blue-600 mt-1">
                      平均速度: {spot.avgSpeed} km/h
                    </div>
                  )}
                  {spot.occupancyRate && (
                    <div className="text-xs text-green-600 mt-1">
                      载客率: {spot.occupancyRate}%
                    </div>
                  )}
                  {spot.lat && spot.lng && (
                    <div className="text-xs text-gray-400 mt-1">
                      {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!hotspotsData?.hotspots || hotspotsData.hotspots.length === 0) && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>暂无热门区域数据</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
