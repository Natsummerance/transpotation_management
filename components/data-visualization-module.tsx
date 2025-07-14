"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker" // 你需要有日期选择器组件
import EChartPanel from "@/components/EChartPanel"

const today = new Date().toISOString().slice(0, 10)
const weekAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().slice(0, 10)

export default function DataVisualizationModule() {
  // 全局时间筛选
  const [start, setStart] = useState(weekAgo)
  const [end, setEnd] = useState(today)

  // 各主题数据
  const [damage, setDamage] = useState<any>(null)
  const [faceLogin, setFaceLogin] = useState<any>(null)
  const [systemLogs, setSystemLogs] = useState<any>(null)
  const [taxi, setTaxi] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 拉取所有数据
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/visual/damage-reports?start=${start}&end=${end}`).then(r => r.json()),
      fetch(`/api/visual/face-login?start=${start}&end=${end}`).then(r => r.json()),
      fetch(`/api/visual/system-logs?start=${start}&end=${end}`).then(r => r.json()),
      fetch(`/api/visual/taxi-gps?start=${start}&end=${end}`).then(r => r.json()),
      fetch(`/api/visual/user?start=${start}&end=${end}`).then(r => r.json()),
    ]).then(([d, f, s, t, u]) => {
      setDamage(d)
      setFaceLogin(f)
      setSystemLogs(s)
      setTaxi(t)
      setUser(u)
    }).finally(() => setLoading(false))
  }, [start, end])

  // 图表option生成函数（仅举例，实际可更炫酷美化）
  const getBarOption = (title: string, x: string[], y: number[], color = '#5470c6') => ({
    title: { text: title, left: 'center' },
    tooltip: {},
    xAxis: { type: 'category', data: x },
    yAxis: { type: 'value' },
    series: [{ data: y, type: 'bar', itemStyle: { color } }],
    grid: { left: 40, right: 20, bottom: 40, top: 60 }
  })
  const getPieOption = (title: string, data: { name: string, value: number }[]) => ({
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['40%', '70%'], data, label: { show: true, formatter: '{b}: {d}%'} }]
  })
  const getLineOption = (title: string, x: string[], y: number[], color = '#91cc75') => ({
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: x },
    yAxis: { type: 'value' },
    series: [{ data: y, type: 'line', smooth: true, areaStyle: {}, itemStyle: { color } }],
    grid: { left: 40, right: 20, bottom: 40, top: 60 }
  })

  // 1. 路面损坏
  const damageTypePie = damage && getPieOption('损坏类型分布', damage.typeStats?.map((d: any) => ({ name: d.type, value: d.count })) || [])
  const damageTrendLine = damage && getLineOption('损坏上报趋势', damage.timeTrend?.map((d: any) => d.date), damage.timeTrend?.map((d: any) => d.count))

  // 2. 人脸与登录
  const loginTypePie = faceLogin && getPieOption('登录方式分布', faceLogin.loginTypeStats?.map((d: any) => ({ name: d.type, value: d.count })) || [])
  const loginTrendLine = faceLogin && getLineOption('登录趋势', faceLogin.loginStatusTrend?.map((d: any) => d.date), faceLogin.loginStatusTrend?.map((d: any) => d.success))
  const faceFailLine = faceLogin && getLineOption('人脸识别失败趋势', faceLogin.faceFailTrend?.map((d: any) => d.date), faceLogin.faceFailTrend?.map((d: any) => d.count), '#ee6666')

  // 3. 系统日志
  const logTypePie = systemLogs && getPieOption('日志类型分布', systemLogs.typeStats?.map((d: any) => ({ name: d.type, value: d.count })) || [])
  const logLevelPie = systemLogs && getPieOption('日志级别分布', systemLogs.levelStats?.map((d: any) => ({ name: d.level, value: d.count })) || [])
  const logTrendLine = systemLogs && getLineOption('日志趋势', systemLogs.timeTrend?.map((d: any) => d.date), systemLogs.timeTrend?.map((d: any) => d.count))

  // 4. 出租车
  const taxiStatusPie = taxi && getPieOption('载客状态分布', taxi.occupiedStats?.map((d: any) => ({ name: d.status, value: d.count })) || [])
  const taxiEventBar = taxi && getBarOption('事件分布', taxi.eventStats?.map((d: any) => d.event), taxi.eventStats?.map((d: any) => d.count), '#fac858')
  const taxiPeakLine = taxi && getLineOption('运营高峰', taxi.peakStats?.map((d: any) => d.hour + '时'), taxi.peakStats?.map((d: any) => d.count), '#73c0de')

  // 5. 用户
  const userRegLine = user && getLineOption('用户注册趋势', user.regTrend?.map((d: any) => d.date), user.regTrend?.map((d: any) => d.count))
  const userRolePie = user && getPieOption('用户角色分布', user.roleStats?.map((d: any) => ({ name: d.role, value: d.count })) || [])
  const userStatusPie = user && getPieOption('用户状态分布', user.statusStats?.map((d: any) => ({ name: d.status, value: d.count })) || [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">统计图表分析</h2>
          <p className="text-gray-600 mt-1">多维度数据可视化分析与统计图表</p>
        </div>
        <div className="flex space-x-3">
          <DatePicker value={[start, end]} onChange={([s, e]: [string, string]) => { setStart(s); setEnd(e) }} />
        </div>
      </div>

      {/* 路面损坏 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>路面损坏统计</CardTitle>
          <CardDescription>损坏类型分布、趋势、地理热力等</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EChartPanel option={damageTypePie} loading={loading} height={350} />
            <EChartPanel option={damageTrendLine} loading={loading} height={350} />
          </div>
        </CardContent>
      </Card>

      {/* 人脸与登录 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>人脸识别与登录统计</CardTitle>
          <CardDescription>登录方式、趋势、失败率、活跃用户</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EChartPanel option={loginTypePie} loading={loading} height={350} />
            <EChartPanel option={loginTrendLine} loading={loading} height={350} />
            <EChartPanel option={faceFailLine} loading={loading} height={350} />
          </div>
        </CardContent>
      </Card>

      {/* 系统日志 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>系统日志分析</CardTitle>
          <CardDescription>类型、级别、趋势、异常明细</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EChartPanel option={logTypePie} loading={loading} height={350} />
            <EChartPanel option={logLevelPie} loading={loading} height={350} />
            <EChartPanel option={logTrendLine} loading={loading} height={350} />
          </div>
        </CardContent>
      </Card>

      {/* 出租车 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>出租车GPS与运营分析</CardTitle>
          <CardDescription>载客状态、事件、速度、运营高峰</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EChartPanel option={taxiStatusPie} loading={loading} height={350} />
            <EChartPanel option={taxiEventBar} loading={loading} height={350} />
            <EChartPanel option={taxiPeakLine} loading={loading} height={350} />
          </div>
        </CardContent>
      </Card>

      {/* 用户统计 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>用户统计</CardTitle>
          <CardDescription>注册趋势、角色、状态、来源</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EChartPanel option={userRegLine} loading={loading} height={350} />
            <EChartPanel option={userRolePie} loading={loading} height={350} />
            <EChartPanel option={userStatusPie} loading={loading} height={350} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
