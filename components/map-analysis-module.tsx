"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Eye, Layers, Filter, Calendar } from "lucide-react"

export default function MapAnalysisModule() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("today")
  const [selectedLayer, setSelectedLayer] = useState("heatmap")

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">地图时空分析</h2>
          <p className="text-gray-600 mt-1">基于济南地图的时空数据分析与可视化</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            全屏显示
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            导出分析报告
          </Button>
        </div>
      </div>

      {/* 控制面板 */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">时间范围</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">图层类型</label>
              <Select value={selectedLayer} onValueChange={setSelectedLayer}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heatmap">热力图</SelectItem>
                  <SelectItem value="trajectory">轨迹图</SelectItem>
                  <SelectItem value="hotspots">热门上客点</SelectItem>
                  <SelectItem value="flow">客流分析</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">起始时间</label>
              <Input type="datetime-local" className="h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">结束时间</label>
              <Input type="datetime-local" className="h-12" />
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <Button variant="outline" className="bg-transparent">
              <Filter className="w-4 h-4 mr-2" />
              高级筛选
            </Button>
            <Button variant="outline" className="bg-transparent">
              <Layers className="w-4 h-4 mr-2" />
              图层管理
            </Button>
            <Button variant="outline" className="bg-transparent">
              <Calendar className="w-4 h-4 mr-2" />
              时间轴播放
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 地图显示区域 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">济南市交通时空分析地图</CardTitle>
          <CardDescription>
            当前显示:{" "}
            {selectedLayer === "heatmap"
              ? "出租车热力图"
              : selectedLayer === "trajectory"
                ? "乘客轨迹分析"
                : selectedLayer === "hotspots"
                  ? "热门上客点分布"
                  : "客流分析"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl h-96 flex items-center justify-center relative overflow-hidden">
            {/* 模拟济南地图 */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-blue-100">
              {/* 主要道路 */}
              <div className="absolute top-1/4 left-0 right-0 h-2 bg-gray-400 opacity-60"></div>
              <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-500 opacity-70"></div>
              <div className="absolute top-3/4 left-0 right-0 h-2 bg-gray-400 opacity-60"></div>
              <div className="absolute left-1/4 top-0 bottom-0 w-2 bg-gray-400 opacity-60"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-gray-500 opacity-70"></div>
              <div className="absolute left-3/4 top-0 bottom-0 w-2 bg-gray-400 opacity-60"></div>

              {/* 热力图效果 */}
              {selectedLayer === "heatmap" && (
                <>
                  <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-red-400 opacity-60 rounded-full blur-lg animate-pulse"></div>
                  <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-orange-400 opacity-50 rounded-full blur-lg animate-pulse delay-500"></div>
                  <div className="absolute top-2/3 left-2/3 w-12 h-12 bg-yellow-400 opacity-40 rounded-full blur-lg animate-pulse delay-1000"></div>
                </>
              )}

              {/* 轨迹线条 */}
              {selectedLayer === "trajectory" && (
                <>
                  <svg className="absolute inset-0 w-full h-full">
                    <path
                      d="M50,50 Q150,100 250,80 T450,120"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      fill="none"
                      opacity="0.7"
                    />
                    <path
                      d="M100,200 Q200,150 300,180 T500,160"
                      stroke="#10b981"
                      strokeWidth="3"
                      fill="none"
                      opacity="0.7"
                    />
                    <path
                      d="M80,300 Q180,250 280,280 T480,260"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      fill="none"
                      opacity="0.7"
                    />
                  </svg>
                </>
              )}

              {/* 热门上客点 */}
              {selectedLayer === "hotspots" && (
                <>
                  <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-red-600 rounded-full shadow-lg"></div>
                  <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-orange-600 rounded-full shadow-lg"></div>
                  <div className="absolute top-2/3 left-1/3 w-4 h-4 bg-green-600 rounded-full shadow-lg"></div>
                  <div className="absolute top-1/2 left-3/4 w-4 h-4 bg-blue-600 rounded-full shadow-lg"></div>
                </>
              )}
            </div>

            {/* 地图标签 */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <h4 className="font-semibold text-gray-800 mb-2">济南市</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>经度: 117.0009°E</p>
                <p>纬度: 36.6758°N</p>
                <p>缩放: 12级</p>
              </div>
            </div>

            {/* 图例 */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <h5 className="font-semibold text-gray-800 mb-2">图例</h5>
              {selectedLayer === "heatmap" && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>高密度区域</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>中密度区域</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>低密度区域</span>
                  </div>
                </div>
              )}
              {selectedLayer === "trajectory" && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-blue-500"></div>
                    <span>主要路线</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-green-500"></div>
                    <span>次要路线</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-1 bg-yellow-500"></div>
                    <span>辅助路线</span>
                  </div>
                </div>
              )}
              {selectedLayer === "hotspots" && (
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span>火车站</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                    <span>商业区</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span>住宅区</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span>机场</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分析结果 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">时空分析结果</CardTitle>
            <CardDescription>基于选定时间范围的数据分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">总订单数</p>
                <p className="text-2xl font-bold text-blue-600">12,456</p>
                <p className="text-xs text-green-600">↑ 15.3%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">平均距离</p>
                <p className="text-2xl font-bold text-green-600">8.5km</p>
                <p className="text-xs text-red-600">↓ 2.1%</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">热门时段</p>
                <p className="text-2xl font-bold text-orange-600">18:00</p>
                <p className="text-xs text-gray-600">晚高峰</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">活跃区域</p>
                <p className="text-2xl font-bold text-purple-600">历下区</p>
                <p className="text-xs text-gray-600">商业中心</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">热门上客点排行</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">1</Badge>
                    <span className="text-sm">济南火车站</span>
                  </div>
                  <span className="text-sm font-medium">2,345次</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">2</Badge>
                    <span className="text-sm">泉城广场</span>
                  </div>
                  <span className="text-sm font-medium">1,876次</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">3</Badge>
                    <span className="text-sm">济南机场</span>
                  </div>
                  <span className="text-sm font-medium">1,234次</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">时间分布分析</CardTitle>
            <CardDescription>24小时客流量变化趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-t from-blue-50 to-white rounded-lg flex items-end justify-center p-4">
              {/* 模拟柱状图 */}
              <div className="flex items-end space-x-2 h-full">
                {Array.from({ length: 24 }, (_, i) => {
                  const height = Math.random() * 80 + 20
                  const isHighPeak = i === 8 || i === 18 // 早晚高峰
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className={`w-3 ${isHighPeak ? "bg-red-500" : "bg-blue-500"} rounded-t`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{i}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                高峰时段: <span className="text-red-600 font-medium">8:00-9:00, 18:00-19:00</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
