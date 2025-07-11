"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, MapPin, Clock, FileText, Download, AlertTriangle, Camera, Eye, Loader2, Search, RefreshCw } from "lucide-react"
import { toast } from "sonner";

interface DamageResults {
  '纵向裂缝': {
    count: number
    confidence: number
  }
  '横向裂缝': {
    count: number
    confidence: number
  }
  '龟裂': {
    count: number
    confidence: number
  }
  '坑洼': {
    count: number
    confidence: number
  }
}

interface DamageStats {
  count: number;
  confidence: number;
}

interface DetectionResponse {
  results: {
    '纵向裂缝': DamageStats;
    '横向裂缝': DamageStats;
    '龟裂': DamageStats;
    '坑洼': DamageStats;
  };
  originalImage?: string;
  resultImage?: string;
}

// 检测历史记录接口
interface DamageRecord {
  id: number;
  module: string;
  location_lat: number;
  location_lng: number;
  results: string; // JSON字符串
  result_image: string;
  timestamp: string;
  created_at: string;
}

interface DetectionHistoryResponse {
  data: DamageRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

const damageTypes = [
  {
    key: '纵向裂缝',
    label: '纵向裂缝',
    bgFrom: 'from-red-50',
    bgTo: 'to-pink-50',
    textColor: 'text-red-600',
  },
  {
    key: '横向裂缝',
    label: '横向裂缝',
    bgFrom: 'from-orange-50',
    bgTo: 'to-yellow-50',
    textColor: 'text-orange-600',
  },
  {
    key: '龟裂',
    label: '龟裂',
    bgFrom: 'from-blue-50',
    bgTo: 'to-cyan-50',
    textColor: 'text-blue-600',
  },
  {
    key: '坑洼',
    label: '坑洼',
    bgFrom: 'from-green-50',
    bgTo: 'to-emerald-50',
    textColor: 'text-green-600',
  },
];

const AMapLoaderUrl = "https://webapi.amap.com/maps?v=2.0&key=4c0958011b7f86aca896a60d37f1d7c5"
declare const AMap: any

// 生成MySQL兼容的时间字符串
function getMySQLDateTimeString() {
  const now = new Date();
  return now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');
}

export default function RoadDamageModule() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 检测历史相关状态
  const [damageRecords, setDamageRecords] = useState<DamageRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<DetectionResponse['results'] | null>(null);

