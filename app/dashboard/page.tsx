"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertTriangle,
  Car,
  Camera,
  Users,
  Activity,
  TrendingUp,
  Shield,
  Bell,
  Settings,
  LogOut,
  MapPin,
  Menu,
  Search,
  Home,
  BarChart3,
  Eye,
  Zap,
  User,
} from "lucide-react"
import RoadHazardModule from "@/components/road-hazard-module"
import TrafficFlowModule from "@/components/traffic-flow-module"
import ViolationModule from "@/components/violation-module"
import IntegratedMapDashboard from "@/components/integrated-map-dashboard"
import { Input } from "@/components/ui/input"
import FaceRecognitionModule from "@/components/face-recognition-module"
import RoadDamageModule from "@/components/road-damage-module"
import TrafficMonitorModule from "@/components/traffic-monitor-module"
import SuspectAlertModule from "@/components/suspect-alert-module"
import LogsModule from "@/components/logs-module"
import MapAnalysisModule from "@/components/map-analysis-module"
import TaxiAnalysisModule from "@/components/taxi-analysis-module"
import DataVisualizationModule from "@/components/data-visualization-module"

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const stats = [
    {
      title: "今日道路危害",
      value: "23",
      change: "+12%",
      icon: AlertTriangle,
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      title: "实时车流量",
      value: "1,247",
      change: "+5%",
      icon: Car,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "违章检测",
      value: "89",
      change: "-8%",
      icon: Camera,
      color: "from-orange-500 to-yellow-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "在线用户",
      value: "156",
      change: "+3%",
      icon: Users,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
  ]

  // 更新导航项目，添加新的模块
  const navigationItems = [
    { id: "overview", label: "系统概览", icon: Home },
    { id: "face-recognition", label: "人脸识别管理", icon: User },
    { id: "road-damage", label: "路面病害检测", icon: AlertTriangle },
    { id: "traffic-monitor", label: "实时交通监控", icon: Camera },
    { id: "violation", label: "交通违章识别", icon: Shield },
    { id: "suspect-alert", label: "嫌疑人识别告警", icon: Eye },
    { id: "logs", label: "日志与事件回放", icon: Activity },
    { id: "map-analysis", label: "地图时空分析", icon: MapPin },
    { id: "taxi-analysis", label: "出租车数据分析", icon: Car },
    { id: "data-visualization", label: "统计图表分析", icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            {/* 在顶部导航栏添加UTC时间显示 */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    智慧交管系统
                  </h1>
                  <p className="text-xs text-gray-500">城市交通智能管理平台</p>
                </div>
              </div>
              <div className="hidden md:block text-sm text-gray-600">
                <div className="bg-gray-100 px-3 py-1 rounded-lg">
                  当前时间: {new Date().toISOString().slice(0, 19).replace("T", " ")}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="搜索..." className="pl-10 w-64 bg-gray-50 border-0" />
            </div>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5" />
            </Button>
            {/* 在用户头像区域添加权限信息 */}
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                  管理员
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">管理员</p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">已认证</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside
          className={`${sidebarCollapsed ? "w-16" : "w-72"} bg-white/80 backdrop-blur-md shadow-lg border-r border-gray-200/50 transition-all duration-300 min-h-screen`}
        >
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeModule === item.id ? "default" : "ghost"}
                className={`w-full justify-start h-12 transition-all duration-200 ${
                  activeModule === item.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "hover:bg-gray-100"
                } ${sidebarCollapsed ? "px-3" : "px-4"}`}
                onClick={() => setActiveModule(item.id)}
              >
                <item.icon className={`w-5 h-5 ${sidebarCollapsed ? "" : "mr-3"}`} />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </Button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="p-4 mt-8">
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">系统状态</p>
                      <p className="text-xs text-gray-600">运行正常</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">CPU使用率</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full"
                        style={{ width: "45%" }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-6 overflow-auto">
          {activeModule === "overview" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">系统概览</h2>
                  <p className="text-gray-600 mt-1">实时监控城市交通状况</p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
                    <Eye className="w-4 h-4 mr-2" />
                    实时监控
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                    <Activity className="w-4 h-4 mr-2" />
                    生成报告
                  </Button>
                </div>
              </div>

              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card
                    key={index}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    <CardContent className="p-0">
                      <div className={`${stat.bgColor} p-6 relative`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            <div className="flex items-center mt-2">
                              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                            </div>
                          </div>
                          <div
                            className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                          >
                            <stat.icon className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 实时警报和快速操作 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">实时警报</CardTitle>
                        <CardDescription>最新的交通事件和警报信息</CardDescription>
                      </div>
                      <Badge variant="destructive" className="animate-pulse">
                        3 新警报
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">道路危害警报</p>
                        <p className="text-sm text-gray-600 mt-1">中山路与解放路交叉口发现路面坑洞</p>
                        <p className="text-xs text-gray-500 mt-2">2分钟前</p>
                      </div>
                      <Badge variant="destructive">紧急</Badge>
                    </div>
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                        <Car className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">交通拥堵</p>
                        <p className="text-sm text-gray-600 mt-1">人民大道车流量异常，建议分流</p>
                        <p className="text-xs text-gray-500 mt-2">5分钟前</p>
                      </div>
                      <Badge variant="secondary">中等</Badge>
                    </div>
                    <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">违章检测</p>
                        <p className="text-sm text-gray-600 mt-1">建设路监控点检测到闯红灯行为</p>
                        <p className="text-xs text-gray-500 mt-2">8分钟前</p>
                      </div>
                      <Badge>一般</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold">快速操作</CardTitle>
                    <CardDescription>常用功能快速入口</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 bg-transparent"
                        onClick={() => setActiveModule("hazard")}
                      >
                        <AlertTriangle className="w-6 h-6 text-blue-600" />
                        <span className="text-sm font-medium">危害报警</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2 border-green-200 hover:bg-green-50 hover:border-green-300 bg-transparent"
                        onClick={() => setActiveModule("traffic")}
                      >
                        <Car className="w-6 h-6 text-green-600" />
                        <span className="text-sm font-medium">车流监控</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 bg-transparent"
                        onClick={() => setActiveModule("violation")}
                      >
                        <Camera className="w-6 h-6 text-purple-600" />
                        <span className="text-sm font-medium">违章识别</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col space-y-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300 bg-transparent"
                        onClick={() => setActiveModule("map")}
                      >
                        <MapPin className="w-6 h-6 text-orange-600" />
                        <span className="text-sm font-medium">综合地图</span>
                      </Button>
                    </div>
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      查看详细报告
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeModule === "hazard" && <RoadHazardModule />}
          {activeModule === "traffic" && <TrafficFlowModule />}
          {activeModule === "violation" && <ViolationModule />}
          {activeModule === "map" && <IntegratedMapDashboard />}
          {activeModule === "analytics" && (
            <div className="text-center py-20">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">数据分析模块</h3>
              <p className="text-gray-500 mt-2">正在开发中...</p>
            </div>
          )}
          {/* 添加新模块的渲染逻辑 */}
          {activeModule === "face-recognition" && <FaceRecognitionModule />}
          {activeModule === "road-damage" && <RoadDamageModule />}
          {activeModule === "traffic-monitor" && <TrafficMonitorModule />}
          {activeModule === "suspect-alert" && <SuspectAlertModule />}
          {activeModule === "logs" && <LogsModule />}
          {activeModule === "map-analysis" && <MapAnalysisModule />}
          {activeModule === "taxi-analysis" && <TaxiAnalysisModule />}
          {activeModule === "data-visualization" && <DataVisualizationModule />}
        </main>
      </div>
    </div>
  )
}
