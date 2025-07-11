"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Camera,
  Upload,
  Shield,
  AlertTriangle,
  Clock,
  MapPin,
  Eye,
  Download,
  Video,
  VideoOff,
  Loader2,
  Check,
  X,
  User,
  Trash2,
} from "lucide-react"
import { encryptAES } from "@/lib/cryptoFront";

// 添加API基础URL配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// 添加调试信息
console.log('当前API地址:', API_BASE_URL)

export default function FaceRecognitionModule() {
  const [isRecording, setIsRecording] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [videoReady, setVideoReady] = useState(false)
  const [username, setUsername] = useState<string>('')
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [progress, setProgress] = useState<number>(0)
  const [progressText, setProgressText] = useState<string>('')
  const [isTraining, setIsTraining] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

    // 新增：监听 stream，设置 video.srcObject
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play()
    }
  }, [stream])

  // 自动获取当前登录用户
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.uname) setUsername(user.uname);
      } catch {}
    }
  }, []);

  const recognitionLogs = [
    {
      id: 1,
      time: "2024-01-15 14:30:25",
      ip: "192.168.1.100",
      result: "成功",
      user: "张三",
      confidence: 95.6,
      location: "主入口",
    },
    {
      id: 2,
      time: "2024-01-15 14:28:15",
      ip: "192.168.1.101",
      result: "失败",
      user: "未知用户",
      confidence: 45.2,
      location: "侧门",
    },
    {
      id: 3,
      time: "2024-01-15 14:25:10",
      ip: "192.168.1.102",
      result: "成功",
      user: "李四",
      confidence: 88.9,
      location: "主入口",
    },
  ]

  // 启动摄像头
  const startCamera = async () => {
    setVideoReady(false) // 新增，重置状态
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
      return true
    } catch (error) {
      console.error("Camera access failed:", error)
      alert("无法访问摄像头，请检查权限设置")
      return false
    }
  }

  // 停止摄像头
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setVideoReady(false)
  }

  // 捕获人脸图像
  const captureFrame = () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current
        const video = videoRef.current
        const ctx = canvas.getContext("2d")
  
        console.log("videoWidth:", video.videoWidth, "videoHeight:", video.videoHeight)
        if (ctx && video.videoWidth && video.videoHeight) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
          return dataUrl
        }
      }
      return null
    }

  // 等待 videoReady 的 Promise 封装
  const waitForVideoReady = (timeout = 5000) => {
    return new Promise<boolean>((resolve) => {
      const start = Date.now()
      const check = () => {
        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          resolve(true)
        } else if (Date.now() - start > timeout) {
          resolve(false)
        } else {
          setTimeout(check, 100)
        }
      }
      check()
    })
  }

  // 人脸录入流程
  const handleFaceRegistration = async () => {
    if (!username.trim()) {
      alert('请输入用户名')
      return
    }

    if (!stream) {
      alert('请先启动摄像头')
      return
    }

    setIsTraining(true)
    setCapturedImages([])
    setProgress(0)
    setProgressText('开始录入会话...')

    try {
      // 捕获多张人脸图像
      const images = []
      for (let i = 0; i < 5; i++) {
        setProgressText(`捕获第 ${i + 1} 张图像...`)
        setProgress((i + 1) * 20)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const imageData = captureFrame()
        if (imageData) {
          // 加密图像数据
          const encryptedImage = encryptAES(imageData);
          images.push(encryptedImage)
          setCapturedImages(prev => [...prev, imageData])
        }
      }

      // 发送注册请求
      setProgressText('开始训练模型...')
      setProgress(80)
      
      const response = await fetch(`${API_BASE_URL}/face/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          image: images[0], // 使用第一张图像进行注册
          action: "register"
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API响应错误:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setProgressText('人脸录入成功！')
        setProgress(100)
        alert(`人脸录入成功！用户: ${username}`)
        // 重置状态
        setUsername('')
        setCapturedImages([])
        setProgress(0)
      } else {
        setProgressText('人脸录入失败')
        alert(`人脸录入失败: ${result.message || '未知错误'}`)
      }
      
      setIsTraining(false)

    } catch (error) {
      console.error('详细错误信息:', error)
      console.error('错误类型:', (error as Error).constructor.name)
      setProgressText('人脸录入失败')
      alert(`人脸录入失败: ${(error as Error).message || '未知错误'}`)
      setIsTraining(false)
    }
  }
      


  // 模拟未授权访问
  const simulateUnauthorizedAccess = () => {
    setShowUnauthorizedAlert(true)
  }

  // 清理摄像头资源
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* 人脸录入区域 */}
      <div className="grid grid-cols-1 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">人脸录入</CardTitle>
            <CardDescription>录入新用户人脸信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 摄像头预览区域 */}
            <div className="flex justify-center">
              <div className="w-96 h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                {stream ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover rounded-xl"
                      autoPlay
                      muted
                      playsInline
                      onLoadedMetadata={() => setVideoReady(true)}
                    />
                    {isRecording && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                          <p className="text-sm font-medium">正在录入...</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-white bg-black/50 px-1 rounded">LIVE</span>
                    </div>
                  </div>
                ) : capturedImages.length > 0 ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImages[capturedImages.length - 1] || "/placeholder.svg"}
                      alt="最后捕获的人脸"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      已采集 {capturedImages.length} 张
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    {isRecording ? (
                      <div>
                        <div className="relative">
                          <Camera className="w-12 h-12 mx-auto mb-3 text-blue-600 animate-pulse" />
                          <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping"></div>
                        </div>
                        <p className="text-sm text-blue-600 font-medium">正在录入...</p>
                      </div>
                    ) : isTraining ? (
                      <div>
                        <Shield className="w-12 h-12 mx-auto mb-3 text-green-600 animate-spin" />
                        <p className="text-sm text-green-600 font-medium">训练中...</p>
                      </div>
                    ) : (
                      <div>
                        <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-600">摄像头预览</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 进度显示 */}
            {(isProcessing || progress > 0) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{progressText}</span>
                  <span className="text-blue-600">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="space-y-3">
              {!stream ? (
                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"
                  onClick={startCamera}
                  disabled={isProcessing}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  启动摄像头
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    onClick={handleFaceRegistration}
                    disabled={isTraining || !stream}
                  >
                    {isTraining ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        录入中...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        开始录入
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" className="w-full bg-transparent" onClick={stopCamera}>
                    <VideoOff className="w-4 h-4 mr-2" />
                    关闭摄像头
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 隐藏的canvas用于捕获图像 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

// 新增：调用后端 /train 接口进行人脸模型训练
const trainFaceModel = async (userId: number, username: string, images: string[]) => {
  const response = await fetch(`${API_BASE_URL}/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, username, images })
  })
  return await response.json()
}

// 新增：调用后端 /recognize 接口进行人脸识别
const recognizeFace = async (image: string) => {
  const response = await fetch(`${API_BASE_URL}/recognize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image })
  })
  return await response.json()
}

// 新增：获取用户列表
const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`)
  return await response.json()
}

// 新增：删除用户
const deleteUser = async (userId: number) => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}`, { method: "DELETE" })
  return await response.json()
}

