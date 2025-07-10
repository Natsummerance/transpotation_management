"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Camera,
  Shield,
  User,
  Lock,
  Mail,
  Phone,
  Scan,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  Video,
  VideoOff,
} from "lucide-react"
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

type LoginMode = "password" | "code" | "face"
type RegisterStep = "info" | "face" | "success"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loginMode, setLoginMode] = useState<LoginMode>("password")
  const [registerStep, setRegisterStep] = useState<RegisterStep>("info")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [faceRecognitionActive, setFaceRecognitionActive] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  //找回密码
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // 表单数据
  const [loginData, setLoginData] = useState({
    account: "",
    password: "",
    code: "",
  })

  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
  })

  // 启动摄像头
  const startCamera = async () => {
    try {
      console.log("开始启动摄像头...")
      setCameraError(null)
      
      // 先停止现有的流
      if (stream) {
        console.log("停止现有摄像头流")
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      console.log("摄像头流获取成功，设置到视频元素...")
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // 添加视频加载事件监听
        return new Promise<boolean>((resolve) => {
          const video = videoRef.current!
          let resolved = false
          
          const cleanup = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
            video.removeEventListener('loadeddata', onLoadedData)
          }
          
          const onLoadedMetadata = () => {
            console.log("视频元数据已加载，尺寸:", video.videoWidth, "x", video.videoHeight)
            if (video.videoWidth > 0 && video.videoHeight > 0 && !resolved) {
              resolved = true
              cleanup()
              resolve(true)
            }
          }
          
          const onLoadedData = () => {
            console.log("视频数据已加载，readyState:", video.readyState)
            if (video.readyState >= 2 && video.videoWidth > 0 && !resolved) {
              resolved = true
              cleanup()
              resolve(true)
            }
          }
          
          const onError = (error: Event) => {
            console.error("视频加载错误:", error)
            if (!resolved) {
              resolved = true
              cleanup()
              setCameraError("视频流加载失败")
              resolve(false)
            }
          }
          
          video.addEventListener('loadedmetadata', onLoadedMetadata)
          video.addEventListener('loadeddata', onLoadedData)
          video.addEventListener('error', onError)
          
          // 开始播放视频
          video.play().then(() => {
            console.log("视频开始播放")
          }).catch((playError) => {
            console.error("视频播放失败:", playError)
            if (!resolved) {
              resolved = true
              cleanup()
              setCameraError("视频播放失败")
              resolve(false)
            }
          })
          
          // 设置超时，防止无限等待
          setTimeout(() => {
            if (!resolved) {
              console.error("摄像头启动超时，当前状态:", {
                readyState: video.readyState,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                paused: video.paused
              })
              resolved = true
              cleanup()
              setCameraError("摄像头启动超时，请检查设备连接")
              resolve(false)
            }
          }, 12000)
        })
      } else {
        console.error("视频元素不存在")
        setCameraError("视频元素未找到")
        return false
      }
    } catch (error) {
      console.error("Camera access failed:", error)
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError("摄像头权限被拒绝，请在浏览器中允许访问摄像头")
        } else if (error.name === 'NotFoundError') {
          setCameraError("未找到摄像头设备，请检查设备连接")
        } else if (error.name === 'NotReadableError') {
          setCameraError("摄像头被其他应用占用，请关闭其他使用摄像头的程序")
        } else if (error.name === 'OverconstrainedError') {
          setCameraError("摄像头不支持请求的配置")
        } else {
          setCameraError(`摄像头启动失败: ${error.message}`)
        }
      } else {
        setCameraError("无法访问摄像头，请检查权限设置")
      }
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
    console.log("开始捕获图像...")
    
    if (!videoRef.current || !canvasRef.current) {
      console.error("视频或画布元素不存在")
      return null
    }

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      console.error("无法获取canvas 2D上下文")
      return null
    }

    // 详细检查视频状态
    console.log("视频状态检查:", {
      readyState: video.readyState,
      networkState: video.networkState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      paused: video.paused,
      ended: video.ended,
      currentTime: video.currentTime
    })

    // 检查视频是否已准备就绪
    if (video.readyState < 2) {
      console.error("视频未准备就绪，readyState:", video.readyState)
      return null
    }

    // 检查视频是否已加载并有有效尺寸
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("视频尺寸无效:", { 
        width: video.videoWidth, 
        height: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState
      })
      return null
    }

    // 检查视频是否暂停或结束
    if (video.paused || video.ended) {
      console.error("视频已暂停或结束:", { paused: video.paused, ended: video.ended })
      return null
    }

    // 检查摄像头流是否仍然活跃
    if (stream && !stream.active) {
      console.error("摄像头流已断开")
      return null
    }

    try {
      // 设置画布尺寸
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 绘制视频帧
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)

      // 转换为base64图像数据
      const imageData = canvas.toDataURL("image/jpeg", 0.8)
      
      // 验证图像数据
      if (!imageData || imageData.length < 1000) {
        console.error("图像数据无效或过小:", imageData?.length || 0)
        return null
      }
      
      console.log("成功捕获图像，数据长度:", imageData.length, "画布尺寸:", canvas.width, "x", canvas.height)
      return imageData
    } catch (error) {
      console.error("捕获图像时发生错误:", error)
      return null
    }
  }

  // 调用人脸识别API
  const performFaceRecognition = async (imageData: string) => {
    try {
      // 移除base64前缀
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
      
      const response = await fetch("/api/user/login/face", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Data,
        }),
      })

      const result = await response.json()
      return {
        success: result.code === "1",
        message: result.msg,
        user: result.data
      }
    } catch (error) {
      console.error("Face recognition failed:", error)
      throw error
    }
  }

