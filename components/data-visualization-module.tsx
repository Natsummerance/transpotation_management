"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Download, Eye, Filter, Calendar, CloudRain, Thermometer, Wind, Droplets, Loader2, Sun, Cloud, CloudSun, CloudRainWind, Snowflake } from "lucide-react"

// 生成半天粒度的缓存文件名
function getCacheSpan(start: string, end: string) {
  function parse(dt: string) {
    const d = new Date(dt);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const h = d.getHours();
    const half = h >= 12 ? 1 : 0;
    return `${y}-${m}-${day}-${half}`;
  }
  return `${parse(start)}_${parse(end)}`;
}

function getCachePath(module: string, file: string) {
  return `/api/cache/taxi/${module}/${file}.json`;
}

async function loadCache(module: string, file: string, setData: (d:any)=>void) {
  const url = getCachePath(module, file);
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setData(data);
      return true;
    }
  } catch {}
  return false;
}

async function saveCache(module: string, file: string, data: any) {
  const url = getCachePath(module, file);
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch {}
}

const MODULE = 'data-visualization';

export default function DataVisualizationModule() {
  const [chartType, setChartType] = useState("bar")
  const [timeRange, setTimeRange] = useState("week")
  const [metric, setMetric] = useState("traffic")

  // Weather forecast system state
  const [weatherDate, setWeatherDate] = useState(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  })
  const [weatherData, setWeatherData] = useState<any[]>([])
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [weatherMetric, setWeatherMetric] = useState("temperature") // 新增：柱状图指标
  const [weekWeather, setWeekWeather] = useState<any[]>([])
  const [weekLoading, setWeekLoading] = useState(false)

  // 获取近7天数据
  useEffect(() => {
    setWeekLoading(true)
    const today = new Date(weatherDate)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      return d.toISOString().slice(0, 10)
    })
    Promise.all(days.map(day =>
      fetch(`/api/weather?start_time=${day} 00:00:00&end_time=${day} 23:59:59`)
        .then(res => res.json())
        .then(data => ({ date: day, weather: data.weather || [] }))
    )).then(arr => {
      setWeekWeather(arr)
      setWeekLoading(false)
    })
  }, [weatherDate])

  // 近7天最高/最低温
  const weekTempTrend = useMemo(() => {
    return weekWeather.map(day => {
      const temps = day.weather.map((d: any) => d.temperature)
      return {
        date: day.date,
        max: temps.length ? Math.max(...temps) : null,
        min: temps.length ? Math.min(...temps) : null
      }
    })
  }, [weekWeather])

  // 近7天天气类型分布
  const weekWeatherTypePie = useMemo(() => {
    // 简单规则：降水>2为雨，温度<2为雪，风速>7为风，其余晴/多云
    let typeCount: Record<string, number> = { "晴": 0, "多云": 0, "雨": 0, "雪": 0, "风": 0 }
    weekWeather.forEach(day => {
      let rain = 0, snow = 0, wind = 0, sun = 0, cloud = 0
      day.weather.forEach((d: any) => {
        if (d.precip > 2) rain++
        else if (d.temperature < 2) snow++
        else if (d.wind_speed > 7) wind++
        else if (d.temperature > 22) sun++
        else cloud++
      })
      const arr = [rain, snow, wind, sun, cloud]
      const idx = arr.indexOf(Math.max(...arr))
      const type = ["雨", "雪", "风", "晴", "多云"][idx]
      typeCount[type]++
    })
    return Object.entries(typeCount).map(([type, count]) => ({ type, count }))
  }, [weekWeather])

  // 当前天的小时数据
  const hourWeather = weatherData

  useEffect(() => {
    // Fetch weather data for the selected date
    const start = `${weatherDate} 00:00:00`
    const end = `${weatherDate} 23:59:59`
    setWeatherLoading(true)
    setWeatherError(null)
    loadCache(MODULE, getCacheSpan(start, end), (cachedData) => {
      if (cachedData) {
        setWeatherData(cachedData.weather || [])
        setWeatherLoading(false)
      } else {
        fetch(`/api/weather?start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`)
          .then(res => res.json())
          .then(data => {
            setWeatherData(data.weather || [])
            setWeatherLoading(false)
            saveCache(MODULE, getCacheSpan(start, end), data)
          })
          .catch(err => {
            setWeatherError("天气数据加载失败")
            setWeatherLoading(false)
          })
      }
    })
  }, [weatherDate])

  // 选取主天气icon（根据温度/降水/风速）
  const getMainWeatherIcon = () => {
    if (!weatherData.length) return <Cloud className="w-10 h-10 text-blue-300" />
    const avgTemp = weatherData.reduce((a, b) => a + b.temperature, 0) / weatherData.length
    const maxPrecip = Math.max(...weatherData.map(d => d.precip))
    const maxWind = Math.max(...weatherData.map(d => d.wind_speed))
    if (maxPrecip > 2) return <CloudRainWind className="w-10 h-10 text-cyan-500" />
    if (avgTemp < 2) return <Snowflake className="w-10 h-10 text-blue-400" />
    if (avgTemp > 28) return <Sun className="w-10 h-10 text-yellow-400" />
    if (maxWind > 7) return <Wind className="w-10 h-10 text-blue-400" />
    if (avgTemp > 18) return <CloudSun className="w-10 h-10 text-yellow-300" />
    return <Cloud className="w-10 h-10 text-blue-300" />
  }

  // 判断日期是否在有效区间
  const minDate = "2013-09-12"
  const maxDate = "2013-09-18"
  const validDates = [
    "2013-09-12",
    "2013-09-13",
    "2013-09-14",
    "2013-09-15",
    "2013-09-16",
    "2013-09-17",
    "2013-09-18"
  ]
  const isValidWeatherDate = validDates.includes(weatherDate)

  // Weather chart rendering
  const renderWeatherChart = () => {
    if (!isValidWeatherDate) {
      return <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-gray-100 to-blue-50 rounded-xl shadow-inner">
        <span className="text-lg font-bold">仅支持2013-09-12至2013-09-18的天气数据</span>
      </div>
    }
    if (weatherLoading) {
      return <div className="h-64 flex flex-col items-center justify-center text-blue-600 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl shadow-inner">
        <span className="animate-spin mb-2"><Loader2 className="w-8 h-8" /></span>
        <div className="text-lg font-bold">天气数据加载中...</div>
      </div>
    }
    if (weatherError) {
      return <div className="h-64 flex flex-col items-center justify-center text-red-600 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl shadow-inner">
        <CloudRain className="w-8 h-8 mb-2" />
        <div className="text-lg font-bold">{weatherError}</div>
      </div>
    }
    if (!weatherData.length) {
      return <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-gray-100 to-blue-50 rounded-xl shadow-inner">
        <Cloud className="w-8 h-8 mb-2" />
        <div className="text-lg font-bold">暂无天气数据</div>
      </div>
    }
    // Prepare chart data
    const temps = weatherData.map((d: any) => d.temperature)
    const winds = weatherData.map((d: any) => d.wind_speed)
    const precs = weatherData.map((d: any) => d.precip)
    const hums = weatherData.map((d: any) => d.Humidity)
    const times = weatherData.map((d: any) => d.time_new.slice(11, 16))
    // Chart dimensions
    const W = 700, H = 240, pad = 48
    // Y scales
    const tempMax = Math.max(...temps, 40), tempMin = Math.min(...temps, -10)
    const windMax = Math.max(...winds, 10)
    const precMax = Math.max(...precs, 10)
    const humMax = 100
    // X scale
    const xStep = (W - pad * 2) / (weatherData.length - 1 || 1)
    // Helper to scale
    const yTemp = (v: number) => H - pad - ((v - tempMin) / (tempMax - tempMin)) * (H - pad * 2)
    const yWind = (v: number) => H - pad - (v / windMax) * (H - pad * 2)
    const yPrecip = (v: number) => H - pad - (v / precMax) * (H - pad * 2)
    const yHum = (v: number) => H - pad - (v / humMax) * (H - pad * 2)
    // 平滑曲线生成器（Catmull-Rom）
    function smoothLine(arr: number[], y: (v: number) => number) {
      if (arr.length < 2) return ''
      const points = arr.map((v, i) => [pad + i * xStep, y(v)])
      let d = `M${points[0][0]},${points[0][1]}`
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1]
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6
        d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
      }
      return d
    }
    // 主温度大字
    const mainTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
    return (
      <div className="relative w-full overflow-x-auto">
        <div className="absolute left-6 top-2 flex items-center space-x-2 z-10">
          {getMainWeatherIcon()}
          <span className="text-4xl font-bold text-red-500 drop-shadow-lg">{mainTemp}℃</span>
          <span className="text-base text-gray-500 font-medium">{weatherDate}</span>
        </div>
        <svg width={W} height={H} className="bg-gradient-to-t from-blue-100 via-white to-cyan-100 rounded-xl shadow-lg">
          {/* Axes */}
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#bbb" strokeWidth={1} />
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#bbb" strokeWidth={1} />
          {/* 湿度面积 */}
          <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.12" />
          </linearGradient>
          <polygon points={[
            `${pad},${H - pad}`,
            ...hums.map((v, i) => `${pad + i * xStep},${yHum(v)}`),
            `${W - pad},${H - pad}`
          ].join(" ")} fill="url(#humGrad)" />
          {/* 温度线（带阴影） */}
          <polyline points={temps.map((v, i) => `${pad + i * xStep},${yTemp(v)}`).join(" ")} fill="none" stroke="#ef4444" strokeWidth={3.5} filter="url(#tempShadow)" />
          <defs>
            <filter id="tempShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#ef444488" />
            </filter>
          </defs>
          {/* 温度圆点高亮 */}
          {temps.map((v, i) => (
            <circle key={i} cx={pad + i * xStep} cy={yTemp(v)} r={5} fill="#fff" stroke="#ef4444" strokeWidth={2} filter="url(#tempShadow)" />
          ))}
          {/* 风速/降水平滑曲线 */}
          <path d={smoothLine(winds, yWind)} fill="none" stroke="#3b82f6" strokeWidth={2.2} strokeDasharray="5 3" />
          <path d={smoothLine(precs, yPrecip)} fill="none" stroke="#06b6d4" strokeWidth={2.2} strokeDasharray="2 2" />
          {/* Y axis labels (温度) */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
            <text key={idx} x={pad - 10} y={pad + p * (H - pad * 2)} fontSize={13} fill="#888" textAnchor="end">
              {Math.round(tempMax - p * (tempMax - tempMin))}℃
            </text>
          ))}
          {/* X axis labels + 小圆点 */}
          {times.map((t, i) => (
            <g key={i}>
              <circle cx={pad + i * xStep} cy={H - pad + 8} r={4} fill="#e0e7ef" />
              <text x={pad + i * xStep} y={H - pad + 24} fontSize={12} fill="#888" textAnchor="middle">{t}</text>
            </g>
          ))}
        </svg>
        {/* Legend */}
        <div className="flex space-x-6 mt-4 ml-2 text-base">
          <span className="flex items-center text-red-500 font-semibold"><Thermometer className="w-5 h-5 mr-1" />温度</span>
          <span className="flex items-center text-blue-500 font-semibold"><Wind className="w-5 h-5 mr-1" />风速</span>
          <span className="flex items-center text-cyan-500 font-semibold"><CloudRain className="w-5 h-5 mr-1" />降水</span>
          <span className="flex items-center text-indigo-500 font-semibold"><Droplets className="w-5 h-5 mr-1" />湿度</span>
        </div>
      </div>
    )
  }

  // --- 柱状图 ---
  const renderBarChart = () => {
    console.log('hourWeather', hourWeather, 'weatherMetric', weatherMetric)
    if (!hourWeather.length) return <div className="h-48 flex items-center justify-center text-gray-400">暂无小时天气数据</div>
    const arr = hourWeather.map((d: any) => weatherMetric === "Humidity" ? d.Humidity : d[weatherMetric])
    if (!arr.length || arr.every(v => v === undefined || v === null)) {
      return <div className="h-48 flex items-center justify-center text-gray-400">暂无该指标数据</div>
    }
    const times = hourWeather.map((d: any) => d.time_new.slice(11, 13))
    const max = weatherMetric === "Humidity" ? 100 : Math.max(...arr)
    const color = weatherMetric === "temperature" ? "#ef4444" : weatherMetric === "wind_speed" ? "#3b82f6" : weatherMetric === "precip" ? "#06b6d4" : "#6366f1"
    const label = weatherMetric === "temperature" ? "温度(℃)" : weatherMetric === "wind_speed" ? "风速(m/s)" : weatherMetric === "precip" ? "降水(mm)" : "湿度(%)"
    const [hoverIdx, setHoverIdx] = useState<number|null>(null)
    return (
      <div className="relative w-full max-w-3xl mx-auto h-64 bg-gradient-to-t from-blue-50 to-white rounded-2xl flex items-end justify-center p-4 shadow-xl">
        <div className="flex items-end space-x-2 h-full w-full justify-center">
          {arr.map((v, i) => (
            <div key={i} className="flex flex-col items-center flex-1 relative"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}>
              {/* 气泡 */}
              {hoverIdx === i && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-xl px-3 py-1 text-sm font-bold text-blue-700 z-10 border border-blue-100">
                  {v}
                </div>
              )}
              <div
                className="w-full rounded-t-xl shadow-md transition-all duration-300 hover:scale-105"
                style={{ height: `${(v / max) * 90 + 10}%`, background: color, opacity: 0.92, boxShadow: '0 4px 16px #60a5fa22' }}
                title={v}
              ></div>
              <span className="text-xs text-gray-500 mt-1 flex flex-col items-center">
                <span className="inline-block w-2 h-2 rounded-full mb-0.5" style={{background: color, opacity: 0.7}}></span>
                {times[i]}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute left-4 top-4 text-base font-bold text-gray-700">{label}</div>
      </div>
    )
  }

  // --- 折线图 ---
  function WeekLineChart({ data }: { data: { date: string, max: number|null, min: number|null }[] }) {
    if (!data.length) return null
    const W = 420, H = 180, pad = 36
    const maxT = Math.max(...data.map(d => d.max !== null ? d.max : -99))
    const minT = Math.min(...data.map(d => d.min !== null ? d.min : 99))
    const xStep = (W - pad * 2) / (data.length - 1 || 1)
    const y = (v: number) => H - pad - ((v - minT) / (maxT - minT)) * (H - pad * 2)
    const [hoverIdx, setHoverIdx] = useState<number|null>(null)
    return (
      <div className="w-full flex justify-center relative">
        <svg width={W} height={H} className="bg-gradient-to-t from-white via-blue-50 to-blue-100 rounded-2xl shadow max-w-full">
          {/* 渐变定义 */}
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="minGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          {/* 最高温 */}
          <polyline points={data.map((d, i) => `${pad + i * xStep},${y(d.max !== null ? d.max : minT)}`).join(" ")} fill="none" stroke="url(#tempGrad)" strokeWidth={2.5} />
          {/* 最低温 */}
          <polyline points={data.map((d, i) => `${pad + i * xStep},${y(d.min !== null ? d.min : minT)}`).join(" ")} fill="none" stroke="url(#minGrad)" strokeWidth={2.5} />
          {/* 圆点+气泡 */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={pad + i * xStep} cy={y(d.max !== null ? d.max : minT)} r={4} fill="#fff" stroke="#ef4444" strokeWidth={2}
                onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} />
              <circle cx={pad + i * xStep} cy={y(d.min !== null ? d.min : minT)} r={4} fill="#fff" stroke="#3b82f6" strokeWidth={2}
                onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} />
              {hoverIdx === i && (
                <g>
                  <rect x={pad + i * xStep - 24} y={y(d.max !== null ? d.max : minT) - 38} width={48} height={22} rx={7} fill="#fff" stroke="#ef4444" strokeWidth={1} />
                  <text x={pad + i * xStep} y={y(d.max !== null ? d.max : minT) - 24} textAnchor="middle" fontSize={13} fill="#ef4444" fontWeight="bold">{d.max}℃</text>
                  <rect x={pad + i * xStep - 24} y={y(d.min !== null ? d.min : minT) + 8} width={48} height={22} rx={7} fill="#fff" stroke="#3b82f6" strokeWidth={1} />
                  <text x={pad + i * xStep} y={y(d.min !== null ? d.min : minT) + 24} textAnchor="middle" fontSize={13} fill="#3b82f6" fontWeight="bold">{d.min}℃</text>
                </g>
              )}
            </g>
          ))}
          {/* X轴日期 */}
          {data.map((d, i) => (
            <text key={i} x={pad + i * xStep} y={H - pad + 18} fontSize={12} fill="#666" textAnchor="middle">{d.date.slice(5)}</text>
          ))}
        </svg>
        {/* 图例 */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 flex space-x-6 bg-white/80 px-3 py-1 rounded-xl shadow text-sm font-semibold">
          <span className="flex items-center text-red-500"><span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-1" />最高温</span>
          <span className="flex items-center text-blue-500"><span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-1" />最低温</span>
        </div>
      </div>
    )
  }

  // --- 环形图 ---
  function PieChart({ data }: { data: { type: string, count: number }[] }) {
    if (!data.length) return null
    const total = data.reduce((a, b) => a + b.count, 0) || 1
    const colors = ["#fbbf24", "#67e8f9", "#a5b4fc", "#fca5a5", "#93c5fd"]
    let acc = 0
    // 计算每个扇区的起止角度
    const sectors = data.map((seg, i) => {
      const start = acc / total * 2 * Math.PI
      const end = (acc + seg.count) / total * 2 * Math.PI
      acc += seg.count
      return { ...seg, start, end, color: colors[i] }
    })
    // 环形路径生成
    function arcPath(cx: number, cy: number, r1: number, r2: number, start: number, end: number) {
      const x1 = cx + r1 * Math.cos(start), y1 = cy + r1 * Math.sin(start)
      const x2 = cx + r1 * Math.cos(end), y2 = cy + r1 * Math.sin(end)
      const x3 = cx + r2 * Math.cos(end), y3 = cy + r2 * Math.sin(end)
      const x4 = cx + r2 * Math.cos(start), y4 = cy + r2 * Math.sin(start)
      const large = end - start > Math.PI ? 1 : 0
      return `M${x1},${y1} A${r1},${r1} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r2},${r2} 0 ${large} 0 ${x4},${y4} Z`
    }
    const [hoverIdx, setHoverIdx] = useState<number|null>(null)
    return (
      <div className="w-full flex flex-col items-center">
        <svg width={220} height={220} className="rounded-2xl shadow-xl bg-gradient-to-t from-white via-blue-50 to-blue-100 max-w-full">
          {sectors.map((seg, i) => (
            <path key={i} d={arcPath(110, 110, 90, 60, seg.start, seg.end)} fill={seg.color} opacity={hoverIdx === i ? 1 : 0.92}
              style={hoverIdx === i ? {filter:'drop-shadow(0 0 12px #60a5fa88)'} : {}} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} />
          ))}
          {/* 中心文字 */}
          <text x={110} y={120} textAnchor="middle" fontSize={36} fill="#374151" fontWeight="bold">{total}</text>
          <text x={110} y={145} textAnchor="middle" fontSize={15} fill="#888">天</text>
          {/* hover百分比 */}
          {hoverIdx !== null && sectors[hoverIdx] && (
            <text x={110} y={80} textAnchor="middle" fontSize={18} fill={sectors[hoverIdx].color} fontWeight="bold">
              {Math.round(sectors[hoverIdx].count/total*100)}%
            </text>
          )}
        </svg>
        {/* 图例横向居中 */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {sectors.map((seg, i) => (
            <span key={i} className="flex items-center text-base font-medium" style={{color: seg.color}}>
              <span className="inline-block w-4 h-4 rounded-full mr-2" style={{background: seg.color}} />
              {seg.type} {seg.count}天
            </span>
          ))}
        </div>
      </div>
    )
  }

  // --- 详细表格 ---
  const renderWeatherTable = () => (
    <div className="overflow-x-auto max-w-3xl mx-auto custom-scrollbar">
      <table className="w-full text-center rounded-2xl overflow-hidden">
        <thead>
          <tr className="border-b bg-gradient-to-r from-blue-100 via-white to-cyan-100">
            <th className="text-center py-3 px-4">时间</th>
            <th className="text-center py-3 px-4">温度(℃)</th>
            <th className="text-center py-3 px-4">风速(m/s)</th>
            <th className="text-center py-3 px-4">降水(mm)</th>
            <th className="text-center py-3 px-4">湿度(%)</th>
          </tr>
        </thead>
        <tbody>
          {hourWeather.map((row: any, index: number) => (
            <tr key={index} className="border-b hover:bg-blue-50 transition rounded-xl">
              <td className="py-3 px-4">{row.time_new.slice(11, 16)}</td>
              <td className="py-3 px-4 font-medium"><span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-600 text-sm">{row.temperature}</span></td>
              <td className="py-3 px-4"><span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-600 text-sm">{row.wind_speed}</span></td>
              <td className="py-3 px-4"><span className="inline-block px-2 py-0.5 rounded bg-cyan-100 text-cyan-600 text-sm">{row.precip}</span></td>
              <td className="py-3 px-4"><span className="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-600 text-sm">{row.Humidity}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`.custom-scrollbar::-webkit-scrollbar{height:8px;background:#e0e7ef;border-radius:4px}.custom-scrollbar::-webkit-scrollbar-thumb{background:#60a5fa;border-radius:4px}`}</style>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* 天气预报系统 */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-100 via-white to-cyan-100 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center"><CloudRain className="w-7 h-7 mr-2 text-blue-500" />天气预报系统</CardTitle>
            <CardDescription className="text-base text-gray-500">基于历史气象数据的可视化天气趋势</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <Select value={weatherDate} onValueChange={setWeatherDate}>
              <SelectTrigger className="w-36 text-base">
                <SelectValue placeholder="选择日期" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {validDates.map(date => (
                  <SelectItem key={date} value={date}>{date}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {renderWeatherChart()}
        </CardContent>
      </Card>
      {/* 天气小时分布柱状图 */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center">小时天气分布</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={weatherMetric} onValueChange={setWeatherMetric}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temperature">温度</SelectItem>
                <SelectItem value="wind_speed">风速</SelectItem>
                <SelectItem value="precip">降水</SelectItem>
                <SelectItem value="Humidity">湿度</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>{renderBarChart()}</CardContent>
      </Card>
      {/* 近7天温度趋势折线图+天气类型饼图 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">近7天温度趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <WeekLineChart data={weekTempTrend} />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">近7天天气类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={weekWeatherTypePie} />
          </CardContent>
        </Card>
      </div>
      {/* 详细数据表格 */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="text-lg font-bold">详细天气数据</CardTitle>
        </CardHeader>
        <CardContent>{renderWeatherTable()}</CardContent>
      </Card>
    </div>
  )
}
