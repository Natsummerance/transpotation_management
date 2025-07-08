"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Camera, Car, AlertTriangle, ZoomIn, ZoomOut, Maximize2, Navigation, X, Loader2 } from "lucide-react"

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

export default function MapComponent({
  points,
  center = { lat: 39.9042, lng: 116.4074 },
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
  const [isLoading, setIsLoading] = useState(false)

  // 调用地图数据接口 GET /api/map/data
  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/map/data?start=${Date.now() - 86400000}&end=${Date.now()}`)
        if (response.ok) {
          const data = await response.json()
          console.log("Map data loaded:", data)
        }
      } catch (error) {
        console.error("Failed to load map data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMapData()
  }, [])

  const getPointIcon = (type: string) => {
    switch (type) {
      case "hazard":
        return <AlertTriangle className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
      case "traffic":
        return <Car className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
      case "camera":
        return <Camera className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
      default:
        return <MapPin className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
    }
  }

  const getPointColor = (point: MapPoint) => {
    if (point.type === "hazard") {
      switch (point.severity) {
        case "高":
          return "from-red-500 to-pink-500"
        case "中":
          return "from-orange-500 to-yellow-500"
        case "低":
          return "from-blue-500 to-cyan-500"
        default:
          return "from-gray-500 to-gray-600"
      }
    }
    if (point.type === "traffic") {
      return "from-blue-500 to-cyan-500"
    }
    if (point.type === "camera") {
      return "from-green-500 to-emerald-500"
    }
    return "from-gray-500 to-gray-600"
  }

  const handlePointClick = (point: MapPoint) => {
    setSelectedPoint(point)
    onPointClick?.(point)
  }

  const zoomIn = () => {
    setCurrentZoom(Math.min(currentZoom + 1, 18))
  }

  const zoomOut = () => {
    setCurrentZoom(Math.max(currentZoom - 1, 3))
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
              <p className="text-sm text-gray-600">加载地图数据中...</p>
              <p className="text-xs text-gray-400 mt-1">调用 /api/map/data</p>
            </div>
          </div>
        )}

        {/* 地图背景 */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-blue-50 relative">
            {/* 模拟街道网格 */}
            <svg className="absolute inset-0 w-full h-full opacity-30">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* 主要道路 */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-0 right-0 h-2 sm:h-3 bg-gradient-to-r from-gray-300 to-gray-400 opacity-80 rounded-full shadow-sm"></div>
              <div className="absolute top-1/2 left-0 right-0 h-3 sm:h-4 bg-gradient-to-r from-gray-400 to-gray-500 opacity-90 rounded-full shadow-md"></div>
              <div className="absolute top-3/4 left-0 right-0 h-2 sm:h-3 bg-gradient-to-r from-gray-300 to-gray-400 opacity-80 rounded-full shadow-sm"></div>
              <div className="absolute left-1/4 top-0 bottom-0 w-2 sm:w-3 bg-gradient-to-b from-gray-300 to-gray-400 opacity-80 rounded-full shadow-sm"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-3 sm:w-4 bg-gradient-to-b from-gray-400 to-gray-500 opacity-90 rounded-full shadow-md"></div>
              <div className="absolute left-3/4 top-0 bottom-0 w-2 sm:w-3 bg-gradient-to-b from-gray-300 to-gray-400 opacity-80 rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>

        {/* 热力图层 */}
        {showHeatmap && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/3 w-16 sm:w-24 h-16 sm:h-24 bg-red-400 opacity-40 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 w-12 sm:w-20 h-12 sm:h-20 bg-orange-400 opacity-35 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute top-2/3 left-2/3 w-10 sm:w-16 h-10 sm:h-16 bg-yellow-400 opacity-30 rounded-full blur-xl animate-pulse delay-2000"></div>
          </div>
        )}

        {/* 地图点位 */}
        {points.map((point) => {
          const x = (point.lng - mapCenter.lng) * 1000 + 50 + "%"
          const y = (mapCenter.lat - point.lat) * 1000 + 50 + "%"

          return (
            <div
              key={point.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{ left: x, top: y }}
              onClick={() => handlePointClick(point)}
            >
              <div
                className={`w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r ${getPointColor(point)} rounded-full flex items-center justify-center shadow-lg hover:scale-125 transition-all duration-300 border-2 border-white`}
              >
                {getPointIcon(point.type)}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                <div className="w-1 sm:w-2 h-1 sm:h-2 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          )
        })}

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
          缩放级别: {currentZoom}
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
      </div>
    </div>
  )
}
