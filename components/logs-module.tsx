"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Search, Filter, Play, Download, AlertTriangle, User, Camera, Shield } from "lucide-react"

export default function LogsModule() {
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const systemLogs = [
    {
      id: 1,
      time: "2024-01-15 14:30:25",
      type: "违章检测",
      level: "警告",
      message: "检测到闯红灯行为 - 中山路与解放路交叉口",
      user: "系统",
      ip: "192.168.1.100",
      hasVideo: true,
    },
    {
      id: 2,
      time: "2024-01-15 14:28:15",
      type: "人脸识别",
      level: "信息",
      message: "用户张三成功通过人脸识别验证",
      user: "张三",
      ip: "192.168.1.101",
      hasVideo: false,
    },
    {
      id: 3,
      time: "2024-01-15 14:25:10",
      type: "嫌疑人告警",
      level: "严重",
      message: "检测到A级通缉犯张某某 - 主入口",
      user: "系统",
      ip: "192.168.1.102",
      hasVideo: true,
    },
    {
      id: 4,
      time: "2024-01-15 14:20:05",
      type: "路面病害",
      level: "警告",
      message: "AI检测到严重坑洼 - 人民大道128号",
      user: "系统",
      ip: "192.168.1.103",
      hasVideo: false,
    },
    {
      id: 5,
      time: "2024-01-15 14:15:30",
      type: "系统登录",
      level: "信息",
      message: "管理员登录系统",
      user: "admin",
      ip: "192.168.1.104",
      hasVideo: false,
    },
  ]

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

  const filteredLogs = systemLogs.filter((log) => {
    const matchesType = filterType === "all" || log.type === filterType
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

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
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
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
                <p className="text-3xl font-bold text-red-600">8</p>
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
                <p className="text-3xl font-bold text-orange-600">23</p>
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
                <p className="text-3xl font-bold text-blue-600">156</p>
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
                <p className="text-3xl font-bold text-green-600">45</p>
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
          <CardDescription>显示 {filteredLogs.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
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
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.time}</TableCell>
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
                      <Button size="sm" variant="outline" className="bg-transparent">
                        详情
                      </Button>
                      {log.hasVideo && (
                        <Button size="sm" variant="outline" className="bg-transparent">
                          <Play className="w-3 h-3 mr-1" />
                          回放
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
