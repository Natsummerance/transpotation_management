"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Car, Camera, Users, Activity, TrendingUp, Shield, Bell, Settings, LogOut } from "lucide-react"
import RoadHazardModule from "@/components/road-hazard-module"
import TrafficFlowModule from "@/components/traffic-flow-module"
import ViolationModule from "@/components/violation-module"

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState("overview")

  const stats = [
    {
      title: "今日道路危害",
      value: "23",
      change: "+12%",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "实时车流量",
      value: "1,247",
      change: "+5%",
      icon: Car,
      color: "text-blue-600",
    },
    {
      title: "违章检测",
      value: "89",
      change: "-8%",
      icon: Camera,
      color: "text-orange-600",
    },
    {
      title: "在线用户",
      value: "156",
      change: "+3%",
      icon: Users,
      color: "text-green-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold">城市交通管理系统</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-64 bg-white shadow-sm h-screen">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeModule === "overview" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveModule("overview")}
            >
              <Activity className="w-4 h-4 mr-2" />
              系统概览
            </Button>
            <Button
              variant={activeModule === "hazard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveModule("hazard")}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              道路危害识别
            </Button>
            <Button
              variant={activeModule === "traffic" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveModule("traffic")}
            >
              <Car className="w-4 h-4 mr-2" />
              车流量监控
            </Button>
            <Button
              variant={activeModule === "violation" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveModule("violation")}
            >
              <Camera className="w-4 h-4 mr-2" />
              违章识别
            </Button>
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-6">
          {activeModule === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">系统概览</h2>
                <p className="text-gray-600">实时监控城市交通状况</p>
              </div>

              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {stat.change}
                          </p>
                        </div>
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 实时警报 */}
              <Card>
                <CardHeader>
                  <CardTitle>实时警报</CardTitle>
                  <CardDescription>最新的交通事件和警报信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <p className="font-medium">道路危害警报</p>
                        <p className="text-sm text-gray-600">中山路与解放路交叉口发现路面坑洞</p>
                      </div>
                      <Badge variant="destructive">紧急</Badge>
                    </div>
                    <div className="flex items-center space-x-4 p-3 bg-orange-50 rounded-lg">
                      <Car className="w-5 h-5 text-orange-600" />
                      <div className="flex-1">
                        <p className="font-medium">交通拥堵</p>
                        <p className="text-sm text-gray-600">人民大道车流量异常，建议分流</p>
                      </div>
                      <Badge variant="secondary">中等</Badge>
                    </div>
                    <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                      <Camera className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium">违章检测</p>
                        <p className="text-sm text-gray-600">建设路监控点检测到闯红灯行为</p>
                      </div>
                      <Badge>一般</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeModule === "hazard" && <RoadHazardModule />}
          {activeModule === "traffic" && <TrafficFlowModule />}
          {activeModule === "violation" && <ViolationModule />}
        </main>
      </div>
    </div>
  )
}
