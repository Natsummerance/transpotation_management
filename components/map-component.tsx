"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ZoomIn, ZoomOut, Maximize2, Navigation, X, Loader2 } from "lucide-react"

interface MapPoint {
  id: string
  lat: number
  lng: number
  type: "hazard" | "traffic" | "camera"
  title: string
  description: string
  status?: string
  severity?: string
  data?: any
}

interface MapComponentProps {
  points: MapPoint[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  onPointClick?: (point: MapPoint) => void
  showHeatmap?: boolean
  mapType?: "normal" | "satellite"
}

// 声明高德地图全局变量
declare global {
  interface Window {
    AMap: any
    AMapLoader: any
  }
}

export default function MapComponent({
  points,
  center = { lat: 36.6758, lng: 117.0009 }, // 济南市中心
  zoom = 12,
  height = "400px",
  onPointClick,
  showHeatmap = false,
  mapType = "normal",
}: MapComponentProps) {
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [mapCenter, setMapCenter] = useState(center)
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])

  // 加载高德地图
  useEffect(() => {
    const loadAMap = async () => {
      try {
        // 动态加载高德地图API
        if (!window.AMap) {
          const script = document.createElement("script")
          script.src = `https://webapi.amap.com/maps?v=2.0&key=4c0958011b7f86aca896a60d37f1d7c5&plugin=AMap.Scale,AMap.ToolBar,AMap.ControlBar,AMap.HeatMap`
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
            zoom: currentZoom,
            center: [mapCenter.lng, mapCenter.lat],
            mapStyle: mapType === "satellite" ? "amap://styles/satellite" : "amap://styles/normal",
            features: ["bg", "road", "building", "point"],
            viewMode: "2D",
          })

          // 添加控件
          map.addControl(new window.AMap.Scale())
          map.addControl(
            new window.AMap.ToolBar({
              position: {
                top: "10px",
                right: "10px",
              },
            }),
          )

          // 监听地图事件
          map.on("zoomchange", () => {
            setCurrentZoom(map.getZoom())
          })

          map.on("moveend", () => {
            const center = map.getCenter()
            setMapCenter({ lat: center.lat, lng: center.lng })
          })

          setMapInstance(map)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Failed to load AMap:", error)
        setIsLoading(false)
      }
    }

    loadAMap()

    // 清理函数
    return () => {
      if (mapInstance) {
        mapInstance.destroy()
      }
    }
  }, [])

  // 更新地图点位
  useEffect(() => {
    if (!mapInstance || !points.length) return

    // 清除现有标记
    markersRef.current.forEach((marker) => {
      mapInstance.remove(marker)
    })
    markersRef.current = []

    // 添加新标记
    points.forEach((point) => {
      const iconUrl = getMarkerIcon(point.type, point.severity)

      const marker = new window.AMap.Marker({
        position: [point.lng, point.lat],
        icon: new window.AMap.Icon({
          image: iconUrl,
          size: new window.AMap.Size(32, 32),
          imageSize: new window.AMap.Size(32, 32),
        }),
        title: point.title,
        extData: point,
      })

      // 添加点击事件
      marker.on("click", () => {
        setSelectedPoint(point)
        onPointClick?.(point)
      })

      mapInstance.add(marker)
      markersRef.current.push(marker)
    })

    // 添加热力图
    if (showHeatmap && points.length > 0) {
      const heatmapData = points.map((point) => ({
        lng: point.lng,
        lat: point.lat,
        count: point.type === "traffic" ? 50 : point.severity === "高" ? 80 : 30,
      }))

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
  }, [mapInstance, points, showHeatmap])

  // 调用地图数据接口 GET /api/map/data
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch(`/api/map/data?start=${Date.now() - 86400000}&end=${Date.now()}`)
        if (response.ok) {
          const data = await response.json()
          console.log("Map data loaded:", data)
        }
      } catch (error) {
        console.error("Failed to load map data:", error)
      }
    }

    fetchMapData()
  }, [])

  const getMarkerIcon = (type: string, severity?: string) => {
    // 返回自定义图标的data URL或使用默认图标
    const canvas = document.createElement("canvas")
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext("2d")

    if (ctx) {
      // 绘制圆形背景
      ctx.beginPath()
      ctx.arc(16, 16, 14, 0, 2 * Math.PI)

      // 根据类型和严重程度设置颜色
      if (type === "hazard") {
        ctx.fillStyle = severity === "高" ? "#ef4444" : severity === "中" ? "#f97316" : "#3b82f6"
      } else if (type === "traffic") {
        ctx.fillStyle = "#3b82f6"
      } else if (type === "camera") {
        ctx.fillStyle = "#10b981"
      } else {
        ctx.fillStyle = "#6b7280"
      }

      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // 绘制图标
      ctx.fillStyle = "#ffffff"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const iconText = type === "hazard" ? "⚠" : type === "traffic" ? "🚗" : "📷"
      ctx.fillText(iconText, 16, 16)
    }

    return canvas.toDataURL()
  }

  const zoomIn = () => {
    if (mapInstance) {
      mapInstance.zoomIn()
    }
  }

  const zoomOut = () => {
    if (mapInstance) {
      mapInstance.zoomOut()
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}>
      <div
        className="relative bg-gradient-to-br from-slate-100 to-blue-100 rounded-lg sm:rounded-xl overflow-hidden border-0 shadow-inner"
        style={{ height: isFullscreen ? "100vh" : height }}
      >
        {/* Loading状态 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-30">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">加载高德地图中...</p>
              <p className="text-xs text-gray-400 mt-1">API Key: 4c0958011b7f86aca896a60d37f1d7c5</p>
            </div>
          </div>
        )}

        {/* 高德地图容器 */}
        <div ref={mapRef} className="w-full h-full" />

        {/* 选中点位详情弹窗 - 移动端优化 */}
        {selectedPoint && (
          <div
            className="absolute inset-0 bg-black/20 flex items-center justify-center z-30 p-4"
            onClick={() => setSelectedPoint(null)}
          >
            <div
              className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border-0 p-4 sm:p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h4 className="font-bold text-base sm:text-lg text-gray-900">{selectedPoint.title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPoint(null)}
                  className="text-gray-400 hover:text-gray-600 h-6 w-6 sm:h-8 sm:w-8 p-0"
                >
                  <X className="w-3 sm:w-4 h-3 sm:h-4" />
                </Button>
              </div>
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{selectedPoint.description}</p>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                {selectedPoint.status && (
                  <Badge variant="outline" className="text-xs">
                    {selectedPoint.status}
                  </Badge>
                )}
                {selectedPoint.severity && (
                  <Badge variant="destructive" className="text-xs">
                    {selectedPoint.severity}危险
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button size="sm" variant="outline" className="flex-1 bg-transparent text-sm">
                  查看详情
                </Button>
                <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
                  立即处理
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 地图控制按钮 - 移动端优化 */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col space-y-1 sm:space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="bg-white/90 backdrop-blur-sm border-0 shadow-lg h-8 w-8 sm:h-10 sm:w-10 p-0"
          >
            <Maximize2 className="w-3 sm:w-4 h-3 sm:h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={zoomIn}
            className="bg-white/90 backdrop-blur-sm border-0 shadow-lg h-8 w-8 sm:h-10 sm:w-10 p-0"
          >
            <ZoomIn className="w-3 sm:w-4 h-3 sm:h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={zoomOut}
            className="bg-white/90 backdrop-blur-sm border-0 shadow-lg h-8 w-8 sm:h-10 sm:w-10 p-0"
          >
            <ZoomOut className="w-3 sm:w-4 h-3 sm:h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-white/90 backdrop-blur-sm border-0 shadow-lg h-8 w-8 sm:h-10 sm:w-10 p-0"
          >
            <Navigation className="w-3 sm:w-4 h-3 sm:h-4" />
          </Button>
        </div>

        {/* 缩放级别显示 - 移动端优化 */}
        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs text-gray-600 shadow-lg border-0">
          缩放级别: {Math.round(currentZoom)}
        </div>

        {/* 图例 - 移动端优化 */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg border-0">
          <h5 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-900">图例</h5>
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
              <div className="w-3 sm:w-4 h-3 sm:h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-sm"></div>
              <span className="text-gray-700">道路危害</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
              <div className="w-3 sm:w-4 h-3 sm:h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-sm"></div>
              <span className="text-gray-700">车流监控</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
              <div className="w-3 sm:w-4 h-3 sm:h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-sm"></div>
              <span className="text-gray-700">违章摄像</span>
            </div>
          </div>
        </div>

        {/* 高德地图版权信息 */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">© 高德地图</div>
      </div>
    </div>
  )
}
