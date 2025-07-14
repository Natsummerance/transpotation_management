"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Search, Filter, Download, AlertTriangle, User, Camera, Shield, Eye } from "lucide-react"
import Image from "next/image"

interface LogEntry {
  id: number
  time: string
  type: string
  level: string
  message: string
  user: string
  ip: string
  hasVideo: boolean
  face_image?: string
  result_image?: string
  source: string
}

interface LogStats {
  serious: number
  warning: number
  info: number
  playable: number
}

interface LogsResponse {
  success: boolean
  data: {
    logs: LogEntry[]
    total: number
    page: number
    limit: number
    stats: LogStats
  }
}

export default function LogsModule() {
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats>({ serious: 0, warning: 0, info: 0, playable: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)

  // 获取日志数据
  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: filterType,
        search: searchTerm,
        page: currentPage.toString(),
        limit: '20'
      })
      
      const response = await fetch(`/api/logs?${params}`)
      const result: LogsResponse = await response.json()
      
      if (result.success) {
        // 根据类型调整级别
        const adjustedLogs = result.data.logs.map(log => {
          let adjustedLevel = log.level
          // 登录尝试归为警告
          if (log.type === "系统登录" || log.type === "人脸识别") {
            adjustedLevel = "警告"
          }
          // 路面病害归为信息
          else if (log.type === "路面病害") {
            adjustedLevel = "信息"
          }
          return { ...log, level: adjustedLevel }
        })
        
        setLogs(adjustedLogs)
        setStats(result.data.stats)
        setTotalLogs(result.data.total)
      } else {
        console.error('获取日志失败:', result)
      }
    } catch (error) {
      console.error('获取日志数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filterType, searchTerm, currentPage])

  const getLevelColor = (level: string) => {
    switch (level) {
      case "严重":
        return "destructive"
      case "警告":
        return "secondary"
      case "信息":
        return "outline"
      default:
        return "outline"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "违章检测":
        return <AlertTriangle className="w-4 h-4" />
      case "人脸识别":
        return <User className="w-4 h-4" />
      case "嫌疑人告警":
        return <Shield className="w-4 h-4" />
      case "路面病害":
        return <AlertTriangle className="w-4 h-4" />
      case "系统登录":
        return <User className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const handleImageView = (imagePath: string) => {
    setSelectedImage(imagePath)
  }

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        type: filterType,
        search: searchTerm,
        export: 'true'
      })
      
      const response = await fetch(`/api/logs?${params}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('导出日志失败:', error)
    }
  }

  // 获取详情图片
  const getDetailImage = (log: LogEntry) => {
    // 登录尝试详情为face_store表的get_face字段
    if (log.type === "系统登录" || log.type === "人脸识别") {
      return log.face_image
    }
    // 路面病害详情为damage_reports表的result_image字段
    else if (log.type === "路面病害") {
      return log.result_image
    }
    return null
  }

  // 获取详情标题
  const getDetailTitle = (log: LogEntry) => {
    if (log.type === "系统登录" || log.type === "人脸识别") {
      return "登录失败照片"
    } else if (log.type === "路面病害") {
      return "路面病害识别结果"
    }
    return "详情图片"
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">日志与事件回放</h2>
          <p className="text-gray-600 mt-1">系统操作日志记录与事件视频回放</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            高级筛选
          </Button>
          <Button 
            onClick={exportLogs}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">严重事件</p>
                <p className="text-3xl font-bold text-red-600">{stats.serious}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">警告事件</p>
                <p className="text-3xl font-bold text-orange-600">{stats.warning}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">信息事件</p>
                <p className="text-3xl font-bold text-blue-600">{stats.info}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">可回放事件</p>
                <p className="text-3xl font-bold text-green-600">{stats.playable}</p>
              </div>
              <Camera className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索日志内容或用户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-blue-500"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="违章检测">违章检测</SelectItem>
                <SelectItem value="人脸识别">人脸识别</SelectItem>
                <SelectItem value="嫌疑人告警">嫌疑人告警</SelectItem>
                <SelectItem value="路面病害">路面病害</SelectItem>
                <SelectItem value="系统登录">系统登录</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 px-6 border-gray-200 hover:bg-gray-50 bg-transparent">
              <Clock className="w-4 h-4 mr-2" />
              时间范围
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 日志表格 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">系统日志</CardTitle>
          <CardDescription>
            {loading ? '加载中...' : `显示 ${logs.length} 条记录，共 ${totalLogs} 条`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>级别</TableHead>
                  <TableHead>消息</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={`${log.source}-${log.id}`}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.time).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(log.type)}
                        <span>{log.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLevelColor(log.level)}>{log.level}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {/* 只保留详情按钮 */}
                        {getDetailImage(log) ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="bg-transparent"
                                onClick={() => handleImageView(getDetailImage(log)!)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                详情
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{getDetailTitle(log)}</DialogTitle>
                                <DialogDescription>
                                  时间: {new Date(log.time).toLocaleString('zh-CN')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-center">
                                <Image
                                  src={getDetailImage(log)!}
                                  alt={getDetailTitle(log)}
                                  width={400}
                                  height={300}
                                  className="rounded-lg border"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-face.png';
                                  }}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button size="sm" variant="outline" className="bg-transparent">
                            <Eye className="w-3 h-3 mr-1" />
                            详情
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* 分页控制 */}
          {!loading && totalLogs > 20 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-600">
                第 {currentPage} 页，共 {Math.ceil(totalLogs / 20)} 页
              </span>
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage >= Math.ceil(totalLogs / 20)}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}