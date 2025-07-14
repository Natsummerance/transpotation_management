"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, MapPin, Clock, FileText, Download, AlertTriangle, Camera, Eye, Loader2, Search, RefreshCw, X, Zap, Flame, Waves } from "lucide-react"
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
  resultImage?: string;
}

// 检测历史记录接口
interface DamageRecord {
  id: number;
  module: string;
  location_lat: number;
  location_lng: number;
  results: any; // 解析后的JSON对象
  result_image: string;
  timestamp: string;
  address: string;
  coordinates: string;
  // 新增字段
  mainDamageType: string;
  totalCount: number;
  avgConfidence: number;
  severity: string;
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
    bgFrom: 'from-red-500',
    bgTo: 'to-orange-500',
    textColor: 'text-white',
    borderColor: 'border-red-400',
    bgColor: 'bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500',
    iconColor: 'text-white',
    animation: 'fire-pulse',
    borderAnimation: 'fire-border-glow',
    gradient: 'linear-gradient(-45deg, #dc2626, #ea580c, #f59e0b, #dc2626)',
    shadow: '0 0 20px rgba(220, 38, 38, 0.5), 0 0 40px rgba(234, 88, 12, 0.3)',
    hoverShadow: '0 0 30px rgba(220, 38, 38, 0.8), 0 0 60px rgba(234, 88, 12, 0.5)',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
    numberShadow: '0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.7)',
    iconShadow: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))',
    badgeStyle: 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white border-0 animate-pulse'
  },
  {
    key: '横向裂缝',
    label: '横向裂缝',
    bgFrom: 'from-yellow-500',
    bgTo: 'to-green-500',
    textColor: 'text-white',
    borderColor: 'border-yellow-400',
    bgColor: 'bg-gradient-to-br from-yellow-500 via-green-500 to-emerald-500',
    iconColor: 'text-white',
    animation: 'ocean-wave',
    borderAnimation: 'ocean-border-glow',
    gradient: 'linear-gradient(-45deg, #eab308, #22c55e, #10b981, #eab308)',
    shadow: '0 0 20px rgba(234, 179, 8, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)',
    hoverShadow: '0 0 30px rgba(234, 179, 8, 0.8), 0 0 60px rgba(34, 197, 94, 0.5)',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
    numberShadow: '0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.7)',
    iconShadow: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))',
    badgeStyle: 'bg-gradient-to-r from-yellow-500 via-green-500 to-emerald-500 text-white border-0 animate-pulse'
  },
  {
    key: '龟裂',
    label: '龟裂',
    bgFrom: 'from-blue-500',
    bgTo: 'to-cyan-500',
    textColor: 'text-white',
    borderColor: 'border-blue-400',
    bgColor: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500',
    iconColor: 'text-white',
    animation: 'teal-bounce',
    borderAnimation: 'teal-border-glow',
    gradient: 'linear-gradient(-45deg, #3b82f6, #06b6d4, #14b8a6, #3b82f6)',
    shadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)',
    hoverShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(6, 182, 212, 0.5)',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
    numberShadow: '0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.7)',
    iconShadow: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))',
    badgeStyle: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white border-0 animate-pulse'
  },
  {
    key: '坑洼',
    label: '坑洼',
    bgFrom: 'from-purple-500',
    bgTo: 'to-pink-500',
    textColor: 'text-white',
    borderColor: 'border-purple-400',
    bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 animate-pulse',
    iconColor: 'text-white',
    animation: 'rainbow-pulse',
    borderAnimation: 'border-glow',
    gradient: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)',
    shadow: '0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(236, 72, 153, 0.3)',
    hoverShadow: '0 0 30px rgba(147, 51, 234, 0.8), 0 0 60px rgba(236, 72, 153, 0.5)',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
    numberShadow: '0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.7)',
    iconShadow: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))',
    badgeStyle: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white border-0 animate-pulse'
  },
];

const AMapLoaderUrl = "https://webapi.amap.com/maps?v=2.0&key=c6115796bfbad53bd639041995b5b123"
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

