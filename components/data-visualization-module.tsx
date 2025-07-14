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

  // 统一色板
  const colorPalette = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
  ];
  // 判断深色模式
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // 饼图中心统计
  const getPieTotal = (data: { value: number }[] = []) => data.reduce((sum, d) => sum + (d.value || 0), 0);

  // 饼图美化
  const getPieOption = (title: string, data: { name: string, value: number }[] = [], colorList = colorPalette) => ({
    title: {
      text: title,
      left: 'center',
      top: 20,
      textStyle: { fontWeight: 'bold', fontSize: 20, color: isDark ? '#fff' : '#222' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#222' : '#fff',
      borderRadius: 10,
      textStyle: { color: isDark ? '#fff' : '#222', fontSize: 15 },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      type: 'scroll',
      bottom: 10,
      left: 'center',
      textStyle: { fontSize: 15, color: isDark ? '#fff' : '#333' },
      itemWidth: 18,
      itemHeight: 12
    },
    color: colorList,
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '55%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}: {d}%'
      },
      labelLine: { show: true, length: 20, length2: 10 },
      data,
      emphasis: {
        scale: true,
        itemStyle: { shadowBlur: 30, shadowColor: 'rgba(0,0,0,0.5)' }
      },
      animationType: 'scale',
      animationEasing: 'elasticOut',
      animationDelay: (idx: number) => idx * 80
    }],
    graphic: [{
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: getPieTotal(data) + '\n总数',
        fontSize: 22,
        fontWeight: 'bold',
        fill: isDark ? '#fff' : '#222'
      }
    }]
  });

  // 柱状图美化
  const getBarOption = (title: string, x: string[], y: number[], color = colorPalette[0]) => ({
    title: { text: title, left: 'center', textStyle: { fontWeight: 'bold', fontSize: 20, color: isDark ? '#fff' : '#222' } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: isDark ? '#222' : '#fff', borderRadius: 10, textStyle: { color: isDark ? '#fff' : '#222', fontSize: 15 } },
    legend: { show: false },
    xAxis: { type: 'category', data: x, axisLabel: { rotate: 30, color: isDark ? '#fff' : '#666', fontSize: 13 } },
    yAxis: { type: 'value', axisLabel: { color: isDark ? '#fff' : '#666', fontSize: 13 } },
    dataZoom: [{ type: 'slider', start: 0, end: 100 }],
    series: [{
      data: y,
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color },
            { offset: 1, color: '#fff' }
          ]
        },
        borderRadius: [10, 10, 0, 0],
        shadowBlur: 12,
        shadowColor: color
      },
      label: {
        show: true,
        position: 'top',
        color: isDark ? '#fff' : color,
        fontWeight: 'bold',
        fontSize: 14,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 4,
        padding: [2, 4]
      },
      emphasis: { itemStyle: { shadowBlur: 24, shadowColor: color } },
      markPoint: { data: [{ type: 'max', name: '最大值' }, { type: 'min', name: '最小值' }] },
      markLine: { data: [{ type: 'average', name: '平均值' }] },
      animationEasing: 'elasticOut',
      animationDuration: 1200,
      animationDelay: (idx: number) => idx * 80
    }],
    grid: { left: 40, right: 20, bottom: 70, top: 90 }
  });

  // 折线图美化
  const getLineOption = (title: string, x: string[], y: number[], color = colorPalette[1]) => ({
    title: { text: title, left: 'center', textStyle: { fontWeight: 'bold', fontSize: 20, color: isDark ? '#fff' : '#222' } },
    tooltip: { trigger: 'axis', backgroundColor: isDark ? '#222' : '#fff', borderRadius: 10, textStyle: { color: isDark ? '#fff' : '#222', fontSize: 15 } },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: x,
      axisLabel: { rotate: 45, color: isDark ? '#fff' : '#666', fontSize: 13 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: isDark ? '#fff' : '#666', fontSize: 13 }
    },
    dataZoom: [{ type: 'slider', start: 0, end: 100 }],
    series: [{
      data: y,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 10,
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color },
            { offset: 1, color: '#fff' }
          ]
        }
      },
      itemStyle: { color, shadowBlur: 12, shadowColor: color },
      lineStyle: { width: 4 },
      markPoint: { data: [{ type: 'max', name: '最大值' }, { type: 'min', name: '最小值' }] },
      markLine: { data: [{ type: 'average', name: '平均值' }] },
      label: {
        show: true,
        position: 'top',
        color: isDark ? '#fff' : color,
        fontWeight: 'bold',
        fontSize: 14,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 4,
        padding: [2, 4]
      },
      animationEasing: 'elasticOut',
      animationDuration: 1200,
      animationDelay: (idx: number) => idx * 80
    }],
    grid: { left: 40, right: 20, bottom: 70, top: 90 }
  });

  // 1. 路面损坏
  const damageTypePie = damage && getPieOption('损坏类型分布', damage.typeStats?.map((d: any) => ({ name: d.type, value: d.count })))
  const damageTrendLine = damage && getLineOption('损坏上报趋势', damage.timeTrend?.map((d: any) => d.date), damage.timeTrend?.map((d: any) => d.count))

  // 2. 人脸与登录
  const loginTypePie = faceLogin && getPieOption('登录方式分布', faceLogin.loginTypeStats?.map((d: any) => ({ name: d.type, value: d.count })))
  const loginTrendLine = faceLogin && getLineOption('登录趋势', faceLogin.loginStatusTrend?.map((d: any) => d.date), faceLogin.loginStatusTrend?.map((d: any) => d.success))
  const faceFailLine = faceLogin && getLineOption('人脸识别失败趋势', faceLogin.faceFailTrend?.map((d: any) => d.date), faceLogin.faceFailTrend?.map((d: any) => d.count), '#ee6666')

  // 3. 系统日志
  const logTypePie = systemLogs && getPieOption('日志类型分布', systemLogs.typeStats?.map((d: any) => ({ name: d.type, value: d.count })))
  const logLevelPie = systemLogs && getPieOption('日志级别分布', systemLogs.levelStats?.map((d: any) => ({ name: d.level, value: d.count })))
  const logTrendLine = systemLogs && getLineOption('日志趋势', systemLogs.timeTrend?.map((d: any) => d.date), systemLogs.timeTrend?.map((d: any) => d.count))

  // 4. 出租车
  const taxiStatusPie = taxi && getPieOption('载客状态分布', taxi.occupiedStats?.map((d: any) => ({ name: d.status, value: d.count })))
  const taxiEventBar = taxi && getBarOption('事件分布', taxi.eventStats?.map((d: any) => d.event), taxi.eventStats?.map((d: any) => d.count), '#fac858')
  const taxiPeakLine = taxi && getLineOption('运营高峰', taxi.peakStats?.map((d: any) => d.hour + '时'), taxi.peakStats?.map((d: any) => d.count), '#73c0de')

  // 5. 用户
  const userRegLine = user && getLineOption('用户注册趋势', user.regTrend?.map((d: any) => d.date), user.regTrend?.map((d: any) => d.count))
  const userRolePie = user && getPieOption('用户角色分布', user.roleStats?.map((d: any) => ({ name: d.role, value: d.count })))
  const userStatusPie = user && getPieOption('用户状态分布', user.statusStats?.map((d: any) => ({ name: d.status, value: d.count })))

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
            <EChartPanel option={damageTypePie || {}} loading={loading} height={350} />
            <EChartPanel option={damageTrendLine || {}} loading={loading} height={350} />
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
            <EChartPanel option={loginTypePie || {}} loading={loading} height={350} />
            <EChartPanel option={loginTrendLine || {}} loading={loading} height={350} />
            <EChartPanel option={faceFailLine || {}} loading={loading} height={350} />
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
            <EChartPanel option={logTypePie || {}} loading={loading} height={350} />
            <EChartPanel option={logLevelPie || {}} loading={loading} height={350} />
            <EChartPanel option={logTrendLine || {}} loading={loading} height={350} />
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
            <EChartPanel option={taxiStatusPie || {}} loading={loading} height={350} />
            <EChartPanel option={taxiEventBar || {}} loading={loading} height={350} />
            <EChartPanel option={taxiPeakLine || {}} loading={loading} height={350} />
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
            <EChartPanel option={userRegLine || {}} loading={loading} height={350} />
            <EChartPanel option={userRolePie || {}} loading={loading} height={350} />
            <EChartPanel option={userStatusPie || {}} loading={loading} height={350} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
