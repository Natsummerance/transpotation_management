"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, MapPin, Clock, FileText, Download, AlertTriangle, Camera, Eye, Loader2 } from "lucide-react"

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

  // 调用路面病害检测接口 POST /api/detect/road-damage
  const handleFileUpload = async () => {
    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      // 模拟文件上传
      const response = await fetch("/api/detect/road-damage", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setTimeout(() => {
          setIsAnalyzing(false)
          setUploadedFile("road_inspection_video.mp4")
        }, 3000)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      setIsAnalyzing(false)
    }
  }

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
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center">
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
                onClick={handleFileUpload}
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
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm sm:text-base">检测到严重坑洼</h4>
                      <p className="text-xs sm:text-sm text-red-600">置信度: 94.5%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                      <span>GPS: 36.6512, 117.1201</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-gray-500" />
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6 text-orange-600" />
                    <div>
                      <h4 className="font-semibold text-orange-800 text-sm sm:text-base">检测到路面裂缝</h4>
                      <p className="text-xs sm:text-sm text-orange-600">置信度: 87.2%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                      <span>GPS: 36.6523, 117.1189</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-gray-500" />
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent text-sm">
                    <FileText className="w-4 h-4 mr-2" />
                    生成PDF
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent text-sm">
                    <Download className="w-4 h-4 mr-2" />
                    导出Excel
                  </Button>
                </div>
              </div>
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">严重病害</p>
                <p className="text-xl sm:text-3xl font-bold text-red-600">12</p>
              </div>
              <AlertTriangle className="w-6 sm:w-8 h-6 sm:h-8 text-red-600 self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">中等病害</p>
                <p className="text-xl sm:text-3xl font-bold text-orange-600">28</p>
              </div>
              <AlertTriangle className="w-6 sm:w-8 h-6 sm:h-8 text-orange-600 self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">轻微病害</p>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">45</p>
              </div>
              <AlertTriangle className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600 self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">已处理</p>
                <p className="text-xl sm:text-3xl font-bold text-green-600">67</p>
              </div>
              <AlertTriangle className="w-6 sm:w-8 h-6 sm:h-8 text-green-600 self-end sm:self-auto" />
            </div>
          </CardContent>
        </Card>
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
