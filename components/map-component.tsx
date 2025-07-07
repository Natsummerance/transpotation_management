"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Camera, Car, AlertTriangle, ZoomIn, ZoomOut, Maximize2, Navigation } from "lucide-react"

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

  const getPointIcon = (type: string) => {
    switch (type) {
      case "hazard":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "traffic":
        return <Car className="w-4 h-4 text-blue-600" />
      case "camera":
        return <Camera className="w-4 h-4 text-green-600" />
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />
    }
  }

  const getPointColor = (point: MapPoint) => {
    if (point.type === "hazard") {
      switch (point.severity) {
        case "高":
          return "bg-red-500"
        case "中":
          return "bg-orange-500"
        case "低":
          return "bg-yellow-500"
        default:
          return "bg-gray-500"
      }
    }
    if (point.type === "traffic") {
      return "bg-blue-500"
    }
    if (point.type === "camera") {
      return "bg-green-500"
    }
    return "bg-gray-500"
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
        className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden border"
        style={{ height: isFullscreen ? "100vh" : height }}
      >
        {/* 地图背景 */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 relative">
            {/* 模拟街道网格 */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* 主要道路 */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-0 right-0 h-2 bg-gray-300 opacity-60"></div>
              <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-400 opacity-70"></div>
              <div className="absolute top-3/4 left-0 right-0 h-2 bg-gray-300 opacity-60"></div>
              <div className="absolute left-1/4 top-0 bottom-0 w-2 bg-gray-300 opacity-60"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-gray-400 opacity-70"></div>
              <div className="absolute left-3/4 top-0 bottom-0 w-2 bg-gray-300 opacity-60"></div>
            </div>
          </div>
        </div>

        {/* 热力图层 */}
        {showHeatmap && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-red-400 opacity-30 rounded-full blur-lg"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-orange-400 opacity-25 rounded-full blur-lg"></div>
            <div className="absolute top-2/3 left-2/3 w-12 h-12 bg-yellow-400 opacity-20 rounded-full blur-lg"></div>
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
                className={`w-8 h-8 ${getPointColor(point)} rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}
              >
                {getPointIcon(point.type)}
              </div>
              {selectedPoint?.id === point.id && (
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-64 bg-white rounded-lg shadow-xl border p-3 z-20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{point.title}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPoint(null)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{point.description}</p>
                  {point.status && (
                    <Badge variant="outline" className="text-xs">
                      {point.status}
                    </Badge>
                  )}
                  {point.severity && (
                    <Badge variant="destructive" className="text-xs ml-1">
                      {point.severity}危险
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* 地图控制按钮 */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <Button size="sm" variant="outline" onClick={toggleFullscreen}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Navigation className="w-4 h-4" />
          </Button>
        </div>

        {/* 缩放级别显示 */}
        <div className="absolute bottom-4 right-4 bg-white px-2 py-1 rounded text-xs text-gray-600">
          缩放: {currentZoom}
        </div>

        {/* 图例 */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
          <h5 className="text-xs font-medium mb-2">图例</h5>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>道路危害</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>车流监控</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>违章摄像</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