  const [isMapVisible, setIsMapVisible] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [selectedPosition, setSelectedPosition] = useState<{ lng: number; lat: number } | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // 获取检测历史数据
  const fetchDetectionHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        type: selectedType,
        search: searchTerm
      });

      console.log('请求检测历史，参数:', params.toString());

      const response = await fetch(`/api/report/damage?${params}`);
      console.log('API响应状态:', response.status);
      console.log('API响应头:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`获取检测历史失败: ${response.status} - ${errorText}`);
      }

      const data: DetectionHistoryResponse = await response.json();
      console.log('API返回数据:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setDamageRecords(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch (error) {
      console.error('获取检测历史错误:', error);
      toast.error(`获取检测历史失败: ${(error as Error).message}`);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentPage, selectedType, searchTerm]);

  // 组件加载时获取检测历史
  useEffect(() => {
    fetchDetectionHistory();
  }, [fetchDetectionHistory]);

  // 解析检测结果JSON字符串
  const parseResults = (resultsJson: string | object): DamageResults => {
    try {
      if (typeof resultsJson === 'string') {
        return JSON.parse(resultsJson);
      }
      if (typeof resultsJson === 'object' && resultsJson !== null) {
        return resultsJson as DamageResults;
      }
      throw new Error('未知results类型');
    } catch (error) {
      console.error('解析检测结果失败:', error, resultsJson);
      return {
        '纵向裂缝': { count: 0, confidence: 0 },
        '横向裂缝': { count: 0, confidence: 0 },
        '龟裂': { count: 0, confidence: 0 },
        '坑洼': { count: 0, confidence: 0 },
      };
    }
  };

  // 获取主要检测类型
  const getMainDamageType = (results: DamageResults): string => {
    let maxCount = 0;
    let mainType = '未知';
    
    Object.entries(results).forEach(([type, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        mainType = type;
      }
    });
    
    return mainType;
  };

  // 获取严重程度
  const getSeverityLevel = (results: DamageResults): string => {
    const totalCount = Object.values(results).reduce((sum, data) => sum + data.count, 0);
    const avgConfidence = Object.values(results).reduce((sum, data) => sum + data.confidence, 0) / 4;
    
    if (totalCount >= 5 || avgConfidence >= 0.8) return '严重';
    if (totalCount >= 3 || avgConfidence >= 0.6) return '中等';
    return '轻微';
  };

  // 获取状态
  const getStatus = (createdAt: string): string => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return '待处理';
    if (diffHours < 24) return '处理中';
    return '已完成';
  };

  // 格式化时间
  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1);
    fetchDetectionHistory();
  };

  // 处理类型筛选
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchDetectionHistory();
  };

    // 加载高德地图脚本
  const loadAMap = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof AMap !== "undefined") return resolve()
      const script = document.createElement("script")
      script.src = AMapLoaderUrl
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("高德地图加载失败"))
      document.head.appendChild(script)
    })
  }

  const initMap = async () => {
    await loadAMap()

    // 加载 Geolocation 插件
    AMap.plugin("AMap.Geolocation", () => {
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
      });

    geolocation.getCurrentPosition((status: string, result: any) => {
      if (status !== "complete") {
        alert("无法获取定位，默认定位北京")
        result = { position: { lng: 116.397428, lat: 39.90923 } } // 默认北京
      }

      const { lng, lat } = result.position

      const mapInstance = new AMap.Map(mapContainerRef.current, {
        center: [lng, lat],
        zoom: 15,
      })

      const markerInstance = new AMap.Marker({
        position: [lng, lat],
        draggable: true,
        map: mapInstance,
      })

      // 点击地图移动标记点
      mapInstance.on("click", (e: any) => {
        markerInstance.setPosition(e.lnglat)
        setSelectedPosition({ lng: e.lnglat.lng, lat: e.lnglat.lat })
      })

      setMap(mapInstance)
      setMarker(markerInstance)
      setSelectedPosition({ lng, lat })
    })
    })
  }

  const handleOpenMap = async () => {
    setIsMapVisible(true)
    setTimeout(initMap, 100) // 确保 DOM 已渲染
  }

  const handleConfirmLocation = async () => {
    if (!selectedPosition) {
      alert("请先选择一个位置")
      return
    }

    if (!results) {
      alert("没有检测结果可保存")
      return
    }

    const currentTime = getMySQLDateTimeString();

    setIsLoading(true)

    try {
      console.log('开始保存检测结果...');
      console.log('位置信息:', selectedPosition);
      console.log('检测结果:', results);
      console.log('结果图片:', resultImage);
      
      const response = await fetch("/api/report/damage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          module: "road-damage",
          location: selectedPosition,
          timestamp: currentTime,
          results,
          resultImage,
        }),
      })

      console.log('保存API响应状态:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('保存成功:', result);
        toast.success("检测结果保存成功！");
        // 保存成功后刷新检测历史
        fetchDetectionHistory();
      } else {
        const errorText = await response.text();
        console.error('保存失败:', errorText);
        toast.error(`保存失败: ${errorText}`);
      }
    } catch (err) {
      console.error("保存失败", err)
      alert("保存失败，请检查网络连接")
    } finally {
      setIsLoading(false)
      setIsMapVisible(false)
    }
  }

const handleDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  setDragOver(false);
  const droppedFile = event.dataTransfer.files?.[0];
  if (droppedFile) {
    setFile(droppedFile);
    handleUploadAndAnalyze(droppedFile);
  }
}, []);

  // 调用路面病害检测接口 POST /api/detect/road-damage
