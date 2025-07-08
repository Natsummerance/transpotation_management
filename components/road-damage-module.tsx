"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, MapPin, Clock, FileText, Download, AlertTriangle, Camera, Eye } from "lucide-react"

export default function RoadDamageModule() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)

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

  const handleFileUpload = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setUploadedFile("road_inspection_video.mp4")
    }, 3000)
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">路面病害检测</h2>
          <p className="text-gray-600 mt-1">AI智能识别路面病害，自动生成检测报告</p>
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

      {/* 上传与分析区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">文件上传</CardTitle>
            <CardDescription>上传巡查视频或图片进行AI分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              {isAnalyzing ? (
                <div className="space-y-4">
                  <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-blue-600 font-medium">AI分析中...</p>
                  <p className="text-sm text-gray-500">正在识别路面病害类型</p>
                </div>
              ) : uploadedFile ? (
                <div className="space-y-4">
                  <FileText className="w-12 h-12 mx-auto text-green-600" />
                  <p className="text-green-600 font-medium">上传成功</p>
                  <p className="text-sm text-gray-600">{uploadedFile}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-600">拖拽文件到此处或点击上传</p>
                  <p className="text-sm text-gray-500">支持 MP4, AVI, JPG, PNG 格式</p>
                </div>
              )}
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              onClick={handleFileUpload}
              disabled={isAnalyzing}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isAnalyzing ? "分析中..." : "选择文件"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">识别结果</CardTitle>
            <CardDescription>AI检测到的路面病害信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFile && !isAnalyzing ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-800">检测到严重坑洼</h4>
                      <p className="text-sm text-red-600">置信度: 94.5%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
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
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <div>
                      <h4 className="font-semibold text-orange-800">检测到路面裂缝</h4>
                      <p className="text-sm text-orange-600">置信度: 87.2%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
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
                <div className="flex space-x-3">
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    生成PDF
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    导出Excel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>上传文件后显示检测结果</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">严重病害</p>
                <p className="text-3xl font-bold text-red-600">12</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">中等病害</p>
                <p className="text-3xl font-bold text-orange-600">28</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">轻微病害</p>
                <p className="text-3xl font-bold text-blue-600">45</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已处理</p>
                <p className="text-3xl font-bold text-green-600">67</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 检测历史 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">检测历史</CardTitle>
          <CardDescription>路面病害检测记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Input placeholder="搜索位置..." className="max-w-xs" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="病害类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="pothole">坑洼</SelectItem>
                  <SelectItem value="crack">裂缝</SelectItem>
                  <SelectItem value="alligator">龟裂</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-transparent">
                <Clock className="w-4 h-4 mr-2" />
                时间筛选
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {damageRecords.map((record) => (
                <Card key={record.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={record.image || "/placeholder.svg"}
                        alt="病害图片"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={getSeverityColor(record.severity)}>{record.type}</Badge>
                          <Badge variant="outline">{record.severity}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{record.location}</p>
                        <p className="text-xs text-gray-500 mb-2">{record.time}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {record.gps}
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