// 前端通过高德API获取地址
async function getAddressFromCoordinatesFront(lat: number, lng: number): Promise<string> {
  try {
    const key = 'c6115796bfbad53bd639041995b5b123';
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${key}&location=${lng},${lat}&output=json`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === '1' && data.regeocode) {
      const formattedAddress = data.regeocode.formatted_address;
      if (formattedAddress) return formattedAddress;
      const addressComponent = data.regeocode.addressComponent;
      let address = '';
      if (addressComponent.province && addressComponent.province !== addressComponent.city) {
        address += addressComponent.province;
      }
      if (addressComponent.city) {
        address += addressComponent.city;
      }
      if (addressComponent.district) {
        address += addressComponent.district;
      }
      if (addressComponent.township) {
        address += addressComponent.township;
      }
      if (addressComponent.street) {
        address += addressComponent.street;
      }
      if (addressComponent.streetNumber) {
        address += addressComponent.streetNumber;
      }
      return address;
    }
    return '未知位置';
  } catch (error) {
    return '未知位置';
  }
}

export default function RoadDamageModule() {
  // 添加彩色动画CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rainbow-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes fire-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes ocean-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes teal-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes border-glow {
        0%, 100% { border-color: rgba(147, 51, 234, 0.5); }
        50% { border-color: rgba(236, 72, 153, 0.8); }
      }
      
      @keyframes fire-border-glow {
        0%, 100% { border-color: rgba(239, 68, 68, 0.5); }
        50% { border-color: rgba(245, 101, 101, 0.8); }
      }
      
      @keyframes ocean-border-glow {
        0%, 100% { border-color: rgba(59, 130, 246, 0.5); }
        50% { border-color: rgba(96, 165, 250, 0.8); }
      }
      
      @keyframes teal-border-glow {
        0%, 100% { border-color: rgba(6, 182, 212, 0.5); }
        50% { border-color: rgba(20, 184, 166, 0.8); }
      }
      
      .border-glow {
        animation: border-glow 2s ease-in-out infinite;
      }
      
      .fire-border-glow {
        animation: fire-border-glow 2s ease-in-out infinite;
      }
      
      .ocean-border-glow {
        animation: ocean-border-glow 2s ease-in-out infinite;
      }
      
      .teal-border-glow {
        animation: teal-border-glow 2s ease-in-out infinite;
      }
      
      @keyframes rainbow-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes fire-pulse {
        0%, 100% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.02) rotate(1deg); }
        50% { transform: scale(1.05) rotate(0deg); }
        75% { transform: scale(1.02) rotate(-1deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      
      @keyframes ocean-wave {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }
      
      @keyframes teal-bounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      
      .rainbow-pulse {
        animation: rainbow-pulse 2s ease-in-out infinite;
      }
      
      .fire-pulse {
        animation: fire-pulse 3s ease-in-out infinite;
      }
      
      .ocean-wave {
        animation: ocean-wave 2s ease-in-out infinite;
      }
      
      .teal-bounce {
        animation: teal-bounce 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
  
  // 弹窗相关状态
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<DamageRecord | null>(null)

  // 新增：用于缓存前端获取的地址
  const [addressCache, setAddressCache] = useState<Record<string, string>>({});

  // 获取并缓存前端地址
  const fetchAndCacheAddress = useCallback(async (lat: number, lng: number, id: number) => {
    const key = `${lat},${lng}`;
    if (addressCache[key]) return;
    const addr = await getAddressFromCoordinatesFront(lat, lng);
    setAddressCache(prev => ({ ...prev, [key]: addr }));
  }, [addressCache]);

  // 修复：全局 useEffect，遍历所有需要补全的记录
  useEffect(() => {
    damageRecords.forEach((record) => {
      const addrKey = `${record.location_lat},${record.location_lng}`;
      if (record.address === '未知位置' && !addressCache[addrKey]) {
        fetchAndCacheAddress(record.location_lat, record.location_lng, record.id);
      }
    });
  }, [damageRecords, addressCache, fetchAndCacheAddress]);

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

  // 解析检测结果JSON字符串（保留用于兼容性）
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

  // 获取主要检测类型（保留用于兼容性）
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

  // 获取严重程度（保留用于兼容性）
  const getSeverityLevel = (results: DamageResults): string => {
    const totalCount = Object.values(results).reduce((sum, data) => sum + data.count, 0);
    const avgConfidence = Object.values(results).reduce((sum, data) => sum + data.confidence, 0) / 4;
    
    if (totalCount >= 5 || avgConfidence >= 0.8) return '严重';
    if (totalCount >= 3 || avgConfidence >= 0.6) return '中等';
    return '轻微';
  };

  // 获取状态
  const getStatus = (timestamp: string): string => {
    const createdDate = new Date(timestamp);
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

  // 根据筛选类型过滤历史记录
  const filteredDamageRecords = selectedType === 'all'
    ? damageRecords
    : damageRecords.filter(record => {
        // result 可能是对象或字符串
        let resultsObj = record.results;
        if (typeof resultsObj === 'string') {
          try {
            resultsObj = JSON.parse(resultsObj);
          } catch {
            return false;
          }
        }
        // 只显示该类型数量大于0的记录
        return resultsObj && resultsObj[selectedType] && resultsObj[selectedType].count > 0;
      });

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchDetectionHistory();
  };

  // 点击记录显示详情
  const handleRecordClick = (record: DamageRecord) => {
    setSelectedRecord(record);
    setIsDetailDialogOpen(true);
  };

  // 关闭详情弹窗
  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedRecord(null);
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

  // 统计卡片鲜艳背景映射
  const cardBgMap: Record<string, string> = {
    '纵向裂缝': 'bg-red-600',
    '横向裂缝': 'bg-orange-600',
    '龟裂': 'bg-blue-600',
    '坑洼': 'bg-green-600',
  };
  // 图标主色
  const iconColorMap: Record<string, string> = {
    '纵向裂缝': 'text-red-100',
    '横向裂缝': 'text-orange-100',
    '龟裂': 'text-blue-100',
    '坑洼': 'text-green-100',
  };

  // 柔和渐变背景和主色配色方案
  const cardGradientMap: Record<string, { bgFrom: string; bgTo: string; mainText: string; icon: string }> = {
    '纵向裂缝': { bgFrom: 'from-red-50', bgTo: 'to-pink-50', mainText: 'text-red-600', icon: 'text-red-600' },
    '横向裂缝': { bgFrom: 'from-orange-50', bgTo: 'to-yellow-50', mainText: 'text-orange-600', icon: 'text-orange-600' },
    '龟裂': { bgFrom: 'from-blue-50', bgTo: 'to-cyan-50', mainText: 'text-blue-600', icon: 'text-blue-600' },
    '坑洼': { bgFrom: 'from-green-50', bgTo: 'to-emerald-50', mainText: 'text-green-600', icon: 'text-green-600' },
  };

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
                <div className="w-full flex justify-center items-center bg-muted rounded-md overflow-hidden" style={{ minHeight: 180, maxHeight: 400 }}>
                  {resultImage && (/\.(mp4|avi|webm)$/i.test(resultImage) ? (
                    <video
                      src={resultImage}
                      controls
                      className="max-w-full max-h-[400px] rounded-lg"
                      style={{ display: 'block', margin: '0 auto', background: '#000' }}
                    />
                  ) : (
                    <img
                      src={resultImage}
                      alt="Detection Result"
                      className="max-w-full max-h-[400px] rounded-lg transition-transform duration-300 hover:scale-110 object-contain"
                      style={{ display: 'block', margin: '0 auto' }}
                    />
                  ))}
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
                      <div className="bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl p-0 w-[95vw] max-w-xl h-[500px] flex flex-col relative border border-blue-100">
                        {/* 关闭按钮右上角浮动 */}
                        <button
                          onClick={() => setIsMapVisible(false)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 text-3xl font-bold focus:outline-none z-10 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:scale-110 transition-all"
                          aria-label="关闭"
                        >
                          ×
                        </button>
                        {/* 标题区加图标 */}
                        <div className="px-8 pt-8 pb-3 flex items-center gap-2">
                          <MapPin className="w-6 h-6 text-blue-500 mr-2" />
                          <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">选择检测位置</div>
                        </div>
                        {/* 地图区域美化 */}
                        <div 
                          ref={mapContainerRef}
                          className="flex-1 mx-8 my-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-lg overflow-hidden"
                          style={{ width: "auto", height: "270px", minHeight: 200 }}
                        />
                        {/* 底部按钮美化 */}
                        <div className="px-8 pb-8 pt-5 flex justify-end gap-4">
                          <button
                            onClick={() => setIsMapVisible(false)}
                            className="px-6 h-11 text-base rounded-full bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200 hover:text-blue-600 transition-all border border-gray-200"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleConfirmLocation}
                            className="px-6 h-11 text-base rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:brightness-110 hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed border-0"
                            disabled={isLoading}
                          >
                            {isLoading ? "保存中..." : "确认并保存"}
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
          damageTypes.map(({ key, label }) => {
            const item = results[key as keyof typeof results];
            const { bgFrom, bgTo, mainText, icon } = cardGradientMap[label] || { bgFrom: 'from-gray-100', bgTo: 'to-gray-50', mainText: 'text-gray-600', icon: 'text-gray-400' };
            return (
              <Card
                key={key}
                className={`border-0 shadow-lg bg-gradient-to-br ${bgFrom} ${bgTo} transition-transform duration-200 hover:scale-105 hover:shadow-2xl hover:brightness+1100`}
              >
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="mb-2 sm:mb-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{label}</p>
                      <p className={`text-xl sm:text-3xl font-bold ${mainText}`}>{item?.count ?? 0}</p>
                      <p className="text-xs text-gray-400">
                        置信度: {typeof item?.confidence === 'number' ? item.confidence.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <AlertTriangle
                      className={`w-6 sm:w-8 h-6 sm:h-8 ${icon} self-end sm:self-auto`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
      {/* 统计概览卡片已彻底移除 */}

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
            ) : filteredDamageRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无检测记录</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredDamageRecords.map((record, index) => {
                  const addrKey = `${record.location_lat},${record.location_lng}`;
                  return (
                    <Card 
                      key={record.id || index} 
                      className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-white via-gray-50 to-white hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 overflow-hidden transform hover:-translate-y-2"
                      onClick={() => handleRecordClick(record)}
                    >
                      <CardContent className="p-3">
                        <div className="flex">
                          {/* 小圆角正方形图片缩略图 */}
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden mr-2">
                            <img
                              src={record.result_image || "/placeholder.svg"}
                              alt="检测结果"
                              className="w-full h-full object-cover rounded-xl border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                            {/* 状态指示器 */}
                            <div className="absolute top-1 right-1">
                              {record.totalCount > 0 ? (
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                              ) : (
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          {/* 内容区域 */}
                          <div className="flex-1 p-2 min-w-0">
                            {/* 主要信息 */}
                            <div className="mb-2">
                              {record.totalCount > 0 ? (
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-gray-800">
                                    发现 {record.totalCount} 个问题
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    平均置信度 <span className="font-semibold text-blue-600">{(record.avgConfidence * 100).toFixed(0)}%</span>
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-green-600">
                                    ✅ 道路状况良好
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    未发现路面病害
                                  </p>
                                </div>
                              )}
                            </div>
                            {/* 时间和位置信息 */}
                            <div className="space-y-1 mb-2">
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1 text-gray-400" />
                                <span className="font-medium">{formatTime(record.timestamp)}</span>
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                <span className="truncate font-medium" title={addressCache[addrKey] || record.address}>
                                  {addressCache[addrKey] || record.address || record.coordinates}
                                </span>
                              </div>
                            </div>
                            {/* 检测结果统计 - 只显示有问题的类型 */}
                            {record.results && record.totalCount > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-700">检测详情：</p>
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(record.results).map(([type, data]: [string, any]) => 
                                    data.count > 0 ? (
                                      (() => {
                                        const damageType = damageTypes.find(dt => dt.key === type);
                                        if (damageType) {
                                          return (
                                            <Badge 
                                              key={type} 
                                              className={`text-xs ${damageType.badgeStyle} shadow-md`}
                                            >
                                              {type}: {data.count}个 ({(data.confidence * 100).toFixed(0)}%)
                                            </Badge>
                                          );
                                        }
                                        return (
                                          <Badge key={type} variant="outline" className="text-xs shadow-md">
                                            {type}: {data.count}个 ({(data.confidence * 100).toFixed(0)}%)
                                          </Badge>
                                        );
                                      })()
                                    ) : null
                                  )}
                                </div>
                              </div>
                            )}
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

      {/* 详情弹窗 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white border-0 shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center text-xl">
              <AlertTriangle className="h-6 w-6 text-orange-500 mr-2" />
              <span>路面病害检测详情</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              查看详细的检测结果和问题分析
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6">
            {selectedRecord && (
              <div className="space-y-6">
                {/* 主要信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-sm text-blue-800 mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      基本信息
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">检测ID:</span>
                        <span className="font-medium">#{selectedRecord.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">检测时间:</span>
                        <span className="font-medium">{formatTime(selectedRecord.timestamp)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">主要类型:</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedRecord.mainDamageType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-sm text-green-800 mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      位置信息
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">地址:</span>
                        <p className="font-medium mt-1">{selectedRecord.address}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">坐标:</span>
                        <p className="font-mono text-xs mt-1">{selectedRecord.coordinates}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 检测结果图片 */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-sm text-purple-800 mb-3 flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    检测结果图片
                  </h3>
                  <div className="flex justify-center items-center p-2">
                    <img 
                      src={selectedRecord.result_image || "/placeholder.svg"} 
                      alt="检测结果" 
                      className="max-w-full max-h-[400px] rounded-lg transition-transform duration-300 hover:scale-110 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                      style={{ display: 'block', margin: '0 auto' }}
                    />
                  </div>
                </div>

                {/* 详细检测结果 */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-sm text-orange-800 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    详细检测结果
                  </h3>
                  {selectedRecord.totalCount > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-white/60 p-4 rounded-lg border border-orange-200 shadow-sm">
                        <p className="text-sm text-orange-800 text-center">
                          共发现 <span className="font-bold text-lg">{selectedRecord.totalCount}</span> 个问题，
                          平均置信度 <span className="font-bold text-lg">{(selectedRecord.avgConfidence * 100).toFixed(0)}%</span>
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedRecord.results && Object.entries(selectedRecord.results).map(([type, data]: [string, any]) => {
                          const damageType = damageTypes.find(dt => dt.key === type);
                          return data.count > 0 ? (
                            <div 
                              key={type} 
                              className={`${damageType?.bgColor} border ${damageType?.borderColor} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className={`font-semibold text-sm ${damageType?.textColor}`}>
                                  {type}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${damageType?.borderColor} ${damageType?.textColor}`}
                                >
                                  {(data.confidence * 100).toFixed(0)}%
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                {type === '坑洼' ? (
                                  <Zap className={`h-4 w-4 ${damageType?.iconColor} animate-pulse`} />
                                ) : type === '纵向裂缝' ? (
                                  <Flame className={`h-4 w-4 ${damageType?.iconColor} animate-pulse`} />
                                ) : type === '横向裂缝' ? (
                                  <Waves className={`h-4 w-4 ${damageType?.iconColor}`} />
                                ) : (
                                  <AlertTriangle className={`h-4 w-4 ${damageType?.iconColor}`} />
                                )}
                                <p className={`text-sm ${damageType?.textColor}`}>
                                  检测到 <span className="font-bold text-lg">{data.count}</span> 个{type}
                                </p>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/60 p-6 rounded-lg border border-green-200 text-center shadow-sm">
                      <div className="text-green-600 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-800 font-medium">
                        ✅ 未发现路面病害，道路状况良好
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}