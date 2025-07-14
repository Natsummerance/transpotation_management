"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Download, Eye, Filter } from "lucide-react"

export default function DataVisualizationModule() {
  const [chartType, setChartType] = useState("bar")
  const [timeRange, setTimeRange] = useState("week")
  const [metric, setMetric] = useState("traffic")

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">统计图表分析</h2>
          <p className="text-gray-600 mt-1">多维度数据可视化分析与统计图表</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            全屏显示
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            导出图表
          </Button>
        </div>
      </div>

      {/* 控制面板 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">柱状图</SelectItem>
                <SelectItem value="line">折线图</SelectItem>
                <SelectItem value="pie">饼图</SelectItem>
                <SelectItem value="scatter">散点图</SelectItem>
              </SelectContent>
            </Select>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="traffic">客流变化</SelectItem>
                <SelectItem value="distance">订单距离</SelectItem>
                <SelectItem value="speed">道路速度</SelectItem>
                <SelectItem value="revenue">收入分析</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">今天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="year">本年</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              自定义筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 主要图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {metric === "traffic"
                ? "客流变化趋势"
                : metric === "distance"
                  ? "订单距离分布"
                  : metric === "speed"
                    ? "道路平均速度"
                    : "收入变化分析"}
            </CardTitle>
            <CardDescription>
              {timeRange === "day" ? "今日" : timeRange === "week" ? "本周" : timeRange === "month" ? "本月" : "本年"}
              数据统计
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gradient-to-t from-blue-50 to-white rounded-lg flex items-end justify-center p-4">
              {chartType === "bar" && (
                <div className="flex items-end space-x-2 h-full w-full">
                  {Array.from({ length: 12 }, (_, i) => {
                    const height = 20 + Math.random() * 70
                    return (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">{i + 1}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {chartType === "line" && (
                <div className="relative w-full h-full">
                  <svg className="w-full h-full">
                    <polyline
                      points="20,200 60,150 100,180 140,120 180,160 220,100 260,140 300,80 340,120 380,60"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />
                    {[20, 60, 100, 140, 180, 220, 260, 300, 340, 380].map((x, i) => {
                      const y = [200, 150, 180, 120, 160, 100, 140, 80, 120, 60][i]
                      return <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" />
                    })}
                  </svg>
                </div>
              )}

              {chartType === "pie" && (
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
                      strokeDasharray="150 350"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="16"
                      strokeDasharray="100 400"
                      strokeDashoffset="-150"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="16"
                      strokeDasharray="75 425"
                      strokeDashoffset="-250"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="16"
                      strokeDasharray="75 425"
                      strokeDashoffset="-325"
                    />
                  </svg>
                </div>
              )}

              {chartType === "scatter" && (
                <div className="relative w-full h-full">
                  <svg className="w-full h-full">
                    {Array.from({ length: 50 }, (_, i) => (
                      <circle
                        key={i}
                        cx={Math.random() * 350 + 25}
                        cy={Math.random() * 250 + 25}
                        r={Math.random() * 6 + 2}
                        fill="#3b82f6"
                        opacity="0.6"
                      />
                    ))}
                  </svg>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">关键指标对比</CardTitle>
            <CardDescription>多维度数据对比分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">当前值</p>
                  <p className="text-2xl font-bold text-blue-600">12,456</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                    <span className="text-sm text-green-600">+15.3%</span>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">目标值</p>
                  <p className="text-2xl font-bold text-green-600">15,000</p>
                  <div className="text-sm text-gray-600 mt-1">完成度: 83%</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>客流量</span>
                    <span>83%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "83%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>订单完成率</span>
                    <span>95%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "95%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>用户满意度</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: "88%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>系统稳定性</span>
                    <span>99%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: "99%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细数据表格 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">数据详情</CardTitle>
          <CardDescription>详细的统计数据表格</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">时间段</th>
                  <th className="text-left py-3 px-4">指标</th>
                  <th className="text-left py-3 px-4">数值</th>
                  <th className="text-left py-3 px-4">变化</th>
                  <th className="text-left py-3 px-4">状态</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { time: "00:00-06:00", metric: "客流量", value: "1,234", change: "+5.2%", status: "正常" },
                  { time: "06:00-12:00", metric: "客流量", value: "8,567", change: "+12.3%", status: "繁忙" },
                  { time: "12:00-18:00", metric: "客流量", value: "6,789", change: "+8.7%", status: "正常" },
                  { time: "18:00-24:00", metric: "客流量", value: "4,321", change: "+3.1%", status: "正常" },
                ].map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4">{row.time}</td>
                    <td className="py-3 px-4">{row.metric}</td>
                    <td className="py-3 px-4 font-medium">{row.value}</td>
                    <td className="py-3 px-4 text-green-600">{row.change}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          row.status === "繁忙" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