const [loginError, setLoginError] = useState<string | null>(null);

  // 调用登录接口 POST /api/user/login
  const handleLogin = async () => {
    if (!loginData.account || !loginData.password) {
      setLoginError("请输入账号和密码");
      return;
    }
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await fetch(`/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uname: loginData.account,
          password: loginData.password
        }),
      });
      const result = await response.json();
      if (result.code === "1") {
        localStorage.setItem("user", JSON.stringify(result.data));
        window.location.href = "/dashboard";
      } else {
        setLoginError(result.msg || "登录失败");
      }
    } catch (error) {
      setLoginError("登录请求失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 验证码登录
  const handleCodeLogin = async () => {
    if (!loginData.account || !loginData.code) {
      setLoginError("请输入邮箱和验证码");
      return;
    }
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await fetch(`/api/auth/loginByCode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.account,
          code: loginData.code
        }),
      });
      const result = await response.json();
      if (result.code === "1") {
        localStorage.setItem("user", JSON.stringify(result.data));
        window.location.href = "/dashboard";
      } else {
        setLoginError(result.msg || "验证码登录失败");
      }
    } catch (error) {
      setLoginError("验证码登录请求失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 调用注册接口 POST /user/register
  const handleRegister = async () => {
    if (registerStep === "info") {
      // 验证密码确认
      if (registerData.password !== registerData.confirmPassword) {
        alert("两次输入的密码不一致")
        return
      }
      
      setIsLoading(true)
      try {
        // 构建User对象
        const userObj = {
          uname: registerData.username,
          password: registerData.password,
          email: registerData.email,
          phone: registerData.phone
        };

        const response = await fetch("/api/user/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userObj),
        })

        const result = await response.json()

        if (response.ok && result.code === "1") {
          // 注册成功
          alert(result.msg || "注册成功！")
          setTimeout(() => {
            setIsLoading(false)
            setRegisterStep("face")
          }, 1000)
        } else {
          // 注册失败
          alert(result.msg || "注册失败")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Registration failed:", error)
        alert("网络错误，请稍后重试")
        setIsLoading(false)
      }
    } else if (registerStep === "face") {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setRegisterStep("success")
      }, 3000)
    }
  }


  // 等待视频准备就绪
  const waitForVideoReady = async (maxWaitTime = 8000) => {
    if (!videoRef.current) {
      console.error("视频元素不存在")
      return false
    }
    
    const video = videoRef.current
    const startTime = Date.now()
    
    return new Promise<boolean>((resolve) => {
      const checkReady = () => {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime
        
        console.log(`视频状态检查 - readyState: ${video.readyState}, 尺寸: ${video.videoWidth}x${video.videoHeight}, 已等待: ${elapsed}ms`)
        
        // 检查视频是否已准备就绪
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          console.log("视频流已准备就绪")
          resolve(true)
        } else if (elapsed > maxWaitTime) {
          console.error(`等待视频准备超时 (${maxWaitTime}ms)，当前状态: readyState=${video.readyState}, 尺寸=${video.videoWidth}x${video.videoHeight}`)
          resolve(false)
        } else {
          // 继续等待，检查间隔稍微增加以减少CPU使用
          setTimeout(checkReady, 200)
        }
      }
      
      // 立即开始第一次检查
      checkReady()
    })
  }

  // 人脸识别流程
  const startFaceRecognition = async () => {
    if (!stream) {
      setCameraError("摄像头未启动，请稍后重试")
      return
    }

    if (!videoRef.current) {
      setLoginError("视频元素未找到，请刷新页面重试")
      return
    }

    setFaceRecognitionActive(true)
    setLoginError(null)

    try {
      console.log("开始人脸识别流程...")
      
      // 首先检查摄像头流是否活跃
      if (!stream.active) {
        console.error("摄像头流已断开")
        setLoginError("摄像头连接已断开，请重新启动摄像头")
        return
      }
      
      // 等待视频准备就绪
      console.log("等待视频流准备就绪...")
      const isVideoReady = await waitForVideoReady()
      if (!isVideoReady) {
        // 尝试重新启动摄像头
        console.log("视频未准备就绪，尝试重新启动摄像头...")
        const restartSuccess = await startCamera()
        if (restartSuccess) {
          // 重新等待视频准备
          const retryReady = await waitForVideoReady(3000)
          if (!retryReady) {
            setLoginError("摄像头初始化失败，请检查摄像头权限或刷新页面重试")
            return
          }
        } else {
          setLoginError("摄像头启动失败，请检查摄像头权限或设备连接")
          return
        }
      }
      
      console.log("视频流已准备就绪，等待画面稳定...")
      // 等待画面稳定
      await new Promise(resolve => setTimeout(resolve, 800))
      
      console.log("开始捕获图像...")
      const imageData = captureFrame()
      if (imageData) {
        console.log("图像捕获成功，开始人脸识别...")
        const result = await performFaceRecognition(imageData)

        if (result.success) {
          // 人脸识别登录成功
          localStorage.setItem("user", JSON.stringify(result.user))
          alert(result.message || "人脸识别登录成功！")
          window.location.href = "/dashboard"
        } else {
          // 人脸识别失败
          setLoginError(result.message || "人脸识别失败，未找到匹配用户")
        }
      } else {
        setLoginError("无法获取摄像头图像，请确保摄像头正常工作并重试")
      }
    } catch (error) {
      console.error("Face recognition error:", error)
      setLoginError("人脸识别过程中出现错误，请重试")
    } finally {
      setFaceRecognitionActive(false)
    }
  }

  // 发送验证码功能
  const sendVerificationCode = async () => {
    if (!loginData.account) {
      alert("请输入邮箱地址");
      return;
    }
    
    try {
      const response = await fetch("/api/auth/sendCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: loginData.account }),
      });
      
      const result = await response.json();
      if (result.code === "0") {
        alert("验证码已发送到您的邮箱");
        // 启动倒计时
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        alert(result.msg || "发送验证码失败");
      }
    } catch (error) {
      console.error("Send code failed:", error)
      alert("发送验证码失败，请稍后重试");
    }
  }

  const resetToLogin = () => {
    setIsLogin(true)
    setRegisterStep("info")
    setFaceRecognitionActive(false)
    stopCamera()
    setCameraError(null)
  }

  // 自动启动摄像头当切换到人脸识别模式时
  useEffect(() => {
    if (loginMode === "face" && isLogin) {
      console.log("切换到人脸识别模式，启动摄像头...")
      const initCamera = async () => {
        try {
          const success = await startCamera()
          if (!success) {
            console.error("摄像头启动失败，尝试重试...")
            // 等待1秒后重试一次
            setTimeout(async () => {
              console.log("重试启动摄像头...")
              const retrySuccess = await startCamera()
              if (!retrySuccess) {
                console.error("摄像头重试启动也失败")
                setCameraError("摄像头启动失败，请检查设备权限或刷新页面重试")
              } else {
                console.log("摄像头重试启动成功")
              }
            }, 1000)
          } else {
            console.log("摄像头启动成功")
          }
        } catch (error) {
          console.error("摄像头初始化过程中发生错误:", error)
          setCameraError("摄像头初始化失败")
        }
      }
      initCamera()
    } else {
      console.log("停止摄像头...")
      stopCamera()
    }
  }, [loginMode, isLogin])

  // 清理摄像头资源
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><g fill="#ffffff" fillOpacity="0.05"><circle cx="30" cy="30" r="2"/></g></g></svg>')}")`,
          }}
        ></div>
      </div>

      <div className="absolute top-4 sm:top-10 left-4 sm:left-10 text-white/20 hidden sm:block">
        <div className="w-16 sm:w-32 h-16 sm:h-32 rounded-full border border-white/10 flex items-center justify-center">
          <Shield className="w-8 sm:w-16 h-8 sm:h-16" />
        </div>
      </div>

      <div className="absolute bottom-4 sm:bottom-10 right-4 sm:right-10 text-white/20 hidden sm:block">
        <div className="w-12 sm:w-24 h-12 sm:h-24 rounded-full border border-white/10 flex items-center justify-center">
          <Camera className="w-6 sm:w-12 h-6 sm:h-12" />
        </div>
      </div>

      <Card className="w-full max-w-sm sm:max-w-md backdrop-blur-sm bg-white/95 shadow-2xl border-0 mx-2">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="mx-auto mb-4 sm:mb-6 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            智慧交管系统
          </CardTitle>
          <CardDescription className="text-gray-600 text-base sm:text-lg">
            {isLogin ? "登录您的账户" : "创建新账户"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {isLogin ? (
            // 登录界面
            <Tabs value={loginMode} onValueChange={(value) => setLoginMode(value as LoginMode)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 bg-gray-100 h-10 sm:h-auto">
                <TabsTrigger
                  value="password"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-1 sm:px-3"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">密码登录</span>
                  <span className="sm:hidden">密码</span>
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-1 sm:px-3"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">验证码</span>
                  <span className="sm:hidden">验证码</span>
                </TabsTrigger>
                <TabsTrigger
                  value="face"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-1 sm:px-3"
                >
                  <Scan className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">人脸识别</span>
                  <span className="sm:hidden">人脸</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account" className="text-sm font-medium text-gray-700">
                    账户
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="account"
                      placeholder="用户名/邮箱/手机号"
                      className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                      value={loginData.account}
                      onChange={(e) => setLoginData({ ...loginData, account: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    密码
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="请输入密码"
                      className="pl-10 pr-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3 sm:w-4 h-3 sm:h-4" />
                      ) : (
                        <Eye className="w-3 sm:w-4 h-3 sm:h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Button
                    className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg text-sm sm:text-base"
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        登录中...
                      </div>
                    ) : (
                      "登录系统"
                    )}
                  </Button>
                  <Button
                    variant="link"
                    className="absolute -bottom-9 right-0 text-xs text-blue-600 hover:text-blue-700"
                    onClick={() => setForgotPasswordOpen(true)}
                  >
                    忘记密码?
                  </Button>
                  <ForgotPasswordModal
                    open={forgotPasswordOpen}
                    onClose={() => setForgotPasswordOpen(false)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="code" className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-code" className="text-sm font-medium text-gray-700">
                    手机号/邮箱
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="account-code"
                      placeholder="请输入手机号或邮箱"
                      className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                      value={loginData.account}
                      onChange={(e) => setLoginData({ ...loginData, account: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                    验证码
                  </Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="code"
                        placeholder="请输入验证码"
                        className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                        value={loginData.code}
                        onChange={(e) => setLoginData({ ...loginData, code: e.target.value })}
                      />
                    </div>
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="h-10 sm:h-12 px-2 sm:px-4 border-gray-200 hover:bg-gray-50 bg-transparent text-xs sm:text-sm"
                        onClick={sendVerificationCode}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}s` : "发送"}
                      </Button>
                      <div className="absolute -bottom-5 right-0 text-xs text-gray-400">敬请期待</div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Button
                    className="w-full h-10 sm:h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg text-sm sm:text-base"
                    onClick={handleCodeLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        验证中...
                      </div>
                    ) : (
                      "验证登录"
                    )}
                  </Button>
                  <div className="absolute -bottom-5 right-0 text-xs text-gray-400"></div>
                </div>
              </TabsContent>

              <TabsContent value="face" className="space-y-4 sm:space-y-6">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">人脸识别登录</h3>
                    <p className="text-sm text-gray-600">请正对摄像头，保持面部清晰可见</p>
                  </div>
                  <div className="mx-auto w-80 h-60 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
                    {stream ? (
                      <div className="relative w-full h-full">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover rounded-lg"
                          autoPlay
                          muted
                          playsInline
                        />
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                        />
                        {faceRecognitionActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="text-center text-white">
                              <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin" />
                              <p className="text-lg font-medium">正在识别人脸...</p>
                              <p className="text-sm opacity-80">请保持静止</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-white bg-black/60 px-2 py-1 rounded-md font-medium">LIVE</span>
                        </div>
                        {/* 人脸识别框架 */}
                        <div className="absolute inset-4 border-2 border-green-400 rounded-lg opacity-60">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        {cameraError ? (
                          <div className="text-center text-red-600">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                            <p className="text-base font-medium mb-2">摄像头启动失败</p>
                            <p className="text-sm">{cameraError}</p>
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() => {
                                setCameraError(null)
                                startCamera()
                              }}
                            >
                              重试
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-base font-medium text-gray-700 mb-2">正在启动摄像头...</p>
                            <p className="text-sm text-gray-500">请允许浏览器访问摄像头权限</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg text-base disabled:opacity-50"
                      onClick={startFaceRecognition}
                      disabled={!stream || faceRecognitionActive || isLoading}
                    >
                      {faceRecognitionActive ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-5 w-5 mr-3" />
                          识别中，请稍候...
                        </div>
                      ) : (
                        <>
                          <Scan className="w-5 h-5 mr-3" />
                          开始人脸识别
                        </>
                      )}
                    </Button>
                    {!stream && !cameraError && (
                      <p className="text-xs text-gray-400 mt-2 text-center">摄像头启动后即可开始识别</p>
                    )}
                  </div>
                  {loginError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">{loginError}</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            // 注册界面保持原有逻辑
            <div className="space-y-4 sm:space-y-6">
              {registerStep === "info" && (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                        用户名
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="username"
                          placeholder="请输入用户名"
                          className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                          value={registerData.username}
                          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          邮箱
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="请输入邮箱地址"
                            className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          手机号
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="phone"
                            placeholder="请输入手机号"
                            className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-sm font-medium text-gray-700">
                        密码
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="请输入密码"
                          className="pl-10 pr-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-3 sm:w-4 h-3 sm:h-4" />
                          ) : (
                            <Eye className="w-3 sm:w-4 h-3 sm:h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                        确认密码
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="请再次输入密码"
                          className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Button
                      className="w-full h-10 sm:h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg text-sm sm:text-base"
                      onClick={handleRegister}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          注册中...
                        </div>
                      ) : (
                        "下一步：录入人脸"
                      )}
                    </Button>
                    <div className="absolute -bottom-5 right-0 text-xs text-gray-400"></div>
                  </div>
                </>
              )}

              {registerStep === "face" && (
                <>
                  <div className="text-center space-y-3 sm:space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">录入人脸信息</h3>
                    <p className="text-sm text-gray-600">请正对摄像头，保持面部清晰可见</p>
                  </div>
                  <div className="text-center space-y-4 sm:space-y-6">
                    <div className="mx-auto w-64 h-48 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
                      {stream ? (
                        <div className="relative w-full h-full">
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover rounded-lg"
                            autoPlay
                            muted
                            playsInline
                          />
                          {faceRecognitionActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="text-center text-white">
                                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                                <p className="text-sm font-medium">正在录入...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          {cameraError ? (
                            <div className="text-center text-red-600">
                              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">{cameraError}</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Camera className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
                              <p className="text-sm text-gray-600">点击开始录入人脸</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <Button
                        className="w-full h-10 sm:h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg text-sm sm:text-base"
                        onClick={startFaceRecognition}
                        disabled={faceRecognitionActive || isLoading}
                      >
                        {faceRecognitionActive ? (
                          <div className="flex items-center">
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            录入中...
                          </div>
                        ) : stream ? (
                          <>
                            <Scan className="w-4 h-4 mr-2" />
                            开始录入人脸
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            启动摄像头
                          </>
                        )}
                      </Button>
                      <div className="absolute -bottom-5 right-0 text-xs text-gray-400">人脸录入功能（演示）</div>
                    </div>
                    {stream && (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => {
                          stopCamera()
                          setCameraError(null)
                        }}
                      >
                        <VideoOff className="w-4 h-4 mr-2" />
                        关闭摄像头
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full text-gray-500 hover:text-gray-700"
                      onClick={() => setRegisterStep("success")}
                    >
                      跳过此步骤
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-10 sm:h-12 border-gray-200 hover:bg-gray-50 bg-transparent text-sm sm:text-base"
                    onClick={() => setRegisterStep("info")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回上一步
                  </Button>
                </>
              )}

              {registerStep === "success" && (
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">注册成功！</h3>
                    <p className="text-gray-600">您的账户已创建完成，人脸信息已录入</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-left">
                    <h4 className="font-medium text-green-800 mb-2">账户信息</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p>用户名: {registerData.username}</p>
                      <p>邮箱: {registerData.email}</p>
                      <p>手机号: {registerData.phone}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg text-sm sm:text-base"
                    onClick={resetToLogin}
                  >
                    立即登录
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 切换登录/注册 */}
          {registerStep === "info" && (
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "还没有账户？" : "已有账户？"}
                <Button
                  variant="link"
                  className="p-0 ml-1 text-blue-600 hover:text-blue-700 text-sm"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "立即注册" : "立即登录"}
                </Button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 隐藏的canvas用于捕获图像 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
