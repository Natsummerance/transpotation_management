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
import { Input } from "@/components/ui/input"
import FaceRecognitionModule from "@/components/face-recognition-module"
import RoadDamageModule from "@/components/road-damage-module"
import LogsModule from "@/components/logs-module"
import MapAnalysisModule from "@/components/map-analysis-module"
import TaxiAnalysisModule from "@/components/taxi-analysis-module"
import DataVisualizationModule from "@/components/data-visualization-module"
import SettingsModule from "@/components/settings-module"
import { useUser } from '@/components/user-context';
import { useTranslation } from 'react-i18next';
import fs from 'fs';

// 定义数据类型
interface DashboardStats {
  roadDamage: {
    title: string;
    total: number;
    today: number;
    yesterday: number;
    roadDamages: number;
    detectedDamages: number;
    change: string;
    icon: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
  taxiAnalysis: {
    title: string;
    activeTaxis: number;
    totalRecords: number;
    occupiedTrips: number;
    todayRecords: number;
    yesterdayRecords: number;
    avgSpeed: number;
    totalTrips: number;
    change: string;
    icon: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
  mapAnalysis: {
    title: string;
    vehiclesTracked: number;
    locationPoints: number;
    speedViolations: number;
    eventsDetected: number;
    todayCount: number;
    yesterdayCount: number;
    change: string;
    icon: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
  logs: {
    title: string;
    totalLogs: number;
    todayLogs: number;
    yesterdayLogs: number;
    errorLogs: number;
    warningLogs: number;
    infoLogs: number;
    change: string;
    icon: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
}

interface Alert {
  id: number;
  type: string;
  title: string;
  description: string;
  severity: string;
  location: string;
  timeAgo: string;
  status: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user, setUser } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [blockRender, setBlockRender] = useState(false);
  
  // 新增状态管理
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [alertsError, setAlertsError] = useState<string | null>(null)

  // 新增state
  const [settingsPage, setSettingsPage] = useState<'profile' | 'system'>('profile');

  // 新增：读取cars.txt内容
  const [carCount, setCarCount] = useState<number | null>(null);
  useEffect(() => {
    fetch('/cars.txt')
      .then(res => res.text())
      .then(text => {
        const num = parseInt(text.trim(), 10);
        if (!isNaN(num)) setCarCount(num);
      });
  }, []);

  // 登录控制 - 在渲染前检查
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    setIsAuthenticated(true);
    // 认证用户访问控制
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== 'authenticated') {
        alert('请先完成人脸认证！');
        setBlockRender(true);
        window.location.href = '/profile';
      }
    }
  }, []);
  if (blockRender) return null;

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

  // 获取仪表板统计数据
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true)
      setStatsError(null)
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setDashboardStats(result.data)
        } else {
          setStatsError(result.error || '获取统计数据失败')
        }
      } else {
        setStatsError('网络请求失败')
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
      setStatsError('连接数据库失败，请检查网络连接')
    } finally {
      setStatsLoading(false)
    }
  }

  // 获取警报数据
  const fetchAlerts = async () => {
    try {
      setAlertsLoading(true)
      setAlertsError(null)
      const response = await fetch("/api/dashboard/alerts")
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAlerts(result.data.alerts)
        } else {
          setAlertsError(result.error || '获取警报数据失败')
        }
      } else {
        setAlertsError('网络请求失败')
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
      setAlertsError('连接数据库失败，请检查网络连接')
    } finally {
      setAlertsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
    fetchAlerts()
    
    // 每120秒更新一次数据，进一步减少数据库连接压力
    const statsInterval = setInterval(fetchDashboardStats, 120000)
    const alertsInterval = setInterval(fetchAlerts, 120000)
    
    return () => {
      clearInterval(statsInterval)
      clearInterval(alertsInterval)
    }
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

  // 动态生成统计卡片数据
  const getStatsCards = () => {
    if (!dashboardStats) return []
    
    const iconMap: { [key: string]: any } = {
      AlertTriangle,
      Car,
      MapPin,
      Activity
    }
    
    return [
      {
        title: dashboardStats.roadDamage.title,
        value: dashboardStats.roadDamage.total.toString(),
        change: dashboardStats.roadDamage.change,
        icon: iconMap[dashboardStats.roadDamage.icon],
        color: dashboardStats.roadDamage.color,
        bgColor: dashboardStats.roadDamage.bgColor,
        textColor: dashboardStats.roadDamage.textColor,
         
        details: {
          total: dashboardStats.roadDamage.total,
          today: dashboardStats.roadDamage.today,
          yesterday: dashboardStats.roadDamage.yesterday,
          roadDamages: dashboardStats.roadDamage.roadDamages,
          detectedDamages: dashboardStats.roadDamage.detectedDamages
        }
      },
      {
        // 平台活跃车辆
        title: '平台活跃车辆',
        value: carCount !== null ? carCount.toString() : '-',
        change: '',
        icon: Car,
        color: dashboardStats.taxiAnalysis.color,
        bgColor: dashboardStats.taxiAnalysis.bgColor,
        textColor: dashboardStats.taxiAnalysis.textColor,
        details: {
          totalRecords: carCount !== null ? carCount : '-',
          todayRecords: 0,
          yesterdayRecords: 0,
          occupiedTrips: '-',
          avgSpeed: '-',
          today: 0,
          yesterday: 0
        }
      },
      {
        // 地图时空分析
        title: '地图时空分析',
        value: '3',
        change: '',
        icon: MapPin,
        color: dashboardStats.mapAnalysis.color,
        bgColor: dashboardStats.mapAnalysis.bgColor,
        textColor: dashboardStats.mapAnalysis.textColor,
        details: {
          locationPoints: 3,
          todayCount: '当前可查看图层 3',
          // 合并今日昨日为一个字段
          today: '当前可查看图层 3',
          yesterday: undefined
        }
      },
      {
        title: dashboardStats.logs.title,
        value: dashboardStats.logs.totalLogs.toString(),
        change: dashboardStats.logs.change,
        icon: iconMap[dashboardStats.logs.icon],
        color: dashboardStats.logs.color,
        bgColor: dashboardStats.logs.bgColor,
        textColor: dashboardStats.logs.textColor,
         
        details: {
          totalLogs: dashboardStats.logs.totalLogs,
          todayLogs: dashboardStats.logs.todayLogs,
          yesterdayLogs: dashboardStats.logs.yesterdayLogs,
          errorLogs: dashboardStats.logs.errorLogs,
          warningLogs: dashboardStats.logs.warningLogs
        }
      }
    ]
  }

  // 导航项目
  const navigationItems = [
    { id: "overview", label: t('overview'), icon: Home, shortLabel: t('overview') },
    { id: "road-damage", label: t('road_hazard'), icon: AlertTriangle, shortLabel: t('road_hazard') },
    { id: "map-analysis", label: t('map_analysis'), icon: MapPin, shortLabel: t('map_analysis') },
    { id: "taxi-analysis", label: t('taxi_analysis'), icon: Car, shortLabel: t('taxi_analysis') },
    { id: "logs", label: t('logs'), icon: Activity, shortLabel: t('logs') },
  ]
  
  {/* 
    { id: "traffic-monitor", label: "实时交通监控", icon: Camera, shortLabel: "监控" },
    { id: "violation", label: "交通违章识别", icon: Shield, shortLabel: "违章" },
    { id: "suspect-alert", label: "嫌疑人识别告警", icon: Eye, shortLabel: "告警" },
     { id: "data-visualization", label: "统计图表分析", icon: BarChart3, shortLabel: "图表" },
    id: "settings", label: "系统设置", icon: Settings, shortLabel: "设置" */
  }

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
                          {t('smart_traffic_management_system')}
                        </h1>
                        <p className="text-xs text-gray-500">{t('city_traffic_intelligent_management_platform')}</p>
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
                    {t('smart_traffic_management_system')}
                  </h1>
                  <p className="text-xs text-gray-500">{t('city_traffic_intelligent_management_platform')}</p>
                </div>
              </div>
              <div className="hidden sm:block text-sm text-gray-600">
                <div className="bg-gray-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                  {currentTime.toISOString().slice(0, 11).replace("T", " ")} {currentTime.toTimeString().slice(0, 9)}
                  {/*时间: {currentTime.toISOString().slice(0, 19).replace("T", " ")}*/}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">

            {/* 通知按钮（改为下拉天气预报） */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span className="absolute -top-1 -right-1 w-2 sm:w-3 h-2 sm:h-3 bg-red-500 rounded-full text-xs"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <Bell className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-bold text-lg text-gray-800">天气预报</span>
                  </div>
                  {/* 简要天气信息，可根据实际接口替换 */}
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">🌤️</span>
                    <span className="text-xl font-bold text-red-500">26℃</span>
                    <span className="text-gray-500">多云</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">今日温度：22~28℃，风速：3m/s，湿度：60%</div>
                  <Button
                    className="w-full mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold"
                    onClick={() => setActiveModule("data-visualization")}
                  >
                    进入天气预报页面
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
                <DropdownMenuLabel>{t('my_account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setActiveModule("settings"); setSettingsPage('profile'); }}>
                  <User className="w-4 h-4 mr-2" />
                  {t('personal_profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setActiveModule("settings"); setSettingsPage('system'); }}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('system_settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
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
                    <p className="font-medium text-sm">{t('system_status')}</p>
                    <p className="text-xs text-gray-600">{t('running_normally')}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('cpu_usage')}</span>
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
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('system_overview')}</h2>
                  <p className="text-gray-600 mt-1">{t('real_time_monitoring_city_traffic_conditions')}</p>
                </div>
                {/* 移除实时监控和生成报告按钮 */}
              </div>

              {/* 统计卡片 - 移动端优化 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {statsLoading ? (
                  // 加载状态
                  Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="border-0 shadow-lg">
                      <CardContent className="p-3 sm:p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : statsError ? (
                  // 错误状态
                  <div className="col-span-full">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('data_loading_failed')}</h3>
                        <p className="text-gray-600 mb-4">{statsError}</p>
                        <Button 
                          onClick={() => {
                            setStatsLoading(true)
                            fetchDashboardStats()
                          }}
                          variant="outline"
                        >
                          {t('retry')}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  getStatsCards().map((stat, index) => {
                    // 统计卡片与模块的对应关系
                    const moduleMap = ["road-damage", "taxi-analysis", "map-analysis", "logs"];
                    return (
                      <div key={index} onClick={() => setActiveModule(moduleMap[index])} style={{ cursor: 'pointer' }}>
                        <Card className="border-0 shadow-lg group hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                          <CardContent className="p-3 sm:p-0">
                            <div className={`${stat.bgColor} p-3 sm:p-6 relative`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                <div className="mb-2 sm:mb-0">
                                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                  <p className="text-xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                                  <div className="flex items-center mt-1 sm:mt-2">
                                    {stat.change && stat.change.startsWith('+') ? (
                                      <TrendingUp className="w-2 sm:w-3 h-2 sm:h-3 mr-1 text-green-600" />
                                    ) : stat.change && stat.change.startsWith('-') ? (
                                      <TrendingUp className="w-2 sm:w-3 h-2 sm:h-3 mr-1 text-red-600 rotate-180" />
                                    ) : (
                                      <TrendingUp className="w-2 sm:w-3 h-2 sm:h-3 mr-1 text-gray-600" />
                                    )}
                                    <span className={`text-xs sm:text-sm font-medium ${
                                      stat.change && stat.change.startsWith('+') ? 'text-green-600' : 
                                      stat.change && stat.change.startsWith('-') ? 'text-red-600' : 
                                      'text-gray-600'
                                    }`}>
                                      {stat.change}
                                    </span>
                                  </div>
                                  <div className="absolute bottom-1 right-1 text-xs text-gray-500 mt-1">
                                    {stat.title === '地图时空分析' ? (
                                      stat.details.today
                                    ) : (
                                      <>
                                        今日: {stat.details.today ?? stat.details.todayRecords ?? stat.details.todayLogs ?? 0} |
                                        昨日: {stat.details.yesterday ?? stat.details.yesterdayRecords ?? stat.details.yesterdayLogs ?? 0}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={`w-10 sm:w-16 h-10 sm:h-16 bg-gradient-to-r ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 self-end sm:self-auto`}
                                >
                                  {stat.icon && <stat.icon className="w-5 sm:w-8 h-5 sm:h-8 text-white" />}
                                </div>
                              </div>
                              <div className="absolute top-0 right-0 w-16 sm:w-32 h-16 sm:h-32 bg-white/10 rounded-full -mr-8 sm:-mr-16 -mt-8 sm:-mt-16"></div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 实时警报和快速操作 - 移动端优化 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <Card className="border-0 shadow-lg lg:col-span-2">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-bold">{t('real_time_alerts')}</CardTitle>
                        <CardDescription className="text-sm">{t('latest_traffic_events_and_alert_information')}</CardDescription>
                      </div>
                      {!alertsLoading && (
                        <Badge variant="destructive" className="animate-pulse text-xs">
                          {alerts.length} {t('new_alerts')}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {alertsLoading ? (
                      // 加载状态
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gray-200 rounded-lg sm:rounded-xl animate-pulse"></div>
                          <div className="flex-1 min-w-0">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                          </div>
                        </div>
                      ))
                    ) : alerts.length > 0 ? (
                      alerts.map((alert, index) => {
                        const getAlertIcon = (type: string) => {
                          switch (type) {
                            case 'road_damage':
                              return AlertTriangle;
                            case 'traffic_congestion':
                              return Car;
                            default:
                              return Activity;
                          }
                        }
                        
                        const getAlertColors = (severity: string) => {
                          switch (severity) {
                            case 'high':
                              return {
                                bg: 'from-red-50 to-pink-50',
                                border: 'border-red-100',
                                icon: 'from-red-500 to-pink-500',
                                badge: 'destructive'
                              };
                            case 'medium':
                              return {
                                bg: 'from-orange-50 to-yellow-50',
                                border: 'border-orange-100',
                                icon: 'from-orange-500 to-yellow-500',
                                badge: 'secondary'
                              };
                            default:
                              return {
                                bg: 'from-blue-50 to-cyan-50',
                                border: 'border-blue-100',
                                icon: 'from-blue-500 to-cyan-500',
                                badge: 'default'
                              };
                          }
                        }
                        
                        const colors = getAlertColors(alert.severity);
                        const IconComponent = getAlertIcon(alert.type);
                        
                        return (
                          <div key={alert.id} className={`flex items-start space-x-3 p-3 sm:p-4 bg-gradient-to-r ${colors.bg} rounded-xl border ${colors.border}`}>
                            <div className={`w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r ${colors.icon} rounded-lg sm:rounded-xl flex items-center justify-center`}>
                              <IconComponent className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">{alert.title}</p>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                                {alert.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 sm:mt-2">{alert.timeAgo}</p>
                            </div>
                            <Badge variant={colors.badge as any} className="text-xs">
                              {alert.severity === 'high' ? t('urgent') : alert.severity === 'medium' ? t('medium') : t('general')}
                            </Badge>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>{t('no_alert_information')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 删除快速操作区（即包含“quick_access_to_common_functions”描述的Card及其内容） */}
              </div>
            </div>
          )}

          {activeModule === "face-recognition" && <FaceRecognitionModule />}
          {activeModule === "road-damage" && <RoadDamageModule />}
          {activeModule === "logs" && <LogsModule />}
          {activeModule === "map-analysis" && <MapAnalysisModule />}
          {activeModule === "taxi-analysis" && <TaxiAnalysisModule />}
          {activeModule === "data-visualization" && <DataVisualizationModule />}
          {activeModule === "settings" && <SettingsModule page={settingsPage} />}
        </main>
      </div>

      {/* 移动端底部导航栏 */}
      <BottomNavigation />
    </div>
  )
}
