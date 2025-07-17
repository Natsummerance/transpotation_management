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
  AlertCircle,
} from "lucide-react"
import { encryptAES } from "@/lib/cryptoFront";

// 添加API基础URL配置
const API_BASE_URL = 'http://localhost:5000'

// 添加调试信息
console.log('当前API地址:', API_BASE_URL)

export default function FaceRecognitionModule({ username: propUsername, onSuccess, progressBottomGap = "gap-2" }: { username?: string, onSuccess?: () => void, progressBottomGap?: string } = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [videoReady, setVideoReady] = useState(false)
  const [username, setUsername] = useState<string>(propUsername || '');
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [progress, setProgress] = useState<number>(0)
  const [progressText, setProgressText] = useState<string>('')
  const [isTraining, setIsTraining] = useState(false)
  const [isBlinkVerification, setIsBlinkVerification] = useState(false)
  const [blinkCount, setBlinkCount] = useState<number>(0)
  const [sessionId, setSessionId] = useState<string>('')
  const [targetImages, setTargetImages] = useState<number>(300)
  const [collectedImages, setCollectedImages] = useState<number>(0)
  const [verificationMode, setVerificationMode] = useState<boolean>(false)
  const [verificationMessage, setVerificationMessage] = useState<string>('')
  const [duplicateAlertShown, setDuplicateAlertShown] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const collectIntervalRef = useRef<boolean>(false)

   // 新增：监听 stream，设置 video.srcObject
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play()
    }
  }, [stream])

  // 自动获取当前登录用户（仅当未传入props.username时）
  useEffect(() => {
    if (!propUsername) {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.uname) setUsername(user.uname);
        } catch {}
      }
    }
  }, [propUsername]);

  // 清理采集状态
  useEffect(() => {
    return () => {
      collectIntervalRef.current = false
    }
  }, [])

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
    
    // 清理采集状态
    collectIntervalRef.current = false
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

  // 停止采集
  const stopCollection = () => {
    // 设置标志位来停止递归调用
    collectIntervalRef.current = false
    setIsTraining(false)
    setIsBlinkVerification(false)
    setVerificationMode(false)
    setProgressText('采集已停止')
    setDuplicateAlertShown(false) // 重置重复提示状态
  }

  // 人脸录入流程（分步式+检测）
  const handleFaceRegistration = async () => {
    if (!username) {
      alert('未检测到登录用户，请先登录')
      return
    }
    if (!stream) {
      alert('请先启动摄像头')
      return
    }
    
    // 重置状态
    setIsTraining(true)
    setCapturedImages([])
    setProgress(0)
    setProgressText('开始录入会话...')
    setIsBlinkVerification(false)
    setBlinkCount(0)
    setVerificationMode(false)
    setVerificationMessage('')
    setCollectedImages(0)
    setTargetImages(300) // 确保目标图像数设置正确
    setDuplicateAlertShown(false) // 重置重复提示状态
    
    try {
      console.log('发送请求到:', `${API_BASE_URL}/start_registration`)
      
      // 1. 开始录入会话
      const startResponse = await fetch(`${API_BASE_URL}/start_registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      // 添加响应状态检查
      console.log('响应状态:', startResponse.status)
      console.log('响应头:', startResponse.headers.get('content-type'))
      if (!startResponse.ok) {
        const errorText = await startResponse.text()
        console.error('API响应错误:', errorText)
        throw new Error(`HTTP ${startResponse.status}: ${errorText}`)
      }
      
      const startResult = await startResponse.json()
      if (!startResult.success) {
        throw new Error(startResult.message || '开始录入会话失败')
      }

      const newSessionId = startResult.session_id
      const newTargetImages = startResult.target_images
      
      setSessionId(newSessionId)
      setTargetImages(newTargetImages)
      setProgressText(`开始采集人脸图像，目标: ${newTargetImages} 张`)

      // 2. 连续采集图像 - 修改为同步采集，确保上一张验证通过后才采集下一张
      const collectNextImage = async () => {
        try {
          const canvas = canvasRef.current
          const video = videoRef.current
          
          if (!canvas || !video) return

          const context = canvas.getContext('2d')
          if (!context) return

          // 设置canvas尺寸
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // 绘制当前帧
          context.drawImage(video, 0, 0)

          // 转换为base64
          const imageData = canvas.toDataURL('image/jpeg', 0.8)
          // 移除base64前缀，只保留纯base64数据
          const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "")

          console.log('发送图像到后端，当前进度:', collectedImages, '/', newTargetImages)

          // 发送图像到后端
          const collectResponse = await fetch(`${API_BASE_URL}/collect_image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: newSessionId,
              image: base64Data
            }),
          })

          const collectResult = await collectResponse.json()
          
          // 添加调试日志
          console.log('后端响应:', collectResult)
          
          if (collectResult.success) {
            const currentCollected = collectResult.collected_images || 0
            const currentProgress = collectResult.progress || 0
            
            console.log('当前采集数:', currentCollected, '进度:', currentProgress)
            
            setCollectedImages(currentCollected)
            setProgress(currentProgress)
            
            // 处理重复录入检测
            if (collectResult.duplicate && !duplicateAlertShown) {
              setDuplicateAlertShown(true) // 标记已显示提示
              stopCollection()
              setProgressText(collectResult.message)
              alert(collectResult.message)
              return false // 停止采集
            }
            
            // 处理眨眼验证
            if (collectResult.verification_mode) {
              setVerificationMode(true)
              setIsBlinkVerification(true)
              setVerificationMessage('请眨眼验证 - 防止照片攻击')
              setProgressText(`眨眼验证中... (${currentCollected}/${newTargetImages})`)
              // 在验证模式下，继续采集但不增加计数
              return true // 继续采集
            } else if (collectResult.verification_complete) {
              setVerificationMode(false)
              setIsBlinkVerification(false)
              setVerificationMessage('')
              setBlinkCount(0)
              setProgressText("眨眼验证通过，继续录入...")
              // 验证完成后，继续采集
              return true // 继续采集
            } else {
              setVerificationMode(false)
              setIsBlinkVerification(false)
              setVerificationMessage('')
              setProgressText(`正在采集图像: ${currentCollected}/${newTargetImages}`)
            }
            
            // 更新已采集图像列表（只保留最新的几张用于显示）
            setCapturedImages(prev => {
              const newImages = [...prev, imageData]
              return newImages.slice(-5) // 只保留最新的5张图像用于显示
            })

            // 检查是否完成采集
            if (collectResult.completed) {
              stopCollection()
              setProgressText('图像采集完成，开始训练模型...')

              // 3. 开始训练
              const trainResponse = await fetch(`${API_BASE_URL}/train_session`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  session_id: newSessionId
                }),
              })

              const trainResult = await trainResponse.json()
              console.log('[前端] Python训练结果:', trainResult);
              
              if (trainResult.success) {
                setProgressText('人脸录入成功！')
                alert(`人脸录入成功！用户: ${username}，共训练 ${trainResult.samples} 张图像`)
                
                // 重置状态
                setCapturedImages([])
                setProgress(0)
                setIsBlinkVerification(false)
                setBlinkCount(0)
                setVerificationMode(false)
                setVerificationMessage('')
                setCollectedImages(0)
                setSessionId('') // 确保sessionId被清空
                setUsername('') // 确保username被清空
                
                // 新增：跳转到登录界面
                setTimeout(() => {
                  window.location.href = '/'
                }, 100) // 1秒后跳转，让用户看到成功提示
                if (onSuccess) onSuccess();
              } else {
                console.error('[前端] 训练失败:', trainResult.message);
                throw new Error(trainResult.message || '训练失败')
              }
              return false // 停止采集
            }
            
            return true // 继续采集
          } else {
            // 处理错误情况
            if (collectResult.duplicate && !duplicateAlertShown) {
              setDuplicateAlertShown(true) // 标记已显示提示
              stopCollection()
              setProgressText(collectResult.message)
              alert(collectResult.message)
              return false // 停止采集
            } else {
              console.log('当前帧处理失败:', collectResult.message)
              // 如果未检测到人脸，停止进度条但不中断流程
              if (collectResult.message && collectResult.message.includes('未检测到人脸')) {
                setProgressText('未检测到人脸，请确保人脸清晰可见')
                // 继续尝试，不返回false
              }
              return true // 继续采集
            }
          }
        } catch (error) {
          console.error('采集图像错误:', error)
          return true // 继续采集
        }
      }

      // 使用递归调用来实现同步采集
      const startCollection = async () => {
        if (!collectIntervalRef.current) return // 如果已停止，退出
        
        const shouldContinue = await collectNextImage()
        if (shouldContinue && collectIntervalRef.current) {
          // 延迟100ms后采集下一张
          setTimeout(startCollection, 100)
        }
      }

      // 设置采集标志位
      collectIntervalRef.current = true
      
      // 开始采集
      startCollection()

      // 设置超时保护，防止无限循环
      setTimeout(() => {
        if (collectedImages < newTargetImages && collectIntervalRef.current) {
          stopCollection()
          setProgressText('采集超时，请重试')
          alert('图像采集超时，请确保人脸清晰可见并重试')
        }
      }, 120000) // 2分钟超时

    } catch (error) {
      console.error('详细错误信息:', error)
      console.error('错误类型:', (error as Error).constructor.name)
      setProgressText('人脸录入失败')
      alert(`人脸录入失败: ${(error as Error).message || '未知错误'}`)
      setIsTraining(false)
      setIsBlinkVerification(false)
      setBlinkCount(0)
      setVerificationMode(false)
      setVerificationMessage('')
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
    <div className="w-full flex flex-col items-center justify-center gap-3">
      {/* 人脸录入区域 */}
      {/* 删除Card相关包裹，直接渲染内容 */}
      {/* 摄像头预览区域 */}
      <div className="flex justify-center w-full">
        <div className="w-80 h-52 bg-transparent flex items-center justify-center relative overflow-hidden">
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
              {isBlinkVerification && (
                <div className="absolute inset-0 flex items-center justify-center bg-yellow-500/30">
                  <div className="text-center text-yellow-800 bg-white/90 rounded-lg p-4 max-w-xs">
                    <Eye className="w-8 h-8 mx-auto mb-2 animate-pulse text-yellow-600" />
                    <p className="text-sm font-medium mb-1">请眨眼验证</p>
                    <p className="text-xs text-yellow-700 mb-2">防止照片攻击</p>
                    <div className="flex justify-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              {verificationMode && !isBlinkVerification && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-500/30">
                  <div className="text-center text-blue-800 bg-white/90 rounded-lg p-4 max-w-xs">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 animate-pulse text-blue-600" />
                    <p className="text-sm font-medium">验证模式</p>
                    <p className="text-xs text-blue-700">请配合验证</p>
                  </div>
                </div>
              )}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white bg-black/50 px-1 rounded">LIVE</span>
              </div>
              {isTraining && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  已采集 {collectedImages}/{targetImages}
                </div>
              )}
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
      {isTraining && (
        <div className="space-y-1 w-full">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">{progressText || `正在采集图像: ${collectedImages}/${targetImages}`}</span>
            <span className="text-blue-600">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {verificationMessage && (
            <div className="text-xs text-yellow-600 bg-yellow-50 p-1 rounded mt-1">
              {verificationMessage}
            </div>
          )}
          {/* 调试信息不再显示或始终占位不闪烁 */}
          <div className="text-xs text-gray-500 min-h-[16px] invisible select-none">调试</div>
        </div>
      )}
      
      {/* 操作按钮 */}
      <div className={`w-full ${progressBottomGap}`}>
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
              disabled={isTraining || !username}
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
      {/* 隐藏的canvas用于捕获图像 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
