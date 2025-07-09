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
  const [videoReady, setVideoReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

    // 新增：监听 stream，设置 video.srcObject
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play()
    }
  }, [stream])

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
  const handleFaceCapture = async () => {
    setVideoReady(false) // 每次都重置
    if (!stream) {
      const cameraStarted = await startCamera()
      if (!cameraStarted) return
    }

    setIsRecording(true)
    setIsProcessing(true)

    // 等待 videoReady
    const ready = await waitForVideoReady(5000)
    if (!ready) {
      alert("摄像头画面未准备好，请重试")
      setIsRecording(false)
      setIsProcessing(false)
      return
    }

    // 等待3秒让用户准备
    setTimeout(async () => {
            try {
              const imageData = captureFrame()
              console.log("handleFaceCapture 捕获到 imageData:", imageData)
              if (imageData) {
                setCapturedImage(imageData)
      
                // 输出图片信息到终端
                console.log("捕获图片 base64 长度:", imageData.length)
                console.log("图片 base64 前100字符:", imageData.slice(0, 100))
                const mimeMatch = imageData.match(/^data:(.*?);base64,/)
                console.log("图片MIME类型:", mimeMatch ? mimeMatch[1] : "未知")
      
                // 输出POST内容
                const postBody = {
                  image: imageData,
                  //action: "register",
                  //userId: "current_user",
                }
                console.log("POST内容（image字段长度）:", postBody.image.length)
                console.log("POST内容（image字段前100字符）:", postBody.image.slice(0, 100))
      
                // 调用人脸注册API
                const response = await fetch("http://10.61.96.186:5000/recognize", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(postBody),
                })
      
                const result = await response.json()
                alert(result.toString)
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
              } else {
                console.log("handleFaceCapture 未捕获到有效图像")
                alert("未能捕获到有效图像，请重试")
              }
            } catch (error) {
              console.error("Face capture failed:", error)
              alert("人脸录入失败，请重试...")
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
      </div>
      {/* 人脸录入区域 */}
      <div className="grid grid-cols-1 gap-8">
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
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
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
