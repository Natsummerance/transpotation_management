"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Car, TrendingUp, MapPin, Download, Eye, BarChart3, Users, Loader2, Clock, DollarSign, Activity, RefreshCw } from "lucide-react"
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Bar, BarChart, ResponsiveContainer, Tooltip, Legend, RadialBar, RadialBarChart } from 'recharts';

// 声明高德地图全局变量
declare global {
  interface Window {
    AMap: any
  }
}

export default function TaxiAnalysisModule() {
  const [selectedMetric, setSelectedMetric] = useState("orders")
  const [timeRange, setTimeRange] = useState("today")
  const [selectedPlate, setSelectedPlate] = useState("all") // 默认选择全部车辆
  const [isLoading, setIsLoading] = useState(true)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [heatmapInstance, setHeatmapInstance] = useState<any>(null)
  const [trajectoryMapInstance, setTrajectoryMapInstance] = useState<any>(null)
  const [taxiData, setTaxiData] = useState<any>(null)
  const [showVehicleDetails, setShowVehicleDetails] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [timeModules, setTimeModules] = useState<any[]>([])
  const [selectedModule, setSelectedModule] = useState("")
  const [isLoadingModule, setIsLoadingModule] = useState(false)
  const [moduleData, setModuleData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreData, setHasMoreData] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const trajectoryMapRef = useRef<HTMLDivElement>(null)

  // 加载高德地图和出租车数据
  useEffect(() => {
    const loadMapAndData = async () => {
      try {
        // 加载高德地图API
        if (!window.AMap) {
          const script = document.createElement("script")
          script.src = `https://webapi.amap.com/maps?v=2.0&key=c6115796bfbad53bd639041995b5b123&plugin=AMap.HeatMap,AMap.MarkerCluster,AMap.Polyline`
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

  // 单独初始化轨迹图地图 - 延迟初始化
  useEffect(() => {
    const initTrajectoryMap = () => {
      if (trajectoryMapRef.current && window.AMap && !trajectoryMapInstance) {
        console.log('初始化轨迹图地图...');
        try {
          const trajectoryMap = new window.AMap.Map(trajectoryMapRef.current, {
            zoom: 11,
            center: [117.0009, 36.6758],
            mapStyle: "amap://styles/normal",
          })
          console.log('轨迹图地图实例创建成功:', !!trajectoryMap);
          setTrajectoryMapInstance(trajectoryMap)
        } catch (error) {
          console.error('轨迹图地图初始化失败:', error);
        }
      } else {
        console.log('轨迹图地图初始化条件不满足:', {
          hasRef: !!trajectoryMapRef.current,
          hasAMap: !!window.AMap,
          hasInstance: !!trajectoryMapInstance
        });
      }
    }

    // 延迟初始化，确保DOM完全渲染
    const timer = setTimeout(initTrajectoryMap, 1000);
    return () => clearTimeout(timer);
  }, [trajectoryMapInstance])

  // 获取出租车分析数据
  const fetchTaxiData = async () => {
    try {
      setIsLoading(true)
      const plateParam = selectedPlate === "all" ? "" : selectedPlate;
      const response = await fetch(`/api/analysis/taxi?metric=${selectedMetric}&timeRange=${timeRange}&plate=${plateParam}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTaxiData(result.data)
          updateHeatmap(result.data)
          // 加载时间模块列表
          await fetchTimeModules()
        } else {
          console.error("API返回错误:", result.error)
          // 显示错误状态，不使用模拟数据
          setTaxiData(null)
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Failed to fetch taxi data:", error)
      // 显示错误状态，不使用模拟数据
      setTaxiData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取时间模块列表
  const fetchTimeModules = async () => {
    try {
      const plateParam = selectedPlate === "all" ? "" : selectedPlate;
      const response = await fetch(`/api/analysis/taxi/heatmap-modules?timeRange=${timeRange}&plate=${plateParam}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTimeModules(result.data.modules)
          console.log(`获取到 ${result.data.modules.length} 个时间模块`)
        }
      }
    } catch (error) {
      console.error("Failed to fetch time modules:", error)
    }
  }

  // 加载指定时间模块的数据
  const loadModuleData = async (moduleKey: string, page: number = 1) => {
    try {
      setIsLoadingModule(true)
      const plateParam = selectedPlate === "all" ? "" : selectedPlate;
      const response = await fetch(`/api/analysis/taxi/heatmap-modules?timeRange=${timeRange}&plate=${plateParam}&moduleKey=${moduleKey}&page=${page}&pageSize=10000`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          if (page === 1) {
            setModuleData(result.data.heatmapData)
          } else {
            setModuleData(prev => [...prev, ...result.data.heatmapData])
          }
          setCurrentPage(page)
          setHasMoreData(result.data.hasMore)
          setSelectedModule(moduleKey)
          
          // 更新热力图
          updateHeatmapWithModuleData(result.data.heatmapData)
        }
      }
    } catch (error) {
      console.error("Failed to load module data:", error)
    } finally {
      setIsLoadingModule(false)
    }
  }

  // 加载更多数据
  const loadMoreData = async () => {
    if (selectedModule && hasMoreData) {
      await loadModuleData(selectedModule, currentPage + 1)
    }
  }

  // 更新热力图
  const updateHeatmap = (data: any) => {
    if (!mapInstance || !data?.heatmapData) {
      console.log('热力图更新失败:', {
        hasMapInstance: !!mapInstance,
        hasHeatmapData: !!data?.heatmapData,
        dataLength: data?.heatmapData?.length || 0
      });
      return;
    }

    console.log(`更新热力图，数据点数量: ${data.heatmapData.length}`);

    // 清除现有热力图
    if (heatmapInstance) {
      mapInstance.remove(heatmapInstance)
    }

    // 计算数据权重范围
    const weights = data.heatmapData.map((point: any) => point.count);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    
    console.log(`热力图权重范围: ${minWeight} - ${maxWeight}`);

    // 创建新的热力图 - 改进配置，支持大量数据点
    const heatmap = new window.AMap.HeatMap(mapInstance, {
      radius: 25, // 适中的半径，平衡显示效果和性能
      opacity: [0.1, 0.9], // 调整透明度范围
      gradient: {
        0.2: "rgba(0, 0, 255, 0.3)",   // 蓝色 - 低密度
        0.4: "rgba(0, 255, 255, 0.5)", // 青色 - 中低密度
        0.6: "rgba(0, 255, 0, 0.7)",   // 绿色 - 中密度
        0.8: "rgba(255, 255, 0, 0.8)", // 黄色 - 中高密度
        1.0: "rgba(255, 0, 0, 0.9)"    // 红色 - 高密度
      },
      // 性能优化配置
      renderOnZooming: false, // 缩放时不重新渲染，提升性能
      renderOnMoving: false   // 移动时不重新渲染，提升性能
    })

    // 设置数据集
    heatmap.setDataSet({
      data: data.heatmapData,
      max: maxWeight, // 使用实际的最大权重
      min: minWeight  // 使用实际的最小权重
    })

    // 添加地图缩放事件监听，实现动态调整半径
    mapInstance.on('zoomend', () => {
      const zoom = mapInstance.getZoom();
      console.log(`地图缩放级别: ${zoom}`);
      // 根据缩放级别调整热力图参数 - 针对大量数据优化
      if (zoom < 12) {
        // 低缩放级别 - 更大的半径
        heatmap.setOptions({
          radius: 60
        });
      } else if (zoom < 14) {
        // 中等缩放级别 - 中等半径
        heatmap.setOptions({
          radius: 40
        });
      } else if (zoom < 16) {
        // 高缩放级别 - 较小半径
        heatmap.setOptions({
          radius: 25
        });
      } else {
        // 最高缩放级别 - 最小半径
        heatmap.setOptions({
          radius: 15
        });
      }
    });

    setHeatmapInstance(heatmap)
  }

  // 使用模块数据更新热力图
  const updateHeatmapWithModuleData = (moduleData: any[]) => {
    if (!mapInstance || !moduleData || moduleData.length === 0) {
      console.log('模块热力图更新失败:', {
        hasMapInstance: !!mapInstance,
        hasModuleData: !!moduleData,
        dataLength: moduleData?.length || 0
      });
      return;
    }

    console.log(`使用模块数据更新热力图，数据点数量: ${moduleData.length}`);

    // 清除现有热力图
    if (heatmapInstance) {
      mapInstance.remove(heatmapInstance)
    }

    // 计算数据权重范围
    const weights = moduleData.map((point: any) => point.count);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    
    console.log(`模块热力图权重范围: ${minWeight} - ${maxWeight}`);

    // 创建新的热力图
    const heatmap = new window.AMap.HeatMap(mapInstance, {
      radius: 25,
      opacity: [0.1, 0.9],
      gradient: {
        0.2: "rgba(0, 0, 255, 0.3)",
        0.4: "rgba(0, 255, 255, 0.5)",
        0.6: "rgba(0, 255, 0, 0.7)",
        0.8: "rgba(255, 255, 0, 0.8)",
        1.0: "rgba(255, 0, 0, 0.9)"
      },
      renderOnZooming: false,
      renderOnMoving: false
    })

    // 设置数据集
    heatmap.setDataSet({
      data: moduleData,
      max: maxWeight,
      min: minWeight
    })

    setHeatmapInstance(heatmap)
  }

  // 在轨迹地图上叠加箭头，表示heading和speed
  const updateTrajectoryMap = (data: any) => {
    if (!trajectoryMapInstance) {
      console.log('轨迹地图实例不存在');
      return;
    }
    
    console.log('开始更新轨迹图，数据:', {
      trajectoryPoints: data?.trajectoryPoints?.length || 0,
      trajectoryData: data?.trajectoryData?.length || 0
    });
    
    trajectoryMapInstance.clearMap();

    // 轨迹线（如有）
    if (data?.trajectoryData) {
      data.trajectoryData.forEach((trajectory: any) => {
        const path = trajectory.points.map((point: any) => [point.longitude, point.latitude]);
        const polyline = new window.AMap.Polyline({
          path: path,
          strokeColor: trajectory.color,
          strokeWeight: 3,
          strokeOpacity: 0.8,
        });
        trajectoryMapInstance.add(polyline);
      });
    }

    // 叠加箭头（heading/speed）
    if (data?.trajectoryPoints && data.trajectoryPoints.length > 0) {
      console.log('添加轨迹点箭头，数量:', data.trajectoryPoints.length);
      data.trajectoryPoints.forEach((pt: any, index: number) => {
        // 根据载客状态和速度设置颜色和大小
        let color = '#10b981'; // 绿色 - 低速
        let size = 16;
        
        // 载客状态优先于速度
        if (pt.isOccupied) {
          color = '#3b82f6'; // 蓝色 - 载客
          size = 18;
        } else {
          if (pt.speed > 30) {
            color = '#ef4444'; // 红色 - 高速空车
            size = 20;
          } else if (pt.speed > 15) {
            color = '#f59e0b'; // 橙色 - 中速空车
            size = 18;
          }
        }

        // 特殊事件标记
        if (pt.eventTag === 1) { // 上客事件
          color = '#8b5cf6'; // 紫色
          size = 22;
        } else if (pt.eventTag === 2) { // 下客事件
          color = '#ec4899'; // 粉色
          size = 22;
        }

        // 创建箭头SVG
        const iconSvg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="rotate(${pt.heading},${size/2},${size/2})">
            <path d="M${size/2} 2 L${size-2} ${size/2} L${size/2} ${size-2} L${size/2-2} ${size/2} Z" fill="${color}" stroke="white" stroke-width="0.5"/>
          </g>
        </svg>`;

        const eventLabels: { [key: number]: string } = {
          1: '上客',
          2: '下客',
          3: '载客中',
          4: '空车'
        };

        const marker = new window.AMap.Marker({
          position: [pt.lng, pt.lat],
          icon: new window.AMap.Icon({
            size: new window.AMap.Size(size, size),
            image: 'data:image/svg+xml;base64,' + btoa(iconSvg),
          }),
          offset: new window.AMap.Pixel(-size/2, -size/2),
          title: `速度: ${pt.speed} km/h, 方向: ${pt.heading}°, 状态: ${eventLabels[pt.eventTag as number] || '未知'}, 行程: ${pt.tripId}, 时间: ${pt.time}`
        });
        trajectoryMapInstance.add(marker);
      });
    }
  };

  // 自动刷新功能
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchTaxiData()
      }, 30000) // 每30秒刷新一次
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  // 导出数据功能
  const exportData = () => {
    if (!taxiData) return

    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange: taxiData.timeRange,
      metric: taxiData.metric,
      summary: {
        totalOrders: taxiData.totalOrders,
        activeVehicles: taxiData.activeVehicles,
        avgSpeed: taxiData.avgSpeed,
        occupancyRate: taxiData.occupancyRate
      },
      hotspots: taxiData.hotspots,
      vehicleDetails: taxiData.vehicleDetails,
      revenueData: taxiData.revenueData,
      speedDistribution: taxiData.speedDistribution
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taxi-analysis-${taxiData.timeRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 重新获取数据
  useEffect(() => {
    if (mapInstance) {
      fetchTaxiData()
    }
  }, [selectedMetric, timeRange, selectedPlate, mapInstance])

  // 更新轨迹图
  useEffect(() => {
    if (taxiData && trajectoryMapInstance) {
      console.log('更新轨迹图:', {
        trajectoryPoints: taxiData.trajectoryPoints?.length || 0,
        mapInstance: !!trajectoryMapInstance
      });
      updateTrajectoryMap(taxiData)
    }
  }, [taxiData, trajectoryMapInstance])

  // 方向分布玫瑰图组件
  function HeadingRoseChart({ data }: { data: any[] }) {
    return (
      <div className="w-full h-72 bg-white rounded-lg shadow p-4">
        <h3 className="font-bold text-lg mb-2">方向分布玫瑰图</h3>
        <ResponsiveContainer width="100%" height="90%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="90%"
            barSize={18}
            data={data}
          >
            <PolarAngleAxis
              dataKey="headingBin"
              type="number"
              domain={[0, 360]}
              tick={{ fontSize: 12 }}
              tickFormatter={v => `${v}°`}
            />
            <RadialBar
              background
              dataKey="count"
              fill="#3b82f6"
            />
            <Tooltip formatter={(v: any) => `${v} 个`} />
            <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">出租车数据分析</h2>
          <p className="text-gray-600 mt-1">基于taxi_gps_log表的实时数据分析与可视化展示</p>
          {taxiData?.lastUpdated && (
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              数据更新时间: {new Date(taxiData.lastUpdated).toLocaleString('zh-CN')}
              {taxiData.totalOrders > 0 && (
                <span className="ml-4 text-green-600">✓ 使用真实数据库数据</span>
              )}
            </div>
          )}
          {!taxiData && !isLoading && (
            <div className="flex items-center mt-2 text-sm text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              数据加载失败，请检查数据库连接
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            实时监控
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
            onClick={() => exportData()}
          >
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 控制面板 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Select value={selectedPlate} onValueChange={setSelectedPlate}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="选择车牌号" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部车辆</SelectItem>
                {taxiData?.availablePlates?.map((plate: string) => (
                  <SelectItem key={plate} value={plate}>
                    {plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className={`h-12 ${autoRefresh ? 'bg-green-50 border-green-200 text-green-600' : 'bg-transparent'}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? '自动刷新中' : '自动刷新'}
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
                <p className="text-sm font-medium text-gray-600">总记录数</p>
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-blue-600">
                    {taxiData?.totalOrders?.toLocaleString() || "0"}
                  </p>
                )}
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">
                    {taxiData?.totalOrders > 0 ? "实时数据" : "暂无数据"}
                  </span>
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
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-green-600">
                    {taxiData?.activeVehicles?.toLocaleString() || "0"}
                  </p>
                )}
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">
                    {taxiData?.activeVehicles > 0 ? "实时统计" : "暂无数据"}
                  </span>
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
                <p className="text-sm font-medium text-gray-600">平均速度</p>
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600 mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-orange-600">{taxiData?.avgSpeed || "0"} km/h</p>
                )}
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-blue-600" />
                  <span className="text-sm text-blue-600">
                    {taxiData?.avgSpeed > 0 ? "实时监控" : "暂无数据"}
                  </span>
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
                <p className="text-sm font-medium text-gray-600">载客率</p>
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                    <span className="text-sm text-gray-500">加载中...</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-purple-600">
                    {taxiData?.occupancyRate || "0"}%
                  </p>
                )}
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">
                    {taxiData?.occupancyRate > 0 ? "实时分析" : "暂无数据"}
                  </span>
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
            <CardTitle className="text-xl font-bold flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-red-600" />
              出租车热力图
              {taxiData?.heatmapData && (
                <Badge variant="secondary" className="ml-2">
                  {taxiData.heatmapData.length} 个数据点
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
                    <p className="text-xs text-gray-600">加载地图中...</p>
                    <p className="text-xs text-gray-400">API: c6115796bfbad53bd639041995b5b123</p>
                  </div>
                </div>
              )}
              <div ref={mapRef} className="w-full h-80 rounded-xl border" />
              <div className="absolute bottom-2 left-2 text-xs text-gray-400">© 高德地图</div>
              
              {/* 热力图图例 */}
              {taxiData?.heatmapData && (
                <div className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded-lg shadow-sm">
                  <div className="text-xs font-medium text-gray-700 mb-1">热力图图例</div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500 bg-opacity-30"></div>
                      <span className="text-xs text-gray-600">低密度</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-green-500 bg-opacity-70"></div>
                      <span className="text-xs text-gray-600">中密度</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-500 bg-opacity-90"></div>
                      <span className="text-xs text-gray-600">高密度</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            

            {/* 热力图统计信息 */}
            {(taxiData?.heatmapData || moduleData.length > 0) && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">
                    {(moduleData.length > 0 ? moduleData.length : taxiData?.heatmapData?.length || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-700">显示数据点</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {(moduleData.length > 0 ? moduleData.filter((p: any) => p.isOccupied).length : taxiData?.heatmapData?.filter((p: any) => p.isOccupied).length || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-700">载客点</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">
                    {(moduleData.length > 0 ? moduleData.filter((p: any) => p.eventTag === 1 || p.eventTag === 2).length : taxiData?.heatmapData?.filter((p: any) => p.eventTag === 1 || p.eventTag === 2).length || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-purple-700">上下客点</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-lg font-bold text-orange-600">
                    {Math.round((moduleData.length > 0 ? moduleData.reduce((sum: number, p: any) => sum + p.speed, 0) : taxiData?.heatmapData?.reduce((sum: number, p: any) => sum + p.speed, 0) || 0) / (moduleData.length > 0 ? moduleData.length : taxiData?.heatmapData?.length || 1))}
                  </p>
                  <p className="text-xs text-orange-700">平均速度</p>
                </div>
              </div>
            )}

            {/* 加载更多按钮 */}
            {hasMoreData && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={loadMoreData}
                  disabled={isLoadingModule}
                  className="w-full"
                >
                  {isLoadingModule ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      加载中...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      加载更多数据 (第 {currentPage} 页)
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 轨迹地图 */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-purple-600" />
              客流轨迹分析
              {selectedPlate !== "all" && (
                <Badge variant="secondary" className="ml-2">
                  车牌: {selectedPlate}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selectedPlate !== "all" ? `显示车牌 ${selectedPlate} 的轨迹数据` : '显示所有车辆的轨迹数据'}
              {taxiData?.trajectoryPoints && (
                <span className="ml-2 text-blue-600">
                  ({taxiData.trajectoryPoints.length} 个轨迹点)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-gray-50 rounded-lg relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
                    <p className="text-xs text-gray-600">加载地图中...</p>
                    <p className="text-xs text-gray-400">API: c6115796bfbad53bd639041995b5b123</p>
                  </div>
                </div>
              ) : (
                <div ref={trajectoryMapRef} className="w-full h-full rounded-lg" style={{ minHeight: '384px' }} />
              )}
            </div>
            
            {/* 调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 border rounded-lg">
                {!trajectoryMapInstance && (
                  <Button 
                    size="sm" 
                    className="mt-2 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      if (trajectoryMapRef.current && window.AMap) {
                        const trajectoryMap = new window.AMap.Map(trajectoryMapRef.current, {
                          zoom: 11,
                          center: [117.0009, 36.6758],
                          mapStyle: "amap://styles/normal",
                        });
                        setTrajectoryMapInstance(trajectoryMap);
                      }
                    }}
                  >
                    手动初始化轨迹图
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 上下客事件统计 */}
      {taxiData?.passengerEvents && taxiData.passengerEvents.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              上下客事件统计
            </CardTitle>
            <CardDescription>基于event_tag字段的运营状态变化分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {taxiData.passengerEvents.map((event: any) => (
                <Card key={event.eventTag} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant={
                          event.eventTag === 1 ? "default" : 
                          event.eventTag === 2 ? "secondary" : 
                          event.eventTag === 3 ? "outline" : "destructive"
                        }
                      >
                        {event.label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>事件次数:</span>
                        <span className="font-medium">{event.count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>平均速度:</span>
                        <span className="font-medium">{event.avgSpeed} km/h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>涉及车辆:</span>
                        <span className="font-medium">{event.vehicleCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* 行程统计 */}
            {taxiData?.tripStats && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">行程统计</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{taxiData.tripStats.totalTrips}</p>
                    <p className="text-sm text-blue-700">总行程数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{taxiData.tripStats.occupiedTime.toLocaleString()}</p>
                    <p className="text-sm text-green-700">载客时间</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{taxiData.tripStats.emptyTime.toLocaleString()}</p>
                    <p className="text-sm text-orange-700">空车时间</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{taxiData.tripStats.occupancyRate}%</p>
                    <p className="text-sm text-purple-700">载客率</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 数据分析图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">速度分布分析</CardTitle>
            <CardDescription>不同速度区间的车辆占比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {/* 动态饼图 */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#e5e7eb" strokeWidth="16" />
                  {taxiData?.speedDistribution && taxiData.speedDistribution.length > 0 ? (
                    taxiData.speedDistribution.map((item: any, index: number) => {
                      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
                      const circumference = 2 * Math.PI * 80;
                      const strokeDasharray = (item.percentage / 100) * circumference;
                      const strokeDashoffset = index === 0 ? 0 : 
                        taxiData.speedDistribution.slice(0, index).reduce((acc: number, curr: any) => 
                          acc - (curr.percentage / 100) * circumference, 0);
                      
                      return (
                        <circle
                          key={index}
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke={colors[index % colors.length]}
                          strokeWidth="16"
                          strokeDasharray={`${strokeDasharray} ${circumference}`}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    })
                  ) : (
                    // 默认饼图
                    <>
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
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{taxiData?.avgSpeed || "0"}</p>
                    <p className="text-sm text-gray-600">平均速度 km/h</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {taxiData?.speedDistribution && taxiData.speedDistribution.length > 0 ? (
                taxiData.speedDistribution.slice(0, 4).map((item: any, index: number) => {
                  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }}></div>
                      <span className="text-sm">{item.range} ({item.percentage}%)</span>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-4 text-gray-500">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">暂无速度分布数据</p>
                </div>
              )}
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
              {/* 真实数据折线图 */}
              <div className="flex items-end space-x-1 h-full w-full">
                {(taxiData?.hourlyData || []).map((count: number, i: number) => {
                  // 计算相对高度，基于最大值的百分比
                  const maxCount = Math.max(...(taxiData?.hourlyData || [0]))
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                  
                  return (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-300"
                        style={{ height: `${height}%` }}
                      ></div>
                      {i % 4 === 0 && <span className="text-xs text-gray-500 mt-1">{i}:00</span>}
                    </div>
                  )
                })}
                {(!taxiData?.hourlyData || taxiData.hourlyData.length === 0) && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>暂无时段数据</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-600">
              <span>早高峰: 7:00-9:00</span>
              <span>晚高峰: 17:00-19:00</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 热门区域排行 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">热门区域排行</CardTitle>
          <CardDescription>基于GPS记录密度的热门区域统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(taxiData?.hotspots && taxiData.hotspots.length > 0 ? taxiData.hotspots : []).map((spot: any) => (
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
            {(!taxiData?.hotspots || taxiData.hotspots.length === 0) && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>暂无热门区域数据</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 车辆详情表格 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <Car className="w-5 h-5 mr-2 text-blue-600" />
            车辆详情
          </CardTitle>
          <CardDescription>前20辆活跃车辆的详细运营数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setShowVehicleDetails(!showVehicleDetails)}
              >
                {showVehicleDetails ? '隐藏详情' : '显示详情'}
              </Button>
              <div className="text-sm text-gray-500">
                共 {taxiData?.vehicleDetails?.length || 0} 辆车
              </div>
            </div>
            
            {/* 调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800">调试信息:</p>
                <p className="text-xs text-yellow-700">
                  车辆详情数据: {taxiData?.vehicleDetails ? `${taxiData.vehicleDetails.length} 条记录` : '无数据'}
                </p>
                {taxiData?.vehicleDetails && taxiData.vehicleDetails.length > 0 && (
                  <p className="text-xs text-yellow-700">
                    示例车辆: {taxiData.vehicleDetails[0].taxiId} - {taxiData.vehicleDetails[0].recordCount} 记录
                  </p>
                )}
              </div>
            )}
            
            {showVehicleDetails && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>车牌号</TableHead>
                      <TableHead>记录数</TableHead>
                      <TableHead>平均速度</TableHead>
                      <TableHead>最高速度</TableHead>
                      <TableHead>载客次数</TableHead>
                      <TableHead>载客率</TableHead>
                      <TableHead>活跃时长</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(taxiData?.vehicleDetails && taxiData.vehicleDetails.length > 0 ? taxiData.vehicleDetails : []).map((vehicle: any, index: number) => (
                      <TableRow key={vehicle.taxiId || index}>
                        <TableCell className="font-mono text-sm">{vehicle.taxiId || '未知'}</TableCell>
                        <TableCell>{vehicle.recordCount?.toLocaleString() || 0}</TableCell>
                        <TableCell>{vehicle.avgSpeed || 0} km/h</TableCell>
                        <TableCell>{vehicle.maxSpeed || 0} km/h</TableCell>
                        <TableCell>{vehicle.occupiedCount?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          <Badge variant={vehicle.occupancyRate > 60 ? "default" : vehicle.occupancyRate > 30 ? "secondary" : "outline"}>
                            {vehicle.occupancyRate || 0}%
                          </Badge>
                        </TableCell>
                        <TableCell>{vehicle.activeHours || 0} 小时</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(!taxiData?.vehicleDetails || taxiData.vehicleDetails.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Car className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>暂无车辆详情数据</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 上下客事件统计 */}
      {taxiData?.passengerEvents && taxiData.passengerEvents.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              上下客事件统计
            </CardTitle>
            <CardDescription>基于event_tag字段的运营状态变化分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {taxiData.passengerEvents.map((event: any) => (
                <Card key={event.eventTag} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant={
                          event.eventTag === 1 ? "default" : 
                          event.eventTag === 2 ? "secondary" : 
                          event.eventTag === 3 ? "outline" : "destructive"
                        }
                      >
                        {event.label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>事件次数:</span>
                        <span className="font-medium">{event.count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>平均速度:</span>
                        <span className="font-medium">{event.avgSpeed} km/h</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>涉及车辆:</span>
                        <span className="font-medium">{event.vehicleCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* 行程统计 */}
            {taxiData?.tripStats && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-3">行程统计</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{taxiData.tripStats.totalTrips}</p>
                    <p className="text-sm text-blue-700">总行程数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{taxiData.tripStats.occupiedTime.toLocaleString()}</p>
                    <p className="text-sm text-green-700">载客时间</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{taxiData.tripStats.emptyTime.toLocaleString()}</p>
                    <p className="text-sm text-orange-700">空车时间</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{taxiData.tripStats.occupancyRate}%</p>
                    <p className="text-sm text-purple-700">载客率</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
