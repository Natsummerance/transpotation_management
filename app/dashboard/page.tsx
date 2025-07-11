"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Loader2,
  ChevronDown,
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
import SettingsModule from "@/components/settings-module"
import { useUser } from '@/components/user-context';

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user, setUser } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 登录控制 - 在渲染前检查
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    setIsAuthenticated(true);
  }, []);

  // 获取用户信息
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [setUser])

  // 更新UTC时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 调用系统状态接口 GET /api/system/status
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch("/api/system/status")
        if (response.ok) {
          const data = await response.json()
          console.log("System status:", data)
        }
      } catch (error) {
        console.error("Failed to fetch system status:", error)
      }
    }

    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 30000) // 每30秒更新一次
    return () => clearInterval(interval)
  }, [])

  // 退出登录
  const handleLogout = async () => {
    try {
      // 调用退出登录API
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
    } catch (error) {
      console.error("Logout API failed:", error)
    } finally {
      // 清除本地存储 - 修正key
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // 重定向到登录页
      window.location.href = "/"
    }
  }

  const stats = [
    {
      title: "今日道路危害",
      value: "23",
      change: "+12%",
      icon: AlertTriangle,
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      api: "/api/hazards/count",
    },
    {
      title: "实时车流量",
      value: "1,247",
      change: "+5%",
      icon: Car,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      api: "/api/traffic/current",
    },
    {
      title: "违章检测",
      value: "89",
      change: "-8%",
      icon: Camera,
      color: "from-orange-500 to-yellow-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      api: "/api/violations/count",
    },
    {
      title: "在线用户",
      value: "156",
      change: "+3%",
      icon: Users,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      api: "/api/users/online",
    },
  ]

  // 导航项目
  const navigationItems = [
    { id: "overview", label: "系统概览", icon: Home, shortLabel: "概览" },
    { id: "road-damage", label: "路面病害检测", icon: AlertTriangle, shortLabel: "病害" },
    { id: "traffic-monitor", label: "实时交通监控", icon: Camera, shortLabel: "监控" },
    { id: "violation", label: "交通违章识别", icon: Shield, shortLabel: "违章" },
    { id: "suspect-alert", label: "嫌疑人识别告警", icon: Eye, shortLabel: "告警" },
    { id: "logs", label: "日志与事件回放", icon: Activity, shortLabel: "日志" },
    { id: "map-analysis", label: "地图时空分析", icon: MapPin, shortLabel: "地图" },
    { id: "taxi-analysis", label: "出租车数据分析", icon: Car, shortLabel: "出租" },
    { id: "data-visualization", label: "统计图表分析", icon: BarChart3, shortLabel: "图表" },
  ]
  
  {/* id: "settings", label: "系统设置", icon: Settings, shortLabel: "设置" */}

  // 调用导出报告接口 POST /api/report/export
  const handleExportReport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/report/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          module: activeModule,
          format: "pdf",
          dateRange: "today",
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${activeModule}-report.pdf`
        a.click()
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 移动端底部导航栏
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex flex-col items-center justify-center space-y-1 ${
              activeModule === item.id ? "text-blue-600 bg-blue-50" : "text-gray-600"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // 在return前添加认证检查
  if (!isAuthenticated) {
    return null; // 未认证时不渲染任何内容
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 顶部导航栏 - 移动端优化 */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* 移动端菜单按钮 */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          智慧交管系统
                        </h1>
                        <p className="text-xs text-gray-500">城市交通智能管理平台</p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={activeModule === item.id ? "default" : "ghost"}
                        className={`w-full justify-start h-12 transition-all duration-200 ${
                          activeModule === item.id
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setActiveModule(item.id)
                          setSidebarOpen(false)
                        }}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Button>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* UTC时间显示 - 移动端优化 */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    智慧交管系统
                  </h1>
                  <p className="text-xs text-gray-500">城市交通智能管理平台</p>
                </div>
              </div>
              <div className="hidden sm:block text-sm text-gray-600">
                <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                  时间: {currentTime.toISOString().slice(0, 11).replace("T", " ")} {currentTime.toTimeString().slice(0, 9)}
                  {/*时间: {currentTime.toISOString().slice(0, 19).replace("T", " ")}*/}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* 搜索框 - 移动端隐藏 */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="搜索..." className="pl-10 w-64 bg-gray-50 border-0" />
            </div>

            {/* 通知按钮 */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="absolute -top-1 -right-1 w-2 sm:w-3 h-2 sm:h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* 用户下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  <Avatar className="w-6 sm:w-8 h-6 sm:h-8">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs sm:text-sm">
                      {user?.uname?.charAt(0) || "未"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{user?.uname || "未登录"}</p>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600">已认证</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveModule("settings")}>
                  <User className="w-4 h-4 mr-2" />
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveModule("settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  系统设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 桌面端侧边栏 */}
        <aside className="hidden md:block w-72 bg-white/80 backdrop-blur-md shadow-lg border-r border-gray-200/50 min-h-screen">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeModule === item.id ? "default" : "ghost"}
                className={`w-full justify-start h-12 transition-all duration-200 ${
                  activeModule === item.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setActiveModule(item.id)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </Button>
            ))}
          </nav>

          {/* 系统状态卡片 */}
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
        </aside>

        {/* 主内容区 - 移动端优化 */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto pb-20 md:pb-6">
          {activeModule === "overview" && (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">系统概览</h2>
                  <p className="text-gray-600 mt-1">实时监控城市交通状况</p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent text-sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    实时监控
                  </Button>
                  <div className="relative">
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg text-sm w-full sm:w-auto"
                      onClick={handleExportReport}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4 mr-2" />
                      )}
                      生成报告
                    </Button>
                    <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/report/export</div>
                  </div>
                </div>
              </div>

              {/* 统计卡片 - 移动端优化 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {stats.map((stat, index) => (
                  <Card
                    key={index}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group relative"
                  >
                    <CardContent className="p-3 sm:p-0">
                      <div className={`${stat.bgColor} p-3 sm:p-6 relative`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <div className="mb-2 sm:mb-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                            <p className="text-xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                            <div className="flex items-center mt-1 sm:mt-2">
                              <TrendingUp className="w-2 sm:w-3 h-2 sm:h-3 mr-1 text-green-600" />
                              <span className="text-xs sm:text-sm text-green-600 font-medium">{stat.change}</span>
                            </div>
                          </div>
                          <div
                            className={`w-10 sm:w-16 h-10 sm:h-16 bg-gradient-to-r ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 self-end sm:self-auto`}
                          >
                            <stat.icon className="w-5 sm:w-8 h-5 sm:h-8 text-white" />
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-16 sm:w-32 h-16 sm:h-32 bg-white/10 rounded-full -mr-8 sm:-mr-16 -mt-8 sm:-mt-16"></div>
                      </div>
                    </CardContent>
                    <div className="absolute bottom-1 right-1 text-xs text-gray-400">{stat.api}</div>
                  </Card>
                ))}
              </div>

              {/* 实时警报和快速操作 - 移动端优化 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-bold">实时警报</CardTitle>
                        <CardDescription className="text-sm">最新的交通事件和警报信息</CardDescription>
                      </div>
                      <Badge variant="destructive" className="animate-pulse text-xs">
                        3 新警报
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100">
                      <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">道路危害警报</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                          中山路与解放路交叉口发现路面坑洞
                        </p>
                        <p className="text-xs text-gray-500 mt-1 sm:mt-2">2分钟前</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        紧急
                      </Badge>
                    </div>
                    <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                      <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <Car className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">交通拥堵</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">人民大道车流量异常，建议分流</p>
                        <p className="text-xs text-gray-500 mt-1 sm:mt-2">5分钟前</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        中等
                      </Badge>
                    </div>
                    <div className="flex items-start space-x-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                      <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <Camera className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">违章检测</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">建设路监控点检测到闯红灯行为</p>
                        <p className="text-xs text-gray-500 mt-1 sm:mt-2">8分钟前</p>
                      </div>
                      <Badge className="text-xs">一般</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-lg sm:text-xl font-bold">快速操作</CardTitle>
                    <CardDescription className="text-sm">常用功能快速入口</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <Button
                        variant="outline"
                        className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 bg-transparent text-xs sm:text-sm"
                        onClick={() => setActiveModule("road-damage")}
                      >
                        <AlertTriangle className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                        <span className="font-medium">危害报警</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 border-green-200 hover:bg-green-50 hover:border-green-300 bg-transparent text-xs sm:text-sm"
                        onClick={() => setActiveModule("traffic-monitor")}
                      >
                        <Car className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" />
                        <span className="font-medium">车流监控</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 bg-transparent text-xs sm:text-sm"
                        onClick={() => setActiveModule("violation")}
                      >
                        <Camera className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" />
                        <span className="font-medium">违章识别</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300 bg-transparent text-xs sm:text-sm"
                        onClick={() => setActiveModule("map-analysis")}
                      >
                        <MapPin className="w-5 sm:w-6 h-5 sm:h-6 text-orange-600" />
                        <span className="font-medium">综合地图</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <Button
                        className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg text-sm"
                        onClick={handleExportReport}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <BarChart3 className="w-4 h-4 mr-2" />
                        )}
                        查看详细报告
                      </Button>
                      <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/report/export</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeModule === "road-hazard" && <RoadHazardModule />}
          {activeModule === "traffic-flow" && <TrafficFlowModule />}
          {activeModule === "violation" && <ViolationModule />}
          {activeModule === "integrated-map" && <IntegratedMapDashboard />}
          {activeModule === "face-recognition" && <FaceRecognitionModule />}
          {activeModule === "road-damage" && <RoadDamageModule />}
          {activeModule === "traffic-monitor" && <TrafficMonitorModule />}
          {activeModule === "suspect-alert" && <SuspectAlertModule />}
          {activeModule === "logs" && <LogsModule />}
          {activeModule === "map-analysis" && <MapAnalysisModule />}
          {activeModule === "taxi-analysis" && <TaxiAnalysisModule />}
          {activeModule === "data-visualization" && <DataVisualizationModule />}
          {activeModule === "settings" && <SettingsModule />}
        </main>
      </div>

      {/* 移动端底部导航栏 */}
      <BottomNavigation />
    </div>
  )
}
