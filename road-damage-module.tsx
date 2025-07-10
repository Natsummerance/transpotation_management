"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, MapPin, Clock, FileText, Download, AlertTriangle, Camera, Eye, Loader2 } from "lucide-react"
import { toast } from "sonner";

interface Damage {
  '纵向裂缝': number;
  '横向裂缝': number;
  '龟裂': number;
  '坑洼': number;
}

interface DamageResultItem {
  type: string;
  count: number;
  confidence: number;
}

type DamageResults = DamageResultItem[];


interface DetectionResponse {
  results: DamageResults;
  originalImage?: string;
  resultImage?: string;
}

const damageTypes = [
  {
    key: '纵向裂缝',
    label: '纵向裂缝',
    bgFrom: 'from-red-50',
    bgTo: 'to-pink-50',
    textColor: 'text-red-600',
  },
  {
    key: '横向裂缝',
    label: '横向裂缝',
    bgFrom: 'from-orange-50',
    bgTo: 'to-yellow-50',
    textColor: 'text-orange-600',
  },
  {
    key: '龟裂',
    label: '龟裂',
    bgFrom: 'from-blue-50',
    bgTo: 'to-cyan-50',
    textColor: 'text-blue-600',
  },
  {
    key: '坑洼',
    label: '坑洼',
    bgFrom: 'from-green-50',
    bgTo: 'to-emerald-50',
    textColor: 'text-green-600',
  },
];

const AMapLoaderUrl = "https://webapi.amap.com/maps?v=2.0&key=4c0958011b7f86aca896a60d37f1d7c5"
declare const AMap: any

export default function RoadDamageModule() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const damageRecords = [
    {
      id: 1,
      type: "坑洼",
      location: "中山路与解放路交叉口",
      gps: "36.6512, 117.1201",
      time: "2024-01-15 14:30",
      severity: "严重",
      status: "待处理",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      type: "裂缝",
      location: "人民大道128号附近",
      gps: "36.6523, 117.1189",
      time: "2024-01-15 13:45",
      severity: "中等",
      status: "处理中",
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      type: "龟裂",
      location: "建设路商业街",
      gps: "36.6534, 117.1167",
      time: "2024-01-15 12:20",
      severity: "轻微",
      status: "已完成",
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<DamageResults | null>(null);

  const [isMapVisible, setIsMapVisible] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [selectedPosition, setSelectedPosition] = useState<{ lng: number; lat: number } | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

    // 加载高德地图脚本
  const loadAMap = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof AMap !== "undefined") return resolve()
      const script = document.createElement("script")
      script.src = AMapLoaderUrl
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("高德地图加载失败"))
      document.head.appendChild(script)
    })
  }

  const initMap = async () => {
    await loadAMap()

    // 获取当前定位作为地图中心
    const geolocation = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 10000 })
    geolocation.getCurrentPosition((status: string, result: any) => {
      if (status !== "complete") {
        alert("无法获取定位，默认定位北京")
        result = { position: { lng: 116.397428, lat: 39.90923 } } // 默认北京
      }

      const { lng, lat } = result.position

      const mapInstance = new AMap.Map(mapContainerRef.current, {
        center: [lng, lat],
        zoom: 15,
      })

      const markerInstance = new AMap.Marker({
        position: [lng, lat],
        draggable: true,
        map: mapInstance,
      })

      // 点击地图移动标记点
      mapInstance.on("click", (e: any) => {
        markerInstance.setPosition(e.lnglat)
        setSelectedPosition({ lng: e.lnglat.lng, lat: e.lnglat.lat })
      })

      setMap(mapInstance)
      setMarker(markerInstance)
      setSelectedPosition({ lng, lat })
    })
  }

  const handleOpenMap = async () => {
    setIsMapVisible(true)
    setTimeout(initMap, 100) // 确保 DOM 已渲染
  }

  const handleConfirmLocation = async () => {
    if (!selectedPosition) {
      alert("请先选择一个位置")
      return
    }

    const currentTime = new Date()
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-") // 保证日期格式为 yyyy-MM-dd

    setIsLoading(true)

    try {
      const response = await fetch("/api/report/damage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: "road-damage",
          location: selectedPosition,
          timestamp: currentTime,
          results,
          resultImage,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "road-damage-report.pdf"
        a.click()
      } else {
        alert("导出失败")
      }
    } catch (err) {
      console.error("导出失败", err)
      alert("导出失败")
    } finally {
      setIsLoading(false)
      setIsMapVisible(false)
    }
  }

const handleDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  setDragOver(false);
  const droppedFile = event.dataTransfer.files?.[0];
  if (droppedFile) {
    setFile(droppedFile);
    handleUploadAndAnalyze(droppedFile);
  }
}, []);

  // 调用路面病害检测接口 POST /api/detect/road-damage
