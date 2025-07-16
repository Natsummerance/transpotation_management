"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Eye, Layers, Filter, Calendar, Loader2, Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider"

// 声明高德地图全局变量
declare global {
  interface Window {
    AMap: any
  }
}

// 工具函数：格式化为 'YYYY-MM-DD HH:mm:ss'
function formatDateTime(dt: Date | string) {
  if (typeof dt === 'string') {
    // 已经是字符串，尝试转为 Date
    const d = new Date(dt)
    if (isNaN(d.getTime())) return dt // 不是有效日期，直接返回原字符串
    dt = d
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

export default function MapAnalysisModule() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("today")
  const [selectedLayer, setSelectedLayer] = useState("none")  // 默认无图层
  const [currentTime, setCurrentTime] = useState("2013-09-12 00:00:00")  // 时间轴当前时间，初始为0点
  const [isPlaying, setIsPlaying] = useState(false)  // 时间轴播放状态
  // 10分钟一格的时间点
  const tenMinuteSteps = Array.from({ length: 144 }, (_, i) => i);
  const [timeSliderValue, setTimeSliderValue] = useState([0])  // 默认0点
  const [availableHours, setAvailableHours] = useState<number[]>([])  // 可用的时间点
  const [isLoading, setIsLoading] = useState(true)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // 新增：道路病害点数据和弹窗状态
  const [damagePoints, setDamagePoints] = useState<any[]>([]);
  const [selectedDamage, setSelectedDamage] = useState<any | null>(null);

  // 新增：车辆位置热力图实例引用
  const vehicleHeatmapRef = useRef<any>(null)

  // 秒级时间轴（轨迹图专用）
  const secondSteps = Array.from({ length: 86400 }, (_, i) => i);
  const [secondSliderValue, setSecondSliderValue] = useState([0]); // 轨迹图秒级滑块
  const [trajectoryPoints, setTrajectoryPoints] = useState<any[]>([]); // 当前秒所有车辆点
  const trajectoryMarkersRef = useRef<any[]>([]); // 轨迹点Marker引用
  const [selectedCarPlate, setSelectedCarPlate] = useState<string | null>(null); // 当前选中车牌

  // 加载高德地图和数据
  useEffect(() => {
    const loadMapAndData = async () => {
      try {
        // 加载高德地图API
        if (!window.AMap) {
          const script = document.createElement("script")
          script.src = `https://webapi.amap.com/maps?v=2.0&key=c6115796bfbad53bd639041995b5b123&plugin=AMap.HeatMap,AMap.MarkerCluster`
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
      // 统一格式化时间参数
      let params = new URLSearchParams({
        timeRange: selectedTimeRange,
        layer: selectedLayer
      });
      if (selectedLayer === "vehicle_heatmap" && currentTime) {
        params.append('current_time', formatDateTime(currentTime));
      }
      // 其它图层如 trajectory_points 也需要 current_time
      if (selectedLayer === "trajectory_points" && currentTime) {
        params.append('current_time', formatDateTime(currentTime));
      }
      // 其它需要自定义时间范围的情况
      // TODO: 如果后端需要 start_time/end_time，需补充
      const response = await fetch(`/api/analysis/spatiotemporal?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysisData(data)
        updateMapVisualization(data)
      } else {
        console.error("API response not ok:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch analysis data:", error)
    }
  }

  // 新增：获取所有道路病害点
  const fetchDamagePoints = useCallback(async () => {
    try {
      const res = await fetch("/api/report/damage?page=1&limit=100&type=all");
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setDamagePoints(data.data.filter((d:any)=>d.totalCount>0));
      }
    } catch (e) {
      setDamagePoints([]);
    }
  }, []);

  // 新增：切换到道路病害图层时加载数据
  useEffect(() => {
    if (selectedLayer === "damage") {
      fetchDamagePoints();
    }
  }, [selectedLayer, fetchDamagePoints]);

  // 更新地图可视化
  const updateMapVisualization = (data: any) => {
    if (!mapInstance) return;
    mapInstance.clearMap();
    
    // 无图层类型，只显示基础地图
    if (selectedLayer === "none") {
      return;
    }
    
    if (selectedLayer === "damage") {
      // 绘制道路病害点
      damagePoints.forEach((point) => {
        // 统一为红色发光感叹号图标
        const canvas = document.createElement("canvas");
        canvas.width = 40; canvas.height = 40;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // 红色圆底
          ctx.beginPath();
          ctx.arc(20, 20, 16, 0, 2 * Math.PI);
          ctx.fillStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 16;
          ctx.fill();
          // 白色感叹号
          ctx.font = "bold 22px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#fff";
          ctx.fillText("!", 20, 22);
        }
        const marker = new window.AMap.Marker({
          position: [point.location_lng, point.location_lat],
          title: point.mainDamageType,
          icon: new window.AMap.Icon({
            image: canvas.toDataURL(),
            size: new window.AMap.Size(40, 40),
            imageSize: new window.AMap.Size(40, 40),
          }),
          offset: new window.AMap.Pixel(-20, -20),
        });
        marker.on("click", () => setSelectedDamage(point));
        mapInstance.add(marker);
      });
      // 自动缩放到所有点
      if (damagePoints.length > 0) {
        mapInstance.setFitView();
      }
      return;
    }

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
    } else if (selectedLayer === "vehicle_heatmap") {
      // 车辆位置热力图
      // 1. 清理上一个实例
      if (vehicleHeatmapRef.current) {
        vehicleHeatmapRef.current.setMap(null);
        vehicleHeatmapRef.current = null;
      }
      const vehicleHeatmapData =
        data.layerData?.vehicleHeatmapPoints?.map((point: any) => ({
          lng: point.longitude,
          lat: point.latitude,
          count: point.intensity,
        })) || []

      console.log("车辆热力图数据:", vehicleHeatmapData.length, "个点");
      if (vehicleHeatmapData.length > 0) {
        console.log("示例热力图点:", vehicleHeatmapData[0]);
        
        const heatmap = new window.AMap.HeatMap(mapInstance, {
          radius: 20,
          opacity: [0, 0.9],
          gradient: {
            0.4: "blue",
            0.6: "cyan",
            0.7: "lime",
            0.8: "yellow",
            1.0: "red",
          },
        })

        heatmap.setDataSet({
          data: vehicleHeatmapData,
          max: 50,
        })
        // 2. 保存实例
        vehicleHeatmapRef.current = heatmap;
      } else {
        console.log("没有车辆热力图数据");
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

  // 时间轴播放功能
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && selectedLayer === "vehicle_heatmap") {
      interval = setInterval(() => {
        setTimeSliderValue(prev => {
          const nextIdx = (prev[0] + 1) % 144;
          const hour = Math.floor(nextIdx / 6);
          const minute = (nextIdx % 6) * 10;
          const newTime = `2013-09-12 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
          setCurrentTime(newTime);
          return [nextIdx];
        });
      }, 2000); // 每2秒更新一次
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPlaying, selectedLayer]);

  // 时间滑块变化时更新当前时间
  useEffect(() => {
    if (selectedLayer === "vehicle_heatmap") {
      const idx = timeSliderValue[0];
      const hour = Math.floor(idx / 6);
      const minute = (idx % 6) * 10;
      const newTime = `2013-09-12 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      setCurrentTime(newTime);
    }
  }, [timeSliderValue, selectedLayer]);

  // 获取可用时间点
  const fetchAvailableHours = async () => {
    try {
      const response = await fetch('/api/analysis/spatiotemporal?timeRange=today&layer=vehicle_heatmap&current_time=2013-09-12 12:00:00');
      if (response.ok) {
        const data = await response.json();
        // 生成0-23小时的时间点
        const hours = Array.from({length: 24}, (_, i) => i);
        setAvailableHours(hours);
      }
    } catch (error) {
      console.error("Failed to fetch available hours:", error);
    }
  };

  // 重新获取数据
  useEffect(() => {
    if (mapInstance) {
      if (selectedLayer === "none") {
        updateMapVisualization({});
      } else if (selectedLayer === "damage") {
        updateMapVisualization({});
      } else {
        fetchAnalysisData();
      }
    }
  }, [selectedLayer, mapInstance, damagePoints, currentTime]);

  // 秒转时间字符串
  function secondToTimeStr(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `2013-09-12 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // 轨迹图：请求所有车辆当前秒的点
  useEffect(() => {
    if (selectedLayer === 'trajectory' && mapInstance) {
      const sec = secondSliderValue[0];
      const timeStr = secondToTimeStr(sec);
      fetch(`/api/analysis/spatiotemporal?layer=trajectory_points&current_time=${encodeURIComponent(timeStr)}`)
        .then(res => res.json())
        .then(data => {
          setTrajectoryPoints(data.layerData?.trajectoryPoints || []);
        });
    }
  }, [selectedLayer, secondSliderValue, mapInstance]);

  // 轨迹图：渲染所有车辆点（小箭头+方向+悬停显示车牌+点击高亮）
  useEffect(() => {
    if (selectedLayer === 'trajectory' && mapInstance) {
      // 清除旧点
      trajectoryMarkersRef.current.forEach(marker => marker.setMap(null));
      trajectoryMarkersRef.current = [];
      // 添加新点
      trajectoryPoints.forEach((pt, idx) => {
        // 箭头SVG，选中高亮变红色
        const isSelected = selectedCarPlate === pt.car_plate;
        const arrowIconUrl =
          'data:image/svg+xml;utf8,' +
          encodeURIComponent(`
            <svg width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">
              <g transform=\"rotate(${pt.heading || 0},16,16)\">
                <polygon points=\"16,4 28,28 16,22 4,28\" fill=\"${isSelected ? '#ef4444' : '#2563eb'}\" stroke=\"#fff\" stroke-width=\"2\"/>
              </g>
            </svg>
          `);
        const marker = new window.AMap.Marker({
          position: [pt.lng, pt.lat],
          title: pt.car_plate,
          icon: new window.AMap.Icon({
            image: arrowIconUrl,
            size: new window.AMap.Size(32, 32),
            imageSize: new window.AMap.Size(32, 32),
          }),
          offset: new window.AMap.Pixel(-16, -16),
        });
        // 鼠标悬停显示气泡
        marker.on('mouseover', () => {
          marker.setLabel({
            direction: 'top',
            offset: new window.AMap.Pixel(0, -20),
            content: `<div style=\"background:#fff;border-radius:4px;padding:2px 8px;font-size:13px;border:1px solid #2563eb;color:#2563eb;box-shadow:0 2px 8px #0001;\">${pt.car_plate}</div>`
          });
        });
        marker.on('mouseout', () => {
          marker.setLabel(null);
        });
        // 点击高亮/取消高亮
        marker.on('click', () => {
          setSelectedCarPlate(prev => prev === pt.car_plate ? null : pt.car_plate);
        });
        marker.setMap(mapInstance);
        trajectoryMarkersRef.current.push(marker);
      });
    }
  }, [trajectoryPoints, selectedLayer, mapInstance, selectedCarPlate]);

  // 图层切换时清除所有地图元素，只显示当前图层内容
  useEffect(() => {
    if (!mapInstance) return;
    // 清除所有Marker和热力图
    if (vehicleHeatmapRef.current) {
      vehicleHeatmapRef.current.setMap(null);
      vehicleHeatmapRef.current = null;
    }
    trajectoryMarkersRef.current.forEach(marker => marker.setMap(null));
    trajectoryMarkersRef.current = [];
    // 只保留底图
    if (selectedLayer === 'none') {
      mapInstance.clearMap();
    }
  }, [selectedLayer, mapInstance]);

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
                  <SelectItem value="none">无</SelectItem>
                  <SelectItem value="vehicle_heatmap">热力图</SelectItem>
                  <SelectItem value="trajectory">轨迹图</SelectItem>
                  <SelectItem value="damage">道路病害</SelectItem>
                  {/*
                  <SelectItem value="heatmap">车辆位置热力图</SelectItem>
                  <SelectItem value="hotspots">热门上客点</SelectItem>
                  <SelectItem value="flow">客流分析</SelectItem>*/}
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
            {selectedLayer === "vehicle_heatmap" && (
              <div className="flex items-center space-x-4 w-full">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setTimeSliderValue([Math.max(0, timeSliderValue[0] - 1)]);
                    }}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setTimeSliderValue([Math.min(143, timeSliderValue[0] + 1)]);
                    }}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1 flex items-center space-x-4">
                  <span className="text-sm text-gray-600 whitespace-nowrap">00:00</span>
                  <div className="flex-1">
                    <Slider
                      value={timeSliderValue}
                      onValueChange={setTimeSliderValue}
                      max={143}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap">23:50</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {(() => {
                      const idx = timeSliderValue[0];
                      const hour = Math.floor(idx / 6);
                      const minute = (idx % 6) * 10;
                      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    })()}
                  </span>
                  <Input
                    type="datetime-local"
                    value={currentTime.replace(' ', 'T')}
                    onChange={(e) => {
                      const newTime = e.target.value.replace('T', ' ');
                      setCurrentTime(newTime);
                      const [h, m] = newTime.split(' ')[1].split(':');
                      const idx = parseInt(h) * 6 + Math.floor(parseInt(m) / 10);
                      setTimeSliderValue([idx]);
                    }}
                    className="w-48"
                  />
                </div>
              </div>
            )}
            {selectedLayer === "trajectory" && (
              <div className="flex items-center space-x-4 w-full">
                <span className="text-sm text-gray-600 whitespace-nowrap">00:00:00</span>
                <div className="flex-1">
                  <Slider
                    value={secondSliderValue}
                    onValueChange={setSecondSliderValue}
                    max={86399}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
                <span className="text-sm text-gray-600 whitespace-nowrap">23:59:59</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {(() => {
                      const sec = secondSliderValue[0];
                      const h = Math.floor(sec / 3600);
                      const m = Math.floor((sec % 3600) / 60);
                      const s = sec % 60;
                      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    })()}
                  </span>
                  <Input
                    type="time"
                    step="1"
                    value={(() => {
                      const sec = secondSliderValue[0];
                      const h = Math.floor(sec / 3600);
                      const m = Math.floor((sec % 3600) / 60);
                      const s = sec % 60;
                      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    })()}
                    onChange={e => {
                      const [h, m, s] = e.target.value.split(":").map(Number);
                      setSecondSliderValue([h * 3600 + m * 60 + s]);
                    }}
                    className="w-28"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 高德地图显示区域 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">济南市交通时空分析地图</CardTitle>
          <CardDescription>
            当前显示:{" "}
            {selectedLayer === "none"
              ? "基础地图"
              : selectedLayer === "heatmap"
                ? "出租车热力图"
                : selectedLayer === "vehicle_heatmap"
                  ? `车辆位置热力图 (${currentTime})`
                  : selectedLayer === "trajectory"
                    ? "乘客轨迹分析"
                    : selectedLayer === "hotspots"
                      ? "热门上客点分布"
                      : selectedLayer === "damage"
                        ? "道路病害分布"
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
                  <p className="text-xs text-gray-400 mt-1">API Key: c6115796bfbad53bd639041995b5b123</p>
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

      {/* 新增：道路病害详情弹窗 */}
      <Dialog open={!!selectedDamage} onOpenChange={() => setSelectedDamage(null)}>
        <DialogContent style={{zIndex: 9999}} className="max-w-md p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border-0">
          {/* 弹窗头部已移除，内容直接开始 */}
          {selectedDamage && (
            <div className="px-6 pb-6 pt-2 space-y-4">
              <div className="text-center text-lg font-bold text-gray-900 mb-2">详情</div>
              {/* 类型标签放到最顶端 */}
              {selectedDamage.results && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(selectedDamage.results).map(([type, data]: [string, any]) => (
                    data.count > 0 ? (
                      <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{background: type==='D0纵向裂缝'? '#fee2e2': type==='D1横向裂缝'? '#fef9c3': type==='D20龟裂'? '#cffafe': type==='D40坑洼'? '#f3e8ff':'#e0e7ef', color: type==='D0纵向裂缝'? '#b91c1c': type==='D1横向裂缝'? '#b45309': type==='D20龟裂'? '#0e7490': type==='D40坑洼'? '#7c3aed':'#334155'}}>
                        {type} <b className="ml-1 text-base">{data.count}</b>
                      </span>
                    ) : null
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">数量</span>
                  <span className="text-lg font-bold text-blue-600">{selectedDamage.totalCount}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">置信度</span>
                  <span className="text-lg font-bold text-purple-600">{(selectedDamage.avgConfidence*100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="text-xs text-gray-500 truncate"><b>地址：</b>{selectedDamage.address}</div>
                <div className="text-xs text-gray-400 truncate"><b>时间：</b>{new Date(selectedDamage.timestamp).toLocaleString()}</div>
              </div>
              {selectedDamage.result_image && (
                <div className="w-full flex justify-center items-center bg-gray-50 rounded-xl mt-2 overflow-hidden group transition-all duration-300" style={{height:'auto', padding:'0'}}>
                  <img
                    src={selectedDamage.result_image}
                    alt="病害图片"
                    className="object-contain max-w-full max-h-60 transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:shadow-2xl group-hover:border-blue-400 group-hover:border-2 rounded-xl cursor-zoom-in"
                    style={{display:'block', margin:'0 auto', width:'100%', height:'100%'}}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
