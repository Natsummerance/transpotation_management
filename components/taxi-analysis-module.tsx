"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, TrendingUp, MapPin, Download, Eye, BarChart3, Users } from "lucide-react"

export default function TaxiAnalysisModule() {
  const [selectedMetric, setSelectedMetric] = useState("orders")
  const [timeRange, setTimeRange] = useState("today")

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">出租车数据分析</h2>
          <p className="text-gray-600 mt-1">出租车运营数据分析与可视化展示</p>
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

      {/* 控制面板 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">订单分析</SelectItem>
                <SelectItem value="distance">距离分析</SelectItem>
                <SelectItem value="revenue">收入分析</SelectItem>
                <SelectItem value="efficiency">效率分析</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="year">本年</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 bg-transparent">
              <BarChart3 className="w-4 h-4 mr-2" />
              切换图表类型
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总订单数</p>
                <p className="text-3xl font-bold text-blue-600">12,456</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+15.3%</span>
                </div>
              </div>
              <Car className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃车辆</p>
                <p className="text-3xl font-bold text-green-600">2,847</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+8.7%</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均距离</p>
                <p className="text-3xl font-bold text-orange-600">8.5</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-red-600 rotate-180" />
                  <span className="text-sm text-red-600">-2.1%</span>
                </div>
              </div>
              <MapPin className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总收入</p>
                <p className="text-3xl font-bold text-purple-600">¥89.2万</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-sm text-green-600">+12.4%</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 热力图与轨迹分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">出租车热力图</CardTitle>
            <CardDescription>基于订单密度的热力分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-slate-100 to-blue-100 rounded-xl h-80 flex items-center justify-center relative overflow-hidden">
              {/* 模拟济南地图背景 */}
              <div className="absolute inset-0">
                {/* 主要道路 */}
                <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-400 opacity-50"></div>
                <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-500 opacity-60"></div>
                <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-400 opacity-50"></div>
                <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-400 opacity-50"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gray-500 opacity-60"></div>
                <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-gray-400 opacity-50"></div>

                {/* 热力点 */}
                <div className="absolute top-1/3 left-1/3 w-16 h-16 bg-red-500 opacity-70 rounded-full blur-lg animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-orange-500 opacity-60 rounded-full blur-lg animate-pulse delay-500"></div>
                <div className="absolute top-2/3 left-2/3 w-8 h-8 bg-yellow-500 opacity-50 rounded-full blur-lg animate-pulse delay-1000"></div>
                <div className="absolute top-1/4 left-3/4 w-10 h-10 bg-red-400 opacity-60 rounded-full blur-lg animate-pulse delay-1500"></div>
              </div>

              {/* 图例 */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <h5 className="font-semibold text-gray-800 mb-2">订单密度</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>高密度 &gt;100</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>中密度 50-100</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>低密度 &lt;50</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">客流轨迹分析</CardTitle>
            <CardDescription>主要出行路线与流向</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-slate-100 to-green-100 rounded-xl h-80 flex items-center justify-center relative overflow-hidden">
              {/* 模拟地图背景 */}
              <div className="absolute inset-0">
                {/* 主要道路 */}
                <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-400 opacity-50"></div>
                <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-500 opacity-60"></div>
                <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-400 opacity-50"></div>
                <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-400 opacity-50"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gray-500 opacity-60"></div>
                <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-gray-400 opacity-50"></div>

                {/* 轨迹线条 */}
                <svg className="absolute inset-0 w-full h-full">
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                    </marker>
                  </defs>
                  <path
                    d="M50,100 Q150,80 250,120 T400,100"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.8"
                    markerEnd="url(#arrowhead)"
                  />
                  <path
                    d="M100,200 Q200,180 300,220 T450,200"
                    stroke="#10b981"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.8"
                    markerEnd="url(#arrowhead)"
                  />
                  <path
                    d="M80,300 Q180,280 280,320 T430,300"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.8"
                    markerEnd="url(#arrowhead)"
                  />
                </svg>
              </div>

              {/* 图例 */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <h5 className="font-semibold text-gray-800 mb-2">主要流向</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-blue-500"></div>
                    <span>商务区→住宅区</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-green-500"></div>
                    <span>火车站→市中心</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-yellow-500"></div>
                    <span>机场→酒店区</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据分析图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">订单距离分布</CardTitle>
            <CardDescription>不同距离区间的订单占比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {/* 模拟饼图 */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="#e5e7eb" strokeWidth="16" />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="16"
                    strokeDasharray="125.6 376.8"
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray="100.5 401.9"
                    strokeDashoffset="-125.6"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="16"
                    strokeDasharray="75.4 427"
                    strokeDashoffset="-226.1"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="16"
                    strokeDasharray="50.2 452.2"
                    strokeDashoffset="-301.5"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">12,456</p>
                    <p className="text-sm text-gray-600">总订单</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">0-5km (25%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">5-10km (20%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">10-20km (15%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">20km+ (10%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">时段客流变化</CardTitle>
            <CardDescription>24小时订单量变化趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-t from-blue-50 to-white rounded-lg flex items-end justify-center p-4">
              {/* 模拟折线图 */}
              <div className="flex items-end space-x-1 h-full w-full">
                {Array.from({ length: 24 }, (_, i) => {
                  let height = 20 + Math.random() * 30
                  // 模拟早晚高峰
                  if (i >= 7 && i <= 9) height += 30
                  if (i >= 17 && i <= 19) height += 40
                  if (i >= 0 && i <= 5) height = 10 + Math.random() * 10

                  return (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                      {i % 4 === 0 && <span className="text-xs text-gray-500 mt-1">{i}:00</span>}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-600">
              <span>早高峰: 7:00-9:00</span>
              <span>晚高峰: 17:00-19:00</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 热门上客点排行 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">热门上客点排行</CardTitle>
          <CardDescription>基于订单数量的热门地点统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { rank: 1, name: "济南火车站", orders: 2345, growth: "+15.3%" },
              { rank: 2, name: "泉城广场", orders: 1876, growth: "+8.7%" },
              { rank: 3, name: "济南机场", orders: 1234, growth: "+12.1%" },
              { rank: 4, name: "山东大学", orders: 987, growth: "+5.4%" },
              { rank: 5, name: "趵突泉", orders: 756, growth: "+3.2%" },
              { rank: 6, name: "大明湖", orders: 654, growth: "+7.8%" },
            ].map((spot) => (
              <Card key={spot.rank} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={spot.rank <= 3 ? "destructive" : "outline"}>#{spot.rank}</Badge>
                    <span className="text-sm text-green-600 font-medium">{spot.growth}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{spot.name}</h4>
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{spot.orders} 订单</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
