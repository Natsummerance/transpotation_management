"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, TrendingUp, MapPin, Download, Eye, BarChart3, Users, Loader2, Calendar, Layers, Route, Target, Clock } from "lucide-react"
import { Range, getTrackBackground } from "react-range"

// 声明高德地图全局变量
declare global {
  interface Window {
    AMap: any
  }
}

// 时间轴半天粒度常量
function generateHalfDayTimeline(startDate: string, endDate: string) {
  const result: string[] = [];
  let current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (current <= end) {
    // 用本地时间拼接 yyyy-MM-dd HH:mm
    const y = current.getFullYear();
    const m = (current.getMonth() + 1).toString().padStart(2, '0');
    const d = current.getDate().toString().padStart(2, '0');
    const h = current.getHours().toString().padStart(2, '0');
    const mm = current.getMinutes().toString().padStart(2, '0');
    result.push(`${y}-${m}-${d} ${h}:${mm}`);
    current.setHours(current.getHours() + 12);
  }
  return result;
}
const TIMELINE_HALFDAY = generateHalfDayTimeline('2013-09-12', '2013-09-19');
const TIMELINE_MIN = 0;
const TIMELINE_MAX = TIMELINE_HALFDAY.length - 1;

// 获取时间范围的起止时间字符串（支持半天）
function getTimeRange(customStart?: string, customEnd?: string) {
  // customStart/customEnd 格式为 yyyy-MM-dd HH:mm
  const start = customStart ? `${customStart}:00` : "2013-09-12 00:00:00"
  // 结束时间如果是 00:00，取当天 11:59:59；如果是 12:00，取当天 23:59:59
  let end = "2013-09-12 23:59:59";
  if (customEnd) {
    if (customEnd.endsWith('00:00')) {
      end = customEnd.replace('00:00', '11:59:59');
    } else if (customEnd.endsWith('12:00')) {
      end = customEnd.replace('12:00', '23:59:59');
    }
  }
  return { start, end }
}

