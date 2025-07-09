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

export default function FaceRecognitionModule() {
  const [isRecording, setIsRecording] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

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
  }

  // 捕获人脸图像
  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext("2d")

      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        return canvas.toDataURL("image/jpeg", 0.8)
      }
    }
    return null
  }

  // 人脸录入流程
  const handleFaceCapture = async () => {
    if (!stream) {
      const cameraStarted = await startCamera()
      if (!cameraStarted) return
    }

    setIsRecording(true)
    setIsProcessing(true)

    // 等待3秒让用户准备
    setTimeout(async () => {
      try {
        const imageData = captureFrame()
        if (imageData) {
          setCapturedImage(imageData)

          // 调用人脸注册API
          const response = await fetch("/api/face/recognize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image: imageData,
              action: "register",
              userId: "current_user",
            }),
          })

          const result = await response.json()

          if (result.success) {
            setIsEncrypting(true)
            setTimeout(() => {
              setIsEncrypting(false)
              setIsRecording(false)
              setIsProcessing(false)
              alert("人脸录入成功！")
            }, 2000)
          } else {
            throw new Error(result.message || "人脸录入失败")
          }
        }
      } catch (error) {
        console.error("Face capture failed:", error)
        alert("人脸录入失败，请重试")
      } finally {
        setIsRecording(false)
        setIsProcessing(false)
      }
    }, 3000)
  }

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))

      if (imageFiles.length === 0) {
        alert("请选择图片文件")
        return
      }

      if (imageFiles.some((file) => file.size > 5 * 1024 * 1024)) {
        alert("文件大小不能超过5MB")
        return
      }

      // 处理单个文件
      if (imageFiles.length === 1) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setCapturedImage(e.target?.result as string)
        }
        reader.readAsDataURL(imageFiles[0])
      } else {
        // 处理批量文件
        setUploadedFiles(imageFiles)
      }
    }
  }

  // 批量处理人脸图片
  const handleBatchProcess = async () => {
    if (uploadedFiles.length === 0) {
      alert("请先选择要处理的图片文件")
      return
    }

    setIsProcessing(true)

    try {
      for (const file of uploadedFiles) {
        const reader = new FileReader()
        const imageData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        // 调用人脸识别API
        const response = await fetch("/api/face/recognize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: imageData,
            action: "register",
            userId: file.name.split(".")[0], // 使用文件名作为用户ID
          }),
        })

        const result = await response.json()
        console.log(`处理文件 ${file.name}:`, result)
      }

      alert(`批量处理完成，共处理 ${uploadedFiles.length} 个文件`)
      setUploadedFiles([])
    } catch (error) {
      console.error("Batch process failed:", error)
      alert("批量处理失败，请重试")
    } finally {
      setIsProcessing(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">人脸识别管理</h2>
          <p className="text-gray-600 mt-1">用户人脸录入、验证与访问控制管理</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            实时监控
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </Button>
        </div>
      </div>

      {/* 人脸录入与验证区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">人脸录入</CardTitle>
            <CardDescription>录入新用户人脸信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="w-64 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                {stream ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover rounded-xl"
                      autoPlay
                      muted
                      playsInline
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
                ) : capturedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImage || "/placeholder.svg"}
                      alt="捕获的人脸"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 bg-white/80"
                      onClick={() => setCapturedImage(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
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
                    ) : isEncrypting ? (
                      <div>
                        <Shield className="w-12 h-12 mx-auto mb-3 text-green-600 animate-spin" />
                        <p className="text-sm text-green-600 font-medium">加密中...</p>
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
            <div className="flex space-x-3">
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                onClick={handleFaceCapture}
                disabled={isRecording || isEncrypting || isProcessing}
              >
                {stream ? (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    开始录入
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    启动摄像头
                  </>
                )}
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                上传图片
              </Button>
            </div>
            {stream && (
              <Button variant="outline" className="w-full bg-transparent" onClick={stopCamera}>
                <VideoOff className="w-4 h-4 mr-2" />
                关闭摄像头
              </Button>
            )}
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden"
              title="选择图片文件"
              aria-label="选择图片文件上传"
              placeholder="选择要上传的图片文件" 
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">批量处理</CardTitle>
            <CardDescription>批量上传和处理人脸图片</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 mb-3">拖拽文件到此处或点击选择</p>
              <Button variant="outline" onClick={() => batchFileInputRef.current?.click()} className="bg-transparent">
                选择多个文件
              </Button>
              <input
                title="选择多个图片文件"
                placeholder="选择要批量上传的图片文件"
                aria-label="选择多个图片文件上传"
                ref={batchFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">已选择文件 ({uploadedFiles.length})</h4>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)}KB</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setUploadedFiles((files) => files.filter((_, i) => i !== index))}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleBatchProcess}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      开始批量处理
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">今日成功</p>
                <p className="text-lg font-bold text-green-600">156</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">今日失败</p>
                <p className="text-lg font-bold text-red-600">23</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">识别率</p>
                <p className="text-lg font-bold text-blue-600">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 识别日志 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">识别日志</CardTitle>
          <CardDescription>人脸识别访问记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Input placeholder="搜索用户或IP..." className="max-w-xs" />
              <Button variant="outline" className="bg-transparent">
                <Clock className="w-4 h-4 mr-2" />
                时间筛选
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead>识别结果</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>置信度</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recognitionLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">{log.time}</TableCell>
                    <TableCell>{log.ip}</TableCell>
                    <TableCell>
                      <Badge variant={log.result === "成功" ? "default" : "destructive"}>{log.result}</Badge>
                    </TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.confidence}%</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {log.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="bg-transparent">
                        查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 未授权访问警告弹窗 */}
      {showUnauthorizedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-600">未授权访问警告</CardTitle>
              <CardDescription>检测到未授权人员尝试访问</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <img src="/placeholder.svg?height=120&width=120" alt="抓拍图像" className="mx-auto rounded-lg" />
                <p className="text-sm text-gray-600 mt-2">抓拍时间: {new Date().toLocaleString()}</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowUnauthorizedAlert(false)}
                >
                  关闭
                </Button>
                <Button className="flex-1 bg-red-600 text-white">立即处理</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 隐藏的canvas用于捕获图像 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

// 新增：调用后端 /train 接口进行人脸模型训练
const trainFaceModel = async (userId: number, username: string, images: string[]) => {
  const response = await fetch("http://localhost:5000/train", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, username, images })
  })
  return await response.json()
}

// 新增：调用后端 /recognize 接口进行人脸识别
const recognizeFace = async (image: string) => {
  const response = await fetch("http://localhost:5000/recognize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image })
  })
  return await response.json()
}

// 新增：获取用户列表
const fetchUsers = async () => {
  const response = await fetch("http://localhost:5000/users")
  return await response.json()
}

// 新增：删除用户
const deleteUser = async (userId: number) => {
  const response = await fetch(`http://localhost:5000/user/${userId}`, { method: "DELETE" })
  return await response.json()
}