const handleUploadAndAnalyze = async (file: File) => {
  if (!file) {
    toast.error("请先选择一个文件");
    return;
  }

  setIsAnalyzing(true);       // 替代旧的 setIsLoading()
  setResults(null);
  setResultImage(null);

  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log('开始上传文件:', file.name);
    const response = await fetch('/api/detect/road-damage', {
      method: 'POST',
      body: formData,
    });

    console.log('API响应状态:', response.status);
    console.log('API响应头:', response.headers);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API错误响应:', errorData);
      throw new Error(`API请求失败: ${response.status} - ${errorData}`);
    }

    const data: DetectionResponse = await response.json();
    console.log('API响应数据:', data);
    
    if (data.results) {
      setResults(data.results);
      console.log('设置检测结果:', data.results);
    } else {
      console.warn('API响应中没有results字段');
    }
    
    if (data.resultImage) {
      setResultImage(data.resultImage);
      console.log('设置结果图片:', data.resultImage);
    } else {
      console.warn('API响应中没有resultImage字段');
    }
    
    toast.success("分析成功！");
    setUploadedFile(file.name);
  } catch (error: any) {
    console.error("分析错误:", error);
    toast.error(error.message || "分析过程中发生错误");
  } finally {
    setIsAnalyzing(false);
  }
};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0];
  if (selectedFile) {
    setFile(selectedFile);                // 保存文件
    handleUploadAndAnalyze(selectedFile); // 上传后直接开始分析
  }
};

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "严重":
        return "destructive"
      case "中等":
        return "secondary"
      case "轻微":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">路面病害检测</h2>
          <p className="text-gray-600 mt-1">AI智能识别路面病害，自动生成检测报告</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent text-sm">
            <Eye className="w-4 h-4 mr-2" />
            实时监控
          </Button>
          <div className="relative">
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg text-sm w-full sm:w-auto"
              onClick={handleConfirmLocation}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              导出报告
            </Button>
            <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/report/export</div>
          </div>
        </div>
      </div>

      {/* 上传与分析区域 - 移动端优化 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold">文件上传</CardTitle>
            <CardDescription>上传巡查视频或图片进行AI分析</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div
              className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors duration-200 ${
                dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {isAnalyzing ? (
                <div className="space-y-4">
                  <Loader2 className="animate-spin mx-auto w-8 sm:w-12 h-8 sm:h-12 text-blue-600" />
                  <p className="text-blue-600 font-medium text-sm sm:text-base">AI分析中...</p>
                  <p className="text-xs sm:text-sm text-gray-500">正在识别路面病害类型</p>
                </div>
              ) : uploadedFile ? (
                <div className="space-y-4">
                  <FileText className="w-8 sm:w-12 h-8 sm:h-12 mx-auto text-green-600" />
                  <p className="text-green-600 font-medium text-sm sm:text-base">上传成功</p>
                  <p className="text-xs sm:text-sm text-gray-600">{uploadedFile}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-8 sm:w-12 h-8 sm:h-12 mx-auto text-gray-400" />
                  <p className="text-gray-600 text-sm sm:text-base">拖拽文件到此处或点击上传</p>
                  <p className="text-xs sm:text-sm text-gray-500">支持 MP4, AVI, JPG, PNG 格式</p>
                </div>
              )}
            </div>
            <div className="relative">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white h-10 sm:h-12 text-sm sm:text-base"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    选择文件
                  </>
                )}
              </Button>
              <input
                  aria-label="上传路面病害检测文件"
                  title="选择要上传的路面病害检测文件"
                  placeholder="选择文件进行上传"
                  type="file"
                  ref={fileInputRef}
                  accept=".mp4,.avi,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {/*api*/}
              <div className="absolute -bottom-5 right-0 text-xs text-gray-400"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-bold">识别结果</CardTitle>
            <CardDescription>AI检测到的路面病害信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFile && !isAnalyzing ? (
              <>
                <div className="space-y-2">
                  {resultImage ? (
                    <div className="aspect-video bg-muted rounded-md overflow-hidden">
                      <img src={resultImage} alt="Detection Result" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">检测结果图片将在此处显示</p>
                    </div>
                  )}
                </div>

                {/* 导出模块 */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button size="sm" variant="outline" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white h-10 sm:h-12 text-sm sm:text-base"
                    onClick={handleOpenMap}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    上传信息
                  </Button>
                  {isMapVisible && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg shadow-lg p-4 w-[600px] h-[500px] flex flex-col relative">
                        <div className="text-xl font-bold mb-2">请选择位置</div>
                        <div 
                          ref={mapContainerRef} className="flex-1" style={{ width: "100%", height: "100%" }}
                          >
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                          <button onClick={() => setIsMapVisible(false)} 
                          className="px-5 h-10 sm:h-12 text-sm sm:text-base bg-gray-100 text-gray-700 rounded-lg shadow-md hover:bg-gray-200 transition"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleConfirmLocation}
                            className="px-5 h-10 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                            disabled={isLoading}
                          >
                            {isLoading ? "导出中..." : "确认并导出"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

            </>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Camera className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm sm:text-base">上传文件后显示检测结果</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 统计概览 - 移动端优化 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {results &&
          damageTypes.map(({ key, label, bgFrom, bgTo, textColor }) => {
            const item = results[key as keyof DamageResults] 
              return (
                <Card
                  key={key}
                  className={`border-0 shadow-lg bg-gradient-to-br ${bgFrom} ${bgTo}`}
                >
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="mb-2 sm:mb-0">
                        <p className={`text-xs sm:text-sm font-bold ${textColor}`}>
                          {label}
                        </p>
                        <p className={`text-xl sm:text-3xl font-bold ${textColor}`}>
                           {item?.count ?? 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          置信度: {typeof item?.confidence === 'number' ? item.confidence.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <AlertTriangle
                        className={`w-6 sm:w-8 h-6 sm:h-8 ${textColor} self-end sm:self-auto`}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
          })}
      </div>

      {/* 检测历史 - 移动端优化 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold">检测历史</CardTitle>
              <CardDescription>路面病害检测记录 ({totalRecords} 条)</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoadingHistory}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="搜索位置或检测结果..." 
                  className="pl-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full sm:w-40 text-sm">
                  <SelectValue placeholder="病害类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="纵向裂缝">纵向裂缝</SelectItem>
                  <SelectItem value="横向裂缝">横向裂缝</SelectItem>
                  <SelectItem value="龟裂">龟裂</SelectItem>
                  <SelectItem value="坑洼">坑洼</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="bg-transparent text-sm"
                onClick={handleSearch}
              >
                <Search className="w-4 h-4 mr-2" />
                搜索
              </Button>
            </div>

            {/* 检测历史列表 */}
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>加载中...</span>
              </div>
            ) : damageRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无检测记录</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {damageRecords.map((record) => {
                  const results = parseResults(record.results);
                  const mainType = getMainDamageType(results);
                  const severity = getSeverityLevel(results);
                  const status = getStatus(record.created_at);
                  
                  return (
                    <Card key={record.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start space-x-3">
                          <img
                            src={record.result_image || "/placeholder.svg"}
                            alt="检测结果"
                            className="w-12 sm:w-16 h-12 sm:h-16 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                              <Badge variant={getSeverityColor(severity)} className="text-xs">
                                {mainType}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {status}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">
                              {record.module === 'road-damage' ? '路面病害检测' : record.module}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">{formatTime(record.timestamp)}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate">
                                {record.location_lat.toFixed(4)}, {record.location_lng.toFixed(4)}
                              </span>
                            </div>
                            {/* 检测结果统计 */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {Object.entries(results).map(([type, data]) => 
                                data.count > 0 ? (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type}: {data.count}
                                  </Badge>
                                ) : null
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-gray-600">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  )
}