const handleUploadAndAnalyze = async (file: File) => {
  if (!file) {
    toast.error("请先选择一个文件");
    return;
  }

  setIsAnalyzing(true);       // 替代旧的 setIsLoading()
  setResults(null);
  setResultImage(null);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/detect/road-damage', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '分析失败');
    }

    const data: DetectionResponse = await response.json();
    setResults(data.results);
    if (data.resultImage) {
      setResultImage(data.resultImage);
    }
    toast.success("分析成功！");
    setUploadedFile(file.name);
  } catch (error: any) {
    console.error("分析错误:", error);
    toast.error(error.message || "分析过程中发生错误");
  } finally {
    setIsAnalyzing(false);
  }
};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0];
  if (selectedFile) {
    setFile(selectedFile);                // 保存文件
    handleUploadAndAnalyze(selectedFile); // 上传后直接开始分析
  }
};

  // 调用导出报告接口 POST /api/report/export
  const handleExportReport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/report/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: "road-damage",
          format: "pdf",
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "road-damage-report.pdf"
        a.click()
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "严重":
        return "destructive"
      case "中等":
        return "secondary"
      case "轻微":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">路面病害检测</h2>
          <p className="text-gray-600 mt-1">AI智能识别路面病害，自动生成检测报告</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent text-sm">
            <Eye className="w-4 h-4 mr-2" />
            实时监控
          </Button>
          <div className="relative">
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg text-sm w-full sm:w-auto"
              onClick={handleExportReport}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              导出报告
            </Button>
            <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/report/export</div>
          </div>
        </div>
      </div>

      {/* 上传与分析区域 - 移动端优化 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold">文件上传</CardTitle>
            <CardDescription>上传巡查视频或图片进行AI分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div
              className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors duration-200 ${
                dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {isAnalyzing ? (
                <div className="space-y-4">
                  <Loader2 className="animate-spin mx-auto w-8 sm:w-12 h-8 sm:h-12 text-blue-600" />
                  <p className="text-blue-600 font-medium text-sm sm:text-base">AI分析中...</p>
                  <p className="text-xs sm:text-sm text-gray-500">正在识别路面病害类型</p>
                </div>
              ) : uploadedFile ? (
                <div className="space-y-4">
                  <FileText className="w-8 sm:w-12 h-8 sm:h-12 mx-auto text-green-600" />
                  <p className="text-green-600 font-medium text-sm sm:text-base">上传成功</p>
                  <p className="text-xs sm:text-sm text-gray-600">{uploadedFile}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-8 sm:w-12 h-8 sm:h-12 mx-auto text-gray-400" />
                  <p className="text-gray-600 text-sm sm:text-base">拖拽文件到此处或点击上传</p>
                  <p className="text-xs sm:text-sm text-gray-500">支持 MP4, AVI, JPG, PNG 格式</p>
                </div>
              )}
            </div>
            <div className="relative">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white h-10 sm:h-12 text-sm sm:text-base"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    选择文件
                  </>
                )}
              </Button>
              <input
                  aria-label="上传路面病害检测文件"
                  title="选择要上传的路面病害检测文件"
                  placeholder="选择文件进行上传"
                  type="file"
                  ref={fileInputRef}
                  accept=".mp4,.avi,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
              <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/detect/road-damage</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold">识别结果</CardTitle>
            <CardDescription>AI检测到的路面病害信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFile && !isAnalyzing ? (
              <>
                <div className="space-y-2">
                  {resultImage ? (
                    <div className="aspect-video bg-muted rounded-md overflow-hidden">
                      <img src={resultImage} alt="Detection Result" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">检测结果图片将在此处显示</p>
                    </div>
                  )}
                </div>

                {/* 导出模块 */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button size="sm" variant="outline" 
                    className="flex-1 bg-transparent text-sm"
                    onClick={handleOpenMap}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    上传信息
                  </Button>
                  {isMapVisible && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg shadow-lg p-4 w-[600px] h-[500px] flex flex-col relative">
                        <div className="text-xl font-bold mb-2">请选择位置</div>
                        <div 
                          ref={mapContainerRef} className="flex-1" style={{ width: "100%", height: "100%" }}
                          >
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                          <button onClick={() => setIsMapVisible(false)} className="bg-gray-400 text-white px-4 py-2 rounded">
                            取消
                          </button>
                          <button
                            onClick={handleConfirmLocation}
                            className="bg-green-600 text-white px-4 py-2 rounded"
                            disabled={isLoading}
                          >
                            {isLoading ? "导出中..." : "确认并导出"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

            </>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Camera className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm sm:text-base">上传文件后显示检测结果</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 统计概览 - 移动端优化 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {results &&
          damageTypes.map(({ key, label, bgFrom, bgTo, textColor }) => {
            const item = results.find((r) => r.type === label); // label 是中文名，对应 type
              return (
                <Card
                  key={key}
                  className={`border-0 shadow-lg bg-gradient-to-br ${bgFrom} ${bgTo}`}
                >
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="mb-2 sm:mb-0">
                        <p className={`text-xs sm:text-sm font-bold ${textColor}`}>
                          {label}
                        </p>
                        <p className={`text-xl sm:text-3xl font-bold ${textColor}`}>
                           {item?.count ?? 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          置信度: {typeof item?.confidence === 'number' ? item.confidence.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <AlertTriangle
                        className={`w-6 sm:w-8 h-6 sm:h-8 ${textColor} self-end sm:self-auto`}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
          })}
      </div>

      {/* 检测历史 - 移动端优化 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-bold">检测历史</CardTitle>
          <CardDescription>路面病害检测记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <Input placeholder="搜索位置..." className="flex-1 text-sm" />
              <Select>
                <SelectTrigger className="w-full sm:w-40 text-sm">
                  <SelectValue placeholder="病害类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="pothole">坑洼</SelectItem>
                  <SelectItem value="crack">裂缝</SelectItem>
                  <SelectItem value="alligator">龟裂</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-transparent text-sm">
                <Clock className="w-4 h-4 mr-2" />
                时间筛选
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {damageRecords.map((record) => (
                <Card key={record.id} className="border border-gray-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={record.image || "/placeholder.svg"}
                        alt="病害图片"
                        className="w-12 sm:w-16 h-12 sm:h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                          <Badge variant={getSeverityColor(record.severity)} className="text-xs">
                            {record.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {record.severity}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{record.location}</p>
                        <p className="text-xs text-gray-500 mb-2">{record.time}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate">{record.gps}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}