export default function TaxiAnalysisModule() {
  const [customStart, setCustomStart] = useState("2013-09-12")
  const [customEnd, setCustomEnd] = useState("2013-09-12")
  const [isLoading, setIsLoading] = useState(true)
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(true)
  const [isTrajectoryLoading, setIsTrajectoryLoading] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [heatmapInstance, setHeatmapInstance] = useState<any>(null)
  const [taxiData, setTaxiData] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [hotspotsData, setHotspotsData] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const trajectoryMapRef = useRef<HTMLDivElement>(null)
  const hotspotsMapRef = useRef<HTMLDivElement>(null)
  const vehicleHeatmapRef = useRef<any>(null)
  const [vehicleIds, setVehicleIds] = useState<string[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all")
  const [trajectories, setTrajectories] = useState<any[]>([])
  const [eventType, setEventType] = useState<'pickup' | 'dropoff'>('pickup')
  // 移除amapReady状态，简化地图加载逻辑
  // const [amapReady, setAmapReady] = useState(false) // 删除这行


  const [activeView, setActiveView] = useState("heatmap") // heatmap, trajectory, hotspots

  // 新增：路程分布分析数据
  const [distanceDistribution, setDistanceDistribution] = useState<any[]>([])
  const [hotspotsMapData, setHotspotsMapData] = useState<any[]>([])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // 新增：依次初始化三张地图底图，全部ready后再渲染业务层
  const [mapReadyStep, setMapReadyStep] = useState(0); // 0: none, 1: heatmap ready, 2: trajectory ready, 3: hotspots ready
  const [heatmapMapInstance, setHeatmapMapInstance] = useState<any>(null);
  const [trajectoryMapInstance, setTrajectoryMapInstance] = useState<any>(null);
  const [hotspotsMapInstance, setHotspotsMapInstance] = useState<any>(null);

  // 缓存 key
  const TAXI_ANALYSIS_CACHE_KEY = 'taxi_analysis_cache';
  // 热门上客区域排行Tab状态（如有）
  const [hotspotTab, setHotspotTab] = useState('rank'); // 如无tab可忽略
  const [isFromCache, setIsFromCache] = useState(false); // 标记热力图数据来源
  // 标记是否已恢复缓存
  const [hasRestoredCache, setHasRestoredCache] = useState(false);

  // 时间轴滑块值，0-(TIMELINE_HALFDAY.length-1)分别对应TIMELINE_HALFDAY
  const [timelineRange, setTimelineRange] = useState<[number, number]>([0, 1])

  // 时间轴变更时，更新customStart/customEnd（修正为:00结尾）
  useEffect(() => {
    // 统一补全为 %Y-%m-%d %H:%M:%S
    function padToFull(dt: string, end = false) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) return dt + (end ? ' 23:59:59' : ' 00:00:00');
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dt)) return dt + ':00';
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dt)) return dt;
      return dt;
    }
    setCustomStart(padToFull(TIMELINE_HALFDAY[timelineRange[0]]));
    setCustomEnd(padToFull(TIMELINE_HALFDAY[timelineRange[1]], true));
  }, [timelineRange]);

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

        // 初始化地图
        if (mapRef.current && window.AMap) {
          const heatMap = new window.AMap.Map(mapRef.current, {
            zoom: 11,
            center: [117.0009, 36.6758],
            mapStyle: "amap://styles/normal",
          })

          setMapInstance(heatMap)
          
          // 直接获取数据，不等待complete事件
          fetchTaxiHeatmapData()
          fetchDashboardData()
          fetchHotspotsData()
          fetchDistanceDistribution()
          fetchHotspotsMapData()
          
          setIsLoading(false)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Failed to load map:", error)
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
    setIsHeatmapLoading(true)
    // 先清除所有热力图图层
    if (heatmapMapInstance && heatmapMapInstance.getAllOverlays) {
      const overlays1 = heatmapMapInstance.getAllOverlays('AMap.HeatMap') || []
      overlays1.forEach((overlay: any) => heatmapMapInstance.remove(overlay))
      const overlays2 = heatmapMapInstance.getAllOverlays('heatmap') || []
      overlays2.forEach((overlay: any) => heatmapMapInstance.remove(overlay))
    }
    if (heatmapInstance && heatmapMapInstance) {
      heatmapMapInstance.remove(heatmapInstance)
      setHeatmapInstance(null)
    }
    try {
      const { start, end } = getTimeRange(customStart, customEnd)
      const url = `http://localhost:8000/api/heatmap/?event_type=${eventType}&start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}&limit=1000`
      
      console.log("请求热力图数据:", {
        url,
        customStart,
        customEnd
      })
      
      const response = await fetch(url)
      console.log("API响应状态:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("接收到的数据:", {
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
        })
        updateHeatmap({ heatmapData })
      } else {
        const errorText = await response.text()
        console.error("API请求失败:", response.status, errorText)
        updateHeatmap({ heatmapData: [] })
      }
    } catch (error) {
      console.error("请求异常:", error)
      updateHeatmap({ heatmapData: [] })
    }
    setIsHeatmapLoading(false)
  }

  // 获取仪表板综合数据
  const fetchDashboardData = async () => {
    console.log("开始获取仪表板数据...")
    const { start, end } = getTimeRange(customStart, customEnd)
    try {
      const url = `http://localhost:8000/api/dashboard/?event_type=${eventType}&start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`
      console.log("dashboard url", url)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("仪表板数据:", data)
      setDashboardData(data)
    } catch (error) {
      console.error("获取仪表板数据失败:", error)
    }
  }

  // 获取热点分析数据
  const fetchHotspotsData = async () => {
    console.log("开始获取热点分析数据...")
    const { start, end } = getTimeRange(customStart, customEnd)
    try {
      // 调用后端新API
      const response = await fetch(`http://localhost:8000/api/hotspots/?event_type=${eventType}&start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("热门区域分析数据:", data)
      setHotspotsData(data)
    } catch (error) {
      console.error("获取热门区域数据失败:", error)
    }
  }

  // 获取路程分布分析数据（调用Django后端新API）
  const fetchDistanceDistribution = async () => {
    const { start, end } = getTimeRange(customStart, customEnd)
    try {
      const response = await fetch(`http://localhost:8000/api/distance-distribution/?start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setDistanceDistribution(data)
    } catch (error) {
      console.error("获取路程分布分析数据失败:", error)
      setDistanceDistribution([])
    }
  }

  // 获取热门上客点聚类地图数据（前50个）
  const fetchHotspotsMapData = async () => {
    const { start, end } = getTimeRange(customStart, customEnd)
    try {
      const response = await fetch(`http://localhost:8000/api/hotspots/?event_type=${eventType}&start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}&n_cluster=50`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setHotspotsMapData(data.hotspots || [])
    } catch (error) {
      console.error("获取热门上客点聚类地图数据失败:", error)
      setHotspotsMapData([])
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
    setIsTrajectoryLoading(true)
    setTrajectories([])
    if (selectedVehicle === "all") {
      // 全部车辆（只取前10辆，防止卡死）
      const ids = vehicleIds.slice(0, 10)
      const all = await Promise.all(ids.map(async id => {
        const { start, end } = getTimeRange(customStart, customEnd)
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
      const { start, end } = getTimeRange(customStart, customEnd)
      const res = await fetch(`http://localhost:8000/api/trajectory/?car_plate=${selectedVehicle}&start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`)
      if (res.ok) {
        const data = await res.json()
        setTrajectories([{ id: selectedVehicle, trajectory: data.trajectory }])
        drawTrajectories([{ id: selectedVehicle, trajectory: data.trajectory }])
      }
    }
    setIsTrajectoryLoading(false)
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
  }, [activeView, selectedVehicle, trajectoryMapInstance, customStart, customEnd])

  // 切换eventType、时间等时，彻底清理热力图
  useEffect(() => {
    if (vehicleHeatmapRef.current) {
      if (typeof vehicleHeatmapRef.current.setMap === 'function') {
        vehicleHeatmapRef.current.setMap(null)
        vehicleHeatmapRef.current = null
      } else {
        vehicleHeatmapRef.current = null
      }
    }
  }, [eventType, customStart, customEnd])

  // 更新热力图
  const updateHeatmap = (data: any) => {
    // 终极防御：地图实例、插件、容器都必须 ready
    if (
      !heatmapMapInstance ||
      typeof heatmapMapInstance.add !== "function" ||
      typeof heatmapMapInstance.getCenter !== "function" ||
      typeof window.AMap?.HeatMap !== "function" ||
      !mapRef.current ||
      !(mapRef.current instanceof Element) ||
      typeof heatmapMapInstance.getContainer !== "function" ||
      !(heatmapMapInstance.getContainer() instanceof Element)
    ) {
      return;
    }
    // 彻底清理旧热力图
    if (vehicleHeatmapRef.current && typeof vehicleHeatmapRef.current.setMap === 'function') {
      vehicleHeatmapRef.current.setMap(null)
      vehicleHeatmapRef.current = null
    } else {
      vehicleHeatmapRef.current = null
    }
    // 创建新的热力图
    if (data.heatmapData && data.heatmapData.length > 0) {
      try {
        console.log("创建热力图，数据点数:", data.heatmapData.length)
        const heatmap = new window.AMap.HeatMap(heatmapMapInstance, {
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
        vehicleHeatmapRef.current = heatmap
        console.log("热力图创建成功")
      } catch (e) {
        console.error("热力图创建失败", e, heatmapMapInstance, mapRef.current)
      }
    } else {
      console.log("无热力图数据")
    }
  }

  // 添加简化的useEffect处理mapInstance变化
  useEffect(() => {
    if (heatmapMapInstance) {
      fetchTaxiHeatmapData()
      fetchDashboardData()
      fetchHotspotsData()
      fetchDistanceDistribution()
      fetchHotspotsMapData()
    }
    // eslint-disable-next-line
  }, [heatmapMapInstance, customStart, customEnd, eventType])

  // 在eventType变化时，清除热力图和相关地图的图层
  useEffect(() => {
    // 清除热力图
    if (heatmapMapInstance && heatmapInstance) {
      heatmapMapInstance.remove(heatmapInstance)
      setHeatmapInstance(null)
    }
    // 清除轨迹地图
    if (trajectoryMapInstance) {
      trajectoryMapInstance.clearMap()
    }
    // 清除热门点地图（如果有单独实例）
    // 这里假设HotspotsMap内部已处理自己的清理逻辑
  }, [eventType])

  // 动态加载高德地图API（只加载一次）
  useEffect(() => {
    if (!window.AMap) {
      const script = document.createElement("script");
      script.src = `https://webapi.amap.com/maps?v=2.0&key=c6115796bfbad53bd639041995b5b123&plugin=AMap.HeatMap,AMap.MarkerCluster,AMap.Polyline`;
      script.async = true;
      document.head.appendChild(script);
      script.onload = () => setMapReadyStep(0); // 触发后续地图初始化
      script.onerror = () => setMapReadyStep(-1);
    }
  }, []);

  // 依次初始化底图
  useEffect(() => {
    if (mapReadyStep === 0 && mapRef.current && window.AMap) {
      // 只允许赋值为地图实例
      const map = new window.AMap.Map(mapRef.current, {
        zoom: 11,
        center: [117.0009, 36.6758],
        mapStyle: "amap://styles/normal",
      });
      setHeatmapMapInstance(map); // 这里必须是 map 实例
      map.on('complete', () => setMapReadyStep(1));
    }
  }, [mapReadyStep, mapRef.current, window.AMap]);

  useEffect(() => {
    if (mapReadyStep === 1 && trajectoryMapRef.current && window.AMap) {
      // 初始化轨迹图底图
      const map = new window.AMap.Map(trajectoryMapRef.current, {
        zoom: 11,
        center: [117.0009, 36.6758],
        mapStyle: "amap://styles/normal",
      });
      setTrajectoryMapInstance(map);
      map.on('complete', () => setMapReadyStep(2));
    }
  }, [mapReadyStep, trajectoryMapRef.current, window.AMap]);

  useEffect(() => {
    if (mapReadyStep === 2 && hotspotsMapRef.current && window.AMap) {
      // 初始化热点图底图
      const map = new window.AMap.Map(hotspotsMapRef.current, {
        zoom: 11,
        center: [117.0009, 36.6758],
        mapStyle: "amap://styles/normal",
      });
      setHotspotsMapInstance(map);
      map.on('complete', () => setMapReadyStep(3));
    }
  }, [mapReadyStep, hotspotsMapRef.current, window.AMap]);

  // 三张底图都ready后，同时渲染业务层
  useEffect(() => {
    if (mapReadyStep === 3) {
      // 热力图业务层
      fetchTaxiHeatmapData();
      // 轨迹业务层
      fetchTrajectories();
      // 热点业务层
      fetchHotspotsMapData();
      fetchDashboardData();
      fetchDistanceDistribution();
      fetchHotspotsData();
      setIsLoading(false);
    }
  }, [mapReadyStep, eventType, customStart, customEnd]);

  // 简化地图容器，移除minHeight和背景色
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

  const CACHE_EXPIRE_MS = 1000 * 60 * 60; // 1小时有效
  useEffect(() => {
    // 只在首次加载时尝试恢复缓存
    if (!hasRestoredCache) {
      const cache = localStorage.getItem(TAXI_ANALYSIS_CACHE_KEY);
      if (cache) {
        try {
          const data = JSON.parse(cache);
          if (data.cacheTime && Date.now() - data.cacheTime < CACHE_EXPIRE_MS) {
            if (data.taxiData) setTaxiData(data.taxiData);
            if (data.dashboardData) setDashboardData(data.dashboardData);
            if (data.trajectories) setTrajectories(data.trajectories);
            if (data.hotspotsMapData) setHotspotsMapData(data.hotspotsMapData);
            if (data.distanceDistribution) setDistanceDistribution(data.distanceDistribution);
            if (data.customStart) setCustomStart(data.customStart);
            if (data.customEnd) setCustomEnd(data.customEnd);
            if (data.eventType) setEventType(data.eventType);
            if (data.activeView) setActiveView(data.activeView);
            if (data.selectedVehicle) setSelectedVehicle(data.selectedVehicle);
            if (data.hotspotTab) setHotspotTab(data.hotspotTab);
            setIsLoading(false);
            setIsHeatmapLoading(false);
            setIsFromCache(true);
            setHasRestoredCache(true);
            return;
          }
        } catch (e) {
          // 缓存损坏，忽略
        }
      }
      setHasRestoredCache(true); // 没有缓存也标记，防止后续重复
    }
  }, [hasRestoredCache]);

  // 只在首次加载且无缓存时请求数据
  useEffect(() => {
    if (hasRestoredCache && !isFromCache && !taxiData) {
      // 只请求一次
      setIsLoading(true);
      setIsHeatmapLoading(true);
      fetchTaxiHeatmapData();
      fetchDashboardData();
      fetchHotspotsData();
      fetchDistanceDistribution();
      fetchHotspotsMapData();
    }
  }, [hasRestoredCache, isFromCache]);

  // 地图实例/底图 ready 后不再重复请求数据，只负责渲染
  useEffect(() => {
    if (heatmapMapInstance && taxiData && taxiData.heatmapData) {
      updateHeatmap({ heatmapData: taxiData.heatmapData });
    }
  }, [heatmapMapInstance, taxiData]);

  useEffect(() => {
    // 只要关键数据都加载了就缓存
    if (taxiData && dashboardData && trajectories && hotspotsMapData && distanceDistribution) {
      localStorage.setItem(TAXI_ANALYSIS_CACHE_KEY, JSON.stringify({
        taxiData,
        dashboardData,
        trajectories,
        hotspotsMapData,
        distanceDistribution,
        customStart,
        customEnd,
        eventType,
        activeView,
        selectedVehicle,
        hotspotTab,
        cacheTime: Date.now()
      }));
    }
  }, [taxiData, dashboardData, trajectories, hotspotsMapData, distanceDistribution, customStart, customEnd, eventType, activeView, selectedVehicle, hotspotTab]);

  // 新增：客流量分布相关状态
  const [flowMode, setFlowMode] = useState<'weekly'|'custom'>('weekly');
  const [flowData, setFlowData] = useState<any[]>([]);
  const [flowStats, setFlowStats] = useState<any>(null);
  const [flowLoading, setFlowLoading] = useState(false);
  const FLOW_CACHE_KEY = 'weekly_passenger_flow_cache';

  // 工具函数：补全日期为YYYY-MM-DD HH:mm:ss
  function padDateTime(dt: string, end = false) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dt)) return dt + (end ? ' 23:59:59' : ' 00:00:00');
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dt)) return dt + ':00';
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dt)) return dt;
    return dt;
  }

  // 拉取客流量分布数据
  useEffect(() => {
    let ignore = false;
    async function fetchFlow() {
      setFlowLoading(true);
      if (flowMode === 'weekly') {
        // 先查缓存
        const cache = localStorage.getItem(FLOW_CACHE_KEY);
        if (cache) {
          try {
            const data = JSON.parse(cache);
            if (data && Array.isArray(data.flow_data)) {
              setFlowData(data.flow_data);
              setFlowStats(data.statistics);
              setFlowLoading(false);
              return;
            }
          } catch {}
        }
      }
      // 请求后端
      let url = 'http://localhost:8000/api/weekly-passenger-flow/?mode=' + flowMode;
      if (flowMode === 'custom') {
        url += `&custom_start=${encodeURIComponent(padDateTime(customStart))}`;
        url += `&custom_end=${encodeURIComponent(padDateTime(customEnd, true))}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        setFlowData([]); setFlowStats(null); setFlowLoading(false); return;
      }
      const data = await res.json();
      if (ignore) return;
      setFlowData(data.flow_data || []);
      setFlowStats(data.statistics || null);
      if (flowMode === 'weekly') {
        localStorage.setItem(FLOW_CACHE_KEY, JSON.stringify(data));
      }
      setFlowLoading(false);
    }
    fetchFlow();
    return () => { ignore = true; };
  }, [flowMode, customStart, customEnd]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">出租车数据分析</h2>
          <p className="text-gray-600 mt-1">出租车运营数据分析与可视化展示</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-white rounded-lg shadow-sm"
            onClick={() => {
              fetchTaxiHeatmapData()
              fetchDashboardData()
              fetchHotspotsData()
              fetchDistanceDistribution()
              fetchHotspotsMapData()
            }}
          >
            <Loader2 className="w-4 h-4 mr-2" />刷新数据
          </Button>
          <div className="flex rounded-lg overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-semibold transition-colors focus:outline-none
                ${eventType === 'pickup'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white/70 text-gray-500'}
              `}
              onClick={() => setEventType('pickup')}
              type="button"
              style={{ border: 'none' }}
            >上客</button>
            <button
              className={`px-4 py-2 text-sm font-semibold transition-colors focus:outline-none
                ${eventType === 'dropoff'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white/70 text-gray-500'}
              `}
              onClick={() => setEventType('dropoff')}
              type="button"
              style={{ border: 'none' }}
            >下客</button>
          </div>
        </div>
      </div>



      {/* 控制面板 */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="mb-0">
          <CardTitle className="text-lg font-bold">时间范围</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <CustomRangeSelector
            timelineRange={timelineRange}
            setTimelineRange={setTimelineRange}
            dates={TIMELINE_HALFDAY}
          />
        </CardContent>
      </Card>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">数据总量</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardData?.stats?.total_count?.toLocaleString() ?? "-"}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600"></span>
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
                  {dashboardData?.stats?.active_vehicles?.toLocaleString() ?? "-"}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600"></span>
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
                <p className="text-sm font-medium text-gray-600">平均距离 (km)</p>
                <p className="text-3xl font-bold text-orange-600">
                  {dashboardData?.stats?.avg_distance ?? "-"}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-red-600 rotate-180" />
                  <span className="text-sm text-red-600"></span>
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
                <p className="text-sm font-medium text-gray-600">平均速度 (km/h)</p>
                <p className="text-3xl font-bold text-purple-600">
                  {dashboardData?.stats?.avg_speed ?? "-"}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600"></span>
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
            <CardTitle className="text-xl font-bold">
              出租车{eventType === 'pickup' ? '上客' : '下客'}热力图
            </CardTitle>
            <CardDescription>
              {eventType === 'pickup' ? '上客点密度分布' : '下客点密度分布'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {isHeatmapLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
                    <p className="text-xs text-gray-600">加载地图中...</p>
                    <p className="text-xs text-gray-400">API: 72ea028abc28fc7412f92d884311e74a</p>
                  </div>
                </div>
              )}
              {isFromCache && (
                <div className="absolute top-2 right-2 z-20 text-xs text-green-600 bg-white/80 px-2 py-1 rounded shadow">已从缓存恢复</div>
              )}
              <div ref={mapRef} className="w-full h-96 rounded-xl border" />
              <div className="absolute bottom-2 left-2 text-xs text-gray-400"> </div>
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
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">无</SelectItem>
                  {vehicleIds.map(id => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={fetchTrajectories}>刷新轨迹</Button>
            </div>
            <div className="relative">
              {isTrajectoryLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-blue-600" />
                    <p className="text-xs text-gray-600">加载轨迹中...</p>
                  </div>
                </div>
              )}
              <div ref={trajectoryMapRef} className="w-full h-80 rounded-xl border bg-gradient-to-br from-blue-50 to-cyan-50" />
              <div className="absolute bottom-2 left-2 text-xs text-gray-400"> </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据分析图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold">
                {flowMode === 'weekly' ? '周客流量分布' : '时客流量分布'}
              </CardTitle>
              <CardDescription>
                {flowMode === 'weekly' ? '2013-09-12至2013-09-18七天的客流量分布' : '自定义时间段客流量分布'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={flowMode} onValueChange={v => setFlowMode(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">周客流量分布</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {flowLoading ? (
              <div className="h-64 flex items-center justify-center text-blue-600"><Loader2 className="w-6 h-6 animate-spin mr-2" />加载中...</div>
            ) : (
              <div className="h-64 bg-gradient-to-t from-green-50 to-white rounded-lg flex items-end justify-center p-4 overflow-x-auto">
                <div className="flex items-end space-x-1 h-full w-full">
                  {flowData.length === 0 && <div className="text-gray-400 w-full text-center">暂无数据</div>}
                  {flowData.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col items-center flex-1 min-w-[32px]">
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t"
                        style={{ height: `${(item.count / (flowStats?.max_count || 1)) * 90 + 10}%` }}
                        title={item.count}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">
                        {/* 只显示时:分，避免ValueError */}
                        {item.time?.slice(11, 16) || item.time}
                      </span>
                      <span className="text-xs font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {flowStats && (
              <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-4">
                <span>总数：{flowStats.total_count}</span>
                <span>峰值：{flowStats.max_count}（{flowStats.peak_time?.slice(5, 16)}）</span>
                <span>均值：{flowStats.avg_count}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">路程分布分析</CardTitle>
            <CardDescription>不同距离区间的订单占比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center relative">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#e5e7eb" strokeWidth="16" />
                  {/* 动态渲染各区间的环形进度，支持悬浮高亮 */}
                  {distanceDistribution.map((item, i) => {
                    const total = distanceDistribution.reduce((sum, d) => sum + d.count, 0) || 1
                    const percent = item.count / total
                    const circumference = 2 * Math.PI * 80
                    let prevPercent = distanceDistribution.slice(0, i).reduce((sum, d) => sum + d.count, 0) / total
                    const color =
                      i === 0 ? '#3b82f6' :
                      i === 1 ? '#10b981' :
                      i === 2 ? '#f59e0b' :
                      i === 3 ? '#ef4444' :
                      i === 4 ? '#a21caf' :
                      i === 5 ? '#6366f1' : '#14b8a6'
                    return (
                      <circle
                        key={i}
                        cx="96"
                        cy="96"
                        r="80"
                        fill="none"
                        stroke={color}
                        strokeWidth={hoveredIndex === i ? 24 : 16}
                        strokeDasharray={`${percent * circumference} ${circumference}`}
                        strokeDashoffset={`-${prevPercent * circumference}`}
                        style={{
                          filter: hoveredIndex === i ? 'drop-shadow(0 0 8px #8888)' : undefined,
                          cursor: 'pointer',
                          transition: 'stroke-width 0.2s, filter 0.2s',
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    )
                  })}
                </svg>
                {/* 悬浮气泡 */}
                {hoveredIndex !== null && distanceDistribution[hoveredIndex] && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -120%)',
                      background: '#fff',
                      borderRadius: 12,
                      boxShadow: '0 4px 24px #0002',
                      padding: '16px 22px',
                      zIndex: 10,
                      pointerEvents: 'none',
                      minWidth: 120,
                      textAlign: 'center',
                    }}
                  >
                    <div className="text-base font-bold mb-1 text-blue-700">{distanceDistribution[hoveredIndex].range}</div>
                    <div className="text-sm text-gray-700">订单数：{distanceDistribution[hoveredIndex].count}</div>
                    <div className="text-xs text-gray-500">占比：{distanceDistribution[hoveredIndex].percentage}%</div>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{distanceDistribution.reduce((sum, d) => sum + d.count, 0)}</p>
                    <p className="text-sm text-gray-600">总订单</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {distanceDistribution.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-2"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer', fontWeight: hoveredIndex === i ? 'bold' : undefined }}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    i === 0 ? 'bg-blue-500' : 
                    i === 1 ? 'bg-green-500' : 
                    i === 2 ? 'bg-yellow-500' :
                    i === 3 ? 'bg-red-500' :
                    i === 4 ? 'bg-purple-700' :
                    i === 5 ? 'bg-indigo-500' : 'bg-teal-500'
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
          <CardTitle className="text-xl font-bold">
            {eventType === 'pickup' ? '热门上客区域排行' : '热门下客区域排行'}
          </CardTitle>
          <CardDescription>
            基于GPS记录密度的{eventType === 'pickup' ? '热门上客区域' : '热门下客区域'}统计
          </CardDescription>
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
                <p>暂无{eventType === 'pickup' ? '热门上客区域' : '热门下客区域'}数据</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* 热门上客点聚类地图展示 */}
      <Card className="border-0 shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            {eventType === 'pickup' ? '热门上客点分布图' : '热门下客点分布图'}
          </CardTitle>
          <CardDescription>
            基于聚类分析的前50个{eventType === 'pickup' ? '热门上客点' : '热门下客点'}，点击标记查看详情
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HotspotsMap data={hotspotsMapData} eventType={eventType} />
        </CardContent>
      </Card>
    </div>
  )
}

// 新增：热门上客点聚类地图组件
function HotspotsMap({ data, eventType }: { data: any[], eventType: 'pickup' | 'dropoff' }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const infoWindowRef = useRef<any>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [amapReady, setAmapReady] = useState(false)

  // 动态加载高德地图API
  useEffect(() => {
    if (window.AMap) {
      setAmapReady(true)
      return
    }
    const script = document.createElement("script")
    script.src = `https://webapi.amap.com/maps?v=2.0&key=72ea028abc28fc7412f92d884311e74a&plugin=AMap.HeatMap,AMap.MarkerCluster,AMap.Polyline`
    script.async = true
    document.head.appendChild(script)
    script.onload = () => setAmapReady(true)
    script.onerror = () => setAmapReady(false)
  }, [])

  useEffect(() => {
    if (!amapReady || !mapRef.current) return
    let map: any
    map = new window.AMap.Map(mapRef.current, {
      zoom: 11,
      center: [117.0009, 36.6758],
      mapStyle: "amap://styles/normal",
    })
    setMapInstance(map)
    return () => { if (map) map.destroy && map.destroy() }
  }, [amapReady])

  // 修复：将colorList提升到函数顶部
  const colorList = [
    '#d32f2f', '#fbc02d', '#388e3c', '#1976d2', '#7b1fa2', '#f57c00', '#0288d1', '#c2185b', '#388e3c', '#512da8',
    '#303f9f', '#00796b', '#689f38', '#ffa000', '#cddc39', '#0097a7', '#e64a19', '#5d4037', '#455a64', '#0288d1',
  ]

  // 获取最大orders用于数据环比例
  const maxOrders = data.length > 0 ? Math.max(...data.map(d => d.orders || 1)) : 1

  // 严格分组风格
  function getMarkerStyle(rank: number) {
    if (rank >= 1 && rank <= 5) {
      return {
        group: 'king',
        main1: '#FFD700',
        main2: '#FFA500',
        glow: '#FFFACD',
        base: 48,
        max: 72,
        height: 1.6,
        sides: 5,
        icon: 'crown',
        font: 22,
      }
    } else if (rank >= 6 && rank <= 15) {
      return {
        group: 'hot',
        main1: '#FF4500',
        main2: '#FF6347',
        glow: '#FFA07A',
        base: 36,
        max: 54,
        height: 1.4,
        sides: 4,
        icon: 'flame',
        font: 16,
      }
    } else if (rank >= 16 && rank <= 30) {
      return {
        group: 'potential',
        main1: '#FFA500',
        main2: '#FFD700',
        glow: '#FFE4B5',
        base: 24,
        max: 24,
        height: 1.2,
        sides: 3,
        icon: 'ring',
        font: 12,
      }
    } else {
      return {
        group: 'normal',
        main1: '#1E90FF',
        main2: '#87CEFA',
        glow: '#E6F7FF',
        base: 16,
        max: 16,
        height: 1.0,
        sides: 0,
        icon: 'dot',
        font: 9,
      }
    }
  }

  // 极简美观红旗+数字SVG（旗杆更细，颜色#8B1818）
  function flagSVGWithRankSimple(size: number, rank: number) {
    const flagW = Math.round(size * 0.65)
    const flagH = Math.round(size * 0.45)
    const poleW = Math.max(1, Math.round(size * 0.06))
    const poleH = size * 0.8
    const fontSize = Math.round(flagH * 0.7)
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="${size * 0.13}" y="${size * 0.15}" width="${poleW}" height="${poleH}" rx="${poleW/2}" fill="#8B1818"/>
        <rect x="${size * 0.13 + poleW}" y="${size * 0.15}" width="${flagW}" height="${flagH}" rx="${flagH * 0.18}" fill="#e53935"/>
        <text x="${size * 0.13 + poleW + flagW/2}" y="${size * 0.15 + flagH/2 + fontSize/2.8}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="#fff" style="font-family:inherit;">${rank}</text>
      </svg>
    `
  }

  // 仅大小分组
  function getFlagSize(rank: number) {
    if (rank >= 1 && rank <= 5) return 48
    if (rank >= 6 && rank <= 15) return 36
    if (rank >= 16 && rank <= 30) return 24
    return 16
  }

  // 纯红旗Marker，无动画、无光晕、无数据环
  const markerIcon = (spot: any) => {
    const rank = spot.rank
    const size = getFlagSize(rank)
    return flagSVGWithRankSimple(size, rank)
  }

  useEffect(() => {
    if (!mapInstance || !window.AMap) return
    mapInstance.clearMap()
    data.forEach((spot, idx) => {
      const size = getFlagSize(spot.rank)
      const marker = new window.AMap.Marker({
        position: [spot.lng, spot.lat],
        title: spot.name || `${eventType === 'pickup' ? '热门上客点' : '热门下客点'}#${spot.rank}`,
        content: `<div style='width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;'>${markerIcon(spot)}</div>`,
        offset: new window.AMap.Pixel(-size / 2, -size),
        zIndex: 100 + (50 - spot.rank),
      })
      // 移除setLabel调用，不显示Marker上方悬浮标签
      marker.on('click', () => {
        if (infoWindowRef.current) infoWindowRef.current.close()
        const info = `
          <div style="min-width:220px;max-width:300px;background:#fff;border-radius:14px;box-shadow:0 4px 24px #0002;padding:18px 20px 14px 20px;font-family:inherit;">
            <div style="font-size:18px;font-weight:bold;color:${colorList[idx % colorList.length]};margin-bottom:6px;display:flex;align-items:center;">
              <span style="margin-right:8px;">#${spot.rank}</span> ${spot.name || '未知地点'}
            </div>
            <div style="border-top:1px solid #eee;margin:8px 0 10px 0;"></div>
            <div style="font-size:15px;margin-bottom:4px;"><b>订单数：</b>${spot.orders}</div>
            <div style="font-size:14px;color:#666;margin-bottom:2px;">
              <span style="margin-right:12px;">🚕 <b>平均速度：</b>${spot.avgSpeed} km/h</span>
              <span>🧑‍💼 <b>载客率：</b>${spot.occupancyRate}%</span>
            </div>
            <div style="font-size:13px;color:#aaa;margin-top:6px;">📍 ${spot.lat.toFixed(5)}, ${spot.lng.toFixed(5)}</div>
            <div style="font-size:13px;color:#888;margin-top:6px;">${eventType === 'pickup' ? '上客点' : '下客点'}</div>
          </div>
        `
        const infoWindow = new window.AMap.InfoWindow({
          content: info,
          offset: new window.AMap.Pixel(0, -38)
        })
        infoWindow.open(mapInstance, [spot.lng, spot.lat])
        infoWindowRef.current = infoWindow
      })
      mapInstance.add(marker)
    })
  }, [mapInstance, data, eventType])


  return (
    <div style={{ position: 'relative', width: '100%', height: 400, borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: 32 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', bottom: 8, left: 12, fontSize: 12, color: '#888' }}> </div>
    </div>
  )
}

// 自定义区间选择器组件
function CustomRangeSelector({ timelineRange, setTimelineRange, dates }: { timelineRange: [number, number], setTimelineRange: (r: [number, number]) => void, dates: string[] }) {
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // 计算当前高亮区间
  const highlightRange = isDragging && dragStart !== null && dragEnd !== null
    ? [Math.min(dragStart, dragEnd), Math.max(dragStart, dragEnd)] as [number, number]
    : timelineRange

  // 鼠标事件
  const handleMouseDown = (idx: number) => {
    setDragStart(idx)
    setDragEnd(idx)
    setIsDragging(true)
  }
  const handleMouseEnter = (idx: number) => {
    if (isDragging) setDragEnd(idx)
  }
  const handleMouseUp = () => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      setTimelineRange([Math.min(dragStart, dragEnd), Math.max(dragStart, dragEnd)])
    }
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  // 轨道和 marks
  return (
    <div
      style={{ width: '100%', padding: '8px 0 0 0', userSelect: 'none', cursor: isDragging ? 'pointer' : 'default' }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 轨道 */}
      <div style={{ position: 'relative', height: 60, margin: '0 8px' }}>
        {/* 背景轨道 */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 32,
          height: 18,
          borderRadius: 9,
          background: 'linear-gradient(90deg,#e0e7ef 0%,#f3f4f6 100%)',
          boxShadow: '0 2px 8px #0001',
        }} />
        {/* 高亮区间 */}
        <div style={{
          position: 'absolute',
          left: `${(highlightRange[0]) / (dates.length - 1) * 100}%`,
          width: `${(highlightRange[1] - highlightRange[0]) / (dates.length - 1) * 100}%`,
          top: 32,
          height: 18,
          borderRadius: 9,
          background: 'linear-gradient(90deg,#3b82f6 0%,#06b6d4 100%)',
          boxShadow: '0 2px 12px #3b82f633',
          transition: isDragging ? 'none' : 'left 0.2s, width 0.2s',
        }} />
        {/* 日期文字（只在整天节点显示，半天节点不显示） */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 28, display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
          {dates.map((date, idx) => (
            (idx % 2 === 0 || idx === dates.length - 1) ? (
              <span
                key={date}
                style={{
                  color: idx >= highlightRange[0] && idx <= highlightRange[1] ? '#2563eb' : '#a3a3a3',
                  fontWeight: idx >= highlightRange[0] && idx <= highlightRange[1] ? 700 : 400,
                  fontSize: 16,
                  minWidth: 44,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  transition: 'color 0.2s,font-weight 0.2s',
                  letterSpacing: 1,
                  cursor: 'pointer',
                }}>{date.slice(5, 10)}</span>
            ) : (
              <span key={date} style={{ minWidth: 44 }}></span>
            )
          ))}
        </div>
        {/* 鼠标交互区域（条） */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 34,
            height: 32,
            zIndex: 3,
            cursor: isDragging ? 'pointer' : 'crosshair',
          }}
          onMouseDown={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const idx = Math.round(x / rect.width * (dates.length - 1));
            handleMouseDown(idx);
          }}
          onMouseMove={e => {
            if (!isDragging) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            let idx = Math.round(x / rect.width * (dates.length - 1));
            idx = Math.max(0, Math.min(dates.length - 1, idx));
            handleMouseEnter(idx);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 背景条 */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 10,
            height: 12,
            borderRadius: 6,
            background: isDragging ? 'linear-gradient(90deg,#e0e7ef 0%,#c7d2fe 100%)' : 'linear-gradient(90deg,#e0e7ef 0%,#f3f4f6 100%)',
            boxShadow: '0 2px 8px #0001',
            transition: 'background 0.2s',
          }} />
          {/* 高亮区间条 */}
          <div style={{
            position: 'absolute',
            left: `${(highlightRange[0]) / (dates.length - 1) * 100}%`,
            width: `${(highlightRange[1] - highlightRange[0]) / (dates.length - 1) * 100}%`,
            top: 10,
            height: 12,
            borderRadius: 6,
            background: 'linear-gradient(90deg,#3b82f6 0%,#06b6d4 100%)',
            boxShadow: '0 2px 12px #3b82f633',
            transition: isDragging ? 'none' : 'left 0.2s, width 0.2s',
          }} />
        </div>
      </div>
    </div>
  )
}
