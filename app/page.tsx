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
import { encryptAES } from "@/lib/cryptoFront";
import { useTranslation } from 'react-i18next';
import FaceRecognitionModule from "@/components/face-recognition-module";


type LoginMode = "password" | "code" | "face"
type RegisterStep = "info" | "face" | "success"

export default function LoginPage() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true)
  const [loginMode, setLoginMode] = useState<LoginMode>("password")
  const [registerStep, setRegisterStep] = useState<RegisterStep>("info")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [faceRecognitionActive, setFaceRecognitionActive] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  // 新增：人脸录入进度状态
  const [faceRegistrationProgress, setFaceRegistrationProgress] = useState(0)
  const [faceRegistrationText, setFaceRegistrationText] = useState('')
  const [isBlinkVerification, setIsBlinkVerification] = useState(false)
  const [collectedImages, setCollectedImages] = useState(0)
  const [targetImages, setTargetImages] = useState(0)

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
          account: loginData.account,
          password: loginData.password
        }),
      });
      const result = await response.json();
      if (result.code === "1") {
        localStorage.setItem("token", result.data.token);
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
        localStorage.setItem("token", result.data.token);
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
    }
    // 注意：人脸录入步骤现在由单独的按钮处理，不在handleRegister中
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
        // 延迟一点启动，确保UI已经渲染完成
        setTimeout(initCamera, 500)
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

  // 摄像头相关函数
  const startCamera = async () => {
    try {
      setCameraError(null)
      console.log("请求摄像头权限...")
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      console.log("摄像头权限获取成功，设置视频流...")
      setStream(mediaStream)
      
      // 等待video元素渲染完成
      let retryCount = 0;
      const maxRetries = 10;
      
      while (!videoRef.current && retryCount < maxRetries) {
        console.log(`等待video元素渲染... 重试 ${retryCount +1}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve,100))
        retryCount++
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
        console.log("视频元素开始播放")
        return true
      } else {
        console.error("视频元素引用不存在，无法设置视频流")
        // 清理已获取的stream
        mediaStream.getTracks().forEach(track => track.stop())
        setStream(null)
        setCameraError("视频元素初始化失败，请刷新页面重试")
        return false
      }
      
    } catch (error) {
      console.error("Camera access failed:", error)
      setCameraError("无法访问摄像头，请检查权限设置")
      return false
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

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

  // 人脸识别登录流程
  const startFaceRecognition = async () => {
    if (!stream) {
      const cameraStarted = await startCamera()
      if (!cameraStarted) return
    }
    setFaceRecognitionActive(true)
    setLoginError(null)
    
    try {
      const imageData = captureFrame()
      if (imageData) {
        // 移除base64前缀
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "")
        
        console.log('开始人脸识别，发送图像数据到后端...')
        console.log('图像数据长度:', base64Data.length)
        
        // 直接调用后端接口，使用 JSON 格式
        const response = await fetch('http://localhost:5000/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data })
        })
        
        console.log('后端响应状态:', response.status)
        console.log('后端响应头:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          console.error('HTTP错误:', response.status, response.statusText)
          const errorText = await response.text()
          console.error('错误响应内容:', errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('后端响应数据:', result)
        
        if (result.success === true) {
          // 识别成功，调用后端API获取用户信息和token
          const loginResponse = await fetch('/api/user/login/face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              username: result.username 
            })
          })
          
          const loginResult = await loginResponse.json()
          console.log('登录API响应:', loginResult)
          
          if (loginResult.code === '1') {
            // 登录成功，保存token和用户信息
            localStorage.setItem('token', loginResult.data.token)
            localStorage.setItem('user', JSON.stringify(loginResult.data))
            
            // 新增：关闭摄像头
            stopCamera()
            
            alert(`人脸识别登录成功！欢迎 ${loginResult.data.uname}`)
            window.location.href = '/dashboard'
          } else {
            setLoginError(loginResult.msg || '获取用户信息失败')
          }
        } else {
          setLoginError(result.message || '人脸识别失败，未找到匹配用户')
        }
      } else {
        setLoginError('无法获取摄像头图像，请确保摄像头正常工作')
      }
    } catch (error) {
      console.error('Face recognition error:', error)
      setLoginError('人脸识别过程中出现错误，请重试')
    } finally {
      setFaceRecognitionActive(false)
      // 新增：确保关闭摄像头
      stopCamera()
    }
  }

  // 人脸录入流程（增强版）
  const startFaceRegistration = async () => {
    // 如果摄像头未打开，自动打开
    let cameraStarted = !!stream
    if (!cameraStarted) {
      cameraStarted = await startCamera()
      if (!cameraStarted) return
    }
    setFaceRecognitionActive(true)
    setLoginError(null)
    console.log('设置faceRecognitionActive为true')
    
    try {
      console.log('开始人脸录入...')
      console.log('用户名:', registerData.username)
      
      // 1. 开始录入会话
      const startResponse = await fetch('http://localhost:5000/start_registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: registerData.username })
      })
      
      console.log('开始录入会话响应状态:', startResponse.status)
      
      if (!startResponse.ok) {
        console.error('开始录入会话HTTP错误:', startResponse.status, startResponse.statusText)
        const errorText = await startResponse.text()
        console.error('错误响应内容:', errorText)
        setLoginError(`开始录入会话失败: HTTP ${startResponse.status}`)
        return
      }
      
      const startResult = await startResponse.json()
      console.log('开始录入会话响应数据:', startResult)
      
      if (!startResult.success) {
        setLoginError(startResult.message || '开始录入会话失败')
        return
      }

      const sessionId = startResult.session_id
      const targetImages = startResult.target_images
      
      // 设置初始状态
      setTargetImages(targetImages)
      setCollectedImages(0)
      setFaceRegistrationProgress(0)
      setFaceRegistrationText('开始采集人脸图像...')
      setIsBlinkVerification(false)
      
      console.log('开始采集人脸图像，目标:', targetImages, '张')
      
      // 2. 连续采集图像
      let collectedCount = 0
      const collectNextImage = async () => {
        if (collectedCount >= targetImages) {
          // 采集完成，开始训练
          setFaceRegistrationText('图像采集完成，开始训练模型...')
          console.log('图像采集完成，开始训练模型...')
          
          const trainResponse = await fetch('http://localhost:5000/train_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          })
          
          const trainResult = await trainResponse.json()
          console.log('训练结果:', trainResult)
          
          if (trainResult.success) {
            setFaceRegistrationText('人脸录入成功！')
            alert(`人脸录入成功！用户: ${registerData.username}，共训练 ${trainResult.samples} 张图像`)
            stopCamera();
            setRegisterStep('success')
          } else {
            setLoginError(trainResult.message || '训练失败')
          }
          return
        }
        
        // 捕获图像
        const imageData = captureFrame()
        if (!imageData) {
          setLoginError('无法获取摄像头图像')
          return
        }
        
        // 移除base64
        const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "")
        
        // 发送图像到后端
        const collectResponse = await fetch('http://localhost:5000/collect_image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            session_id: sessionId,
            image: base64Data 
          })
        })
        
        if (!collectResponse.ok) {
          const errorText = await collectResponse.text()
          console.error('采集图像失败:', errorText)
          setLoginError('采集图像失败')
          return
        }
        
        const collectResult = await collectResponse.json()
        console.log('采集结果:', collectResult)
        
        if (collectResult.success) {
          // 使用后端返回的准确数据
          const currentCollected = collectResult.collected_images || collectedCount + 1
          const currentProgress = collectResult.progress || ((currentCollected / targetImages) * 100)
          
          collectedCount = currentCollected
          setCollectedImages(currentCollected)
          setFaceRegistrationProgress(currentProgress)
          
          console.log(`已采集 ${currentCollected}/${targetImages} 张图像，进度: ${currentProgress.toFixed(1)}%`)
          
          // 更新状态文本
          if (collectResult.verification_mode) {
            setIsBlinkVerification(true)
            setFaceRegistrationText('请眨眼进行验证...')
            console.log('进入眨眼验证模式')
            setTimeout(() => collectNextImage(), 500)
          } else if (collectResult.verification_complete) {
            setIsBlinkVerification(false)
            setFaceRegistrationText('眨眼验证通过，继续录入...')
            setTimeout(() => collectNextImage(), 200)
          } else {
            setIsBlinkVerification(false)
            setFaceRegistrationText(`正在采集图像... ${currentCollected}/${targetImages}`)
            // 继续采集下一张
            setTimeout(() => collectNextImage(), 200)
          }
        } else {
          // 处理错误情况
          if (collectResult.duplicate) {
            setLoginError(collectResult.message || '检测到重复人脸')
            return
          } else {
            console.log('当前帧处理失败:', collectResult.message)
            // 如果是未检测到人脸，继续尝试，不显示错误
            if (collectResult.message && collectResult.message.includes('未检测到人脸')) {
              console.log('未检测到人脸，继续尝试...')
              setTimeout(() => collectNextImage(), 200)
            } else {
              // 其他错误才显示
              setLoginError(collectResult.message || '采集图像失败')
            }
          }
        }
      }
      
      // 开始采集
      collectNextImage()
      
    } catch (error) {
      console.error('Face registration error:', error)
      setLoginError('人脸录入过程中出现错误，请重试')
    } finally {
      setFaceRecognitionActive(false)
      // 不要在这里stopCamera()
    }
  }

  // 注册成功后跳转到人脸录入步骤，直接渲染 FaceRecognitionModule
  if (!isLogin && registerStep === "face") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"none\" fillRule=\"evenodd\"><g fill=\"#ffffff\" fillOpacity=\"0.05\"><circle cx=\"30\" cy=\"30\" r=\"2\"/></g></g></svg>')}")`,
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
        <Card className="w-full max-w-md shadow-none border-0 backdrop-blur-sm bg-white/95 mx-2 rounded-2xl p-0">
          <div className="flex flex-col items-center justify-center pt-6 pb-2">
            <div className="mx-auto mb-3 w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
            </div>
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 select-none text-center" suppressHydrationWarning>
              {t('smart_traffic_management_system')}
            </div>
            <div className="text-base text-gray-600 text-center mb-2">创建新账户</div>
            <div className="text-lg font-bold text-gray-900 text-center">人脸录入信息</div>
          </div>
          <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 gap-4">
            <div className="w-full flex flex-col items-center justify-center bg-transparent shadow-none border-0">
              <FaceRecognitionModule username={registerData.username} onSuccess={() => setRegisterStep("success")}/>
            </div>
            <Button variant="ghost" className="w-full mt-2 rounded-full text-gray-500 hover:text-blue-600 transition-all text-center" onClick={() => setRegisterStep("success")}>跳过此步骤</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLogin && registerStep === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
        {/* 背景装饰同上 */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"none\" fillRule=\"evenodd\"><g fill=\"#ffffff\" fillOpacity=\"0.05\"><circle cx=\"30\" cy=\"30\" r=\"2\"/></g></g></svg>')}")`,
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
        <Card className="w-full max-w-sm shadow-none border-0 backdrop-blur-sm bg-white/95 mx-2 rounded-2xl p-0">
          <div className="flex flex-col items-center justify-center pt-6 pb-2">
            <div className="mx-auto mb-3 w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
            </div>
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 select-none text-center" suppressHydrationWarning>
              {t('smart_traffic_management_system')}
            </div>
          </div>
          <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 gap-4">
            <div className="w-full flex flex-col items-center justify-center gap-2">
              <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
              <div className="text-lg font-bold text-green-700 mb-1">注册成功！</div>
              <div className="text-gray-700 text-sm mb-2">您的账户已创建并完成了人脸信息录入。</div>
              <div className="w-full bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-2">
                <div><span className="font-semibold">用户名：</span>{registerData.username}</div>
                <div><span className="font-semibold">邮箱：</span>{registerData.email}</div>
                <div><span className="font-semibold">手机号：</span>{registerData.phone}</div>
              </div>
              <Button className="w-full mt-2 rounded-full text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all text-center" onClick={() => window.location.href = '/'}>立即登录</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      <Card className="w-full max-w-md shadow-none border-0 backdrop-blur-sm bg-white/95 shadow-2xl border-0 mx-2">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="mx-auto mb-4 sm:mb-6 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('smart_traffic_management_system')}
          </CardTitle>
          <CardDescription className="text-gray-600 text-base sm:text-lg">
            {isLogin ? t('login_title') : t('register_title')}
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
                  <span className="hidden sm:inline">{t('login_tab_password')}</span>
                  <span className="sm:hidden">{t('login_tab_password')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-1 sm:px-3"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{t('login_tab_code')}</span>
                  <span className="sm:hidden">{t('login_tab_code')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="face"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm px-1 sm:px-3"
                >
                  <Scan className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{t('login_tab_face')}</span>
                  <span className="sm:hidden">{t('login_tab_face')}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account" className="text-sm font-medium text-gray-700">
                    {t('login_account')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="account"
                      placeholder={t('login_input_account_password')}
                      className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                      value={loginData.account}
                      onChange={(e) => setLoginData({ ...loginData, account: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {t('login_password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('login_password')}
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
                        {t('login_loading')}
                      </div>
                    ) : (
                      t('login_button')
                    )}
                  </Button>
                  <Button
                    variant="link"
                    className="absolute -bottom-9 right-0 text-xs text-blue-600 hover:text-blue-700"
                    onClick={() => setForgotPasswordOpen(true)}
                  >
                    {t('login_forgot_password')}
                  </Button>
                  <ForgotPasswordModal
                    open={forgotPasswordOpen}
                    onClose={() => setForgotPasswordOpen(false)}
                  />
                  {loginError && (
                    <div className="w-full flex justify-center mt-2">
                      <div
                        className="flex items-center bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 shadow-lg transition-all duration-300 ease-out animate-fade-in w-full"
                        style={{
                          minWidth: 0,
                          maxWidth: "100%",
                          opacity: 1,
                          transform: "translateY(0)",
                          animation: "fadeInUp 0.3s"
                        }}
                      >
                        <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                        <span className="text-sm">{loginError}</span>
                      </div>
                      <style>
                        {`
                          @keyframes fadeInUp {
                            0% {
                              opacity: 0;
                              transform: translateY(10px);
                            }
                            100% {
                              opacity: 1;
                              transform: translateY(0);
                            }
                          }
                          .animate-fade-in {
                            animation: fadeInUp 0.3s;
                          }
                        `}
                      </style>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="code" className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-code" className="text-sm font-medium text-gray-700">
                    {t('login_account_code')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="account-code"
                      placeholder={t('login_input_account_code')}
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
                        placeholder={t('login_input_code')}
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
                        {countdown > 0 ? `${countdown}s` : t('login_send_code')}
                      </Button>
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
                      t('login_verify_login')
                    )}
                  </Button>
                  <div className="absolute -bottom-5 right-0 text-xs text-gray-400"></div>
                </div>
              </TabsContent>

              <TabsContent value="face" className="space-y-4 sm:space-y-6">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="mx-auto w-64 h-48 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
                    {stream ? (
                      <div className="relative w-full h-full">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover rounded-lg"
                          autoPlay
                          muted
                          playsInline
                          onLoadedMetadata={() => console.log("视频元数据加载完成")}
                          onCanPlay={() => console.log("视频可以开始播放")}
                          onError={(e) => console.error("视频播放错误:", e)}
                        />
                        {faceRecognitionActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="text-center text-white">
                              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                              <p className="text-sm font-medium">{t('login_face_recognition_loading')}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-white bg-black/50 px-1 rounded">{t('login_live_indicator')}</span>
                        </div>
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
                            <Camera className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
                            <p className="text-xs sm:text-sm text-gray-600">{t('login_click_start_face_recognition')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Button
                      className="w-full h-10 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg text-sm sm:text-base"
                      onClick={startFaceRecognition}
                      disabled={faceRecognitionActive || isLoading}
                    >
                      {faceRecognitionActive ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          人脸识别中...
                        </div>
                      ) : stream ? (
                        <>
                          <Scan className="w-4 h-4 mr-2" />
                          {t('login_start_recognition')}
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          {t('login_start_camera')}
                        </>
                      )}
                    </Button>
                    <div className="absolute -bottom-5 right-0 text-xs text-gray-400"></div>
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
                      {t('login_close_camera')}
                    </Button>
                  )}
                  {/* 新增：人脸识别错误提示 */}
                  {loginError && (
                    <div className="w-full flex justify-center mt-2">
                      <div
                        className="flex items-center bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 shadow-lg transition-all duration-300 ease-out animate-fade-in w-full"
                        style={{
                          minWidth: 0,
                          maxWidth: "100%",
                          opacity: 1,
                          transform: "translateY(0)",
                          animation: "fadeInUp 0.3s"
                        }}
                      >
                        <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                        <span className="text-sm">{loginError}</span>
                      </div>
                      <style>{`
                        @keyframes fadeInUp {
                          0% {
                            opacity: 0;
                            transform: translateY(10px);
                          }
                          100% {
                            opacity: 1;
                            transform: translateY(0);
                          }
                        }
                        .animate-fade-in {
                          animation: fadeInUp 0.3s;
                        }
                      `}</style>
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
                        {t('register_username')}
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="username"
                          placeholder={t('register_input_username')}
                          className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                          value={registerData.username}
                          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          {t('register_email')}
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder={t('register_input_email')}
                            className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          {t('register_phone')}
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="phone"
                            placeholder={t('register_input_phone')}
                            className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-blue-500 text-sm sm:text-base"
                            value={registerData.phone}
                            onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-sm font-medium text-gray-700">
                        {t('register_password')}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t('register_input_password')}
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
                        {t('register_confirm_password')}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t('register_input_confirm_password')}
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
                        t('register_next_step')
                      )}
                    </Button>
                    <div className="absolute -bottom-5 right-0 text-xs text-gray-400"></div>
                  </div>
                </>
              )}

              {registerStep === "face" && (
                <>
                  <div className="text-center space-y-3 sm:space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">{t('register_face_title')}</h3>
                    <p className="text-sm text-gray-600">{t('register_face_description')}</p>
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
                            onLoadedMetadata={() => console.log("注册视频元数据加载完成")}
                            onCanPlay={() => console.log("注册视频可以开始播放")}
                            onError={(e) => console.error("注册视频播放错误:", e)}
                          />
                          {faceRecognitionActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="text-center text-white">
                                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                                <p className="text-sm font-medium">{faceRegistrationText || t('register_face_loading')}</p>
                                {faceRegistrationProgress > 0 && (
                                  <div className="mt-2 w-full bg-white/20 rounded-full h-2">
                                    <div 
                                      className="bg-white h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${faceRegistrationProgress}%` }}
                                    ></div>
                                  </div>
                                )}
                                {isBlinkVerification && (
                                  <div className="mt-2 text-yellow-300 text-xs">
                                    👁️ 请眨眼进行验证
                                  </div>
                                )}
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
                              <p className="text-sm text-gray-600">{t('register_click_start_face_registration')}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 新增：进度信息显示 */}
                    {faceRecognitionActive && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>采集进度</span>
                          <span>{collectedImages}/{targetImages}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${faceRegistrationProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">{faceRegistrationText}</p>
                      </div>
                    )}
                    
                    <div className="relative">
                      <Button
                        className="w-full h-10 sm:h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg text-sm sm:text-base"
                        onClick={startFaceRegistration}
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
                            {t('register_start_face_registration')}
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            {t('register_start_camera')}
                          </>
                        )}
                      </Button>
                      <div className="absolute -bottom-5 right-0 text-xs text-gray-400">{t('register_face_registration_note')}</div>
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
                        {t('register_close_camera')}
                      </Button>
                    )}
                    {/* 新增：注册界面人脸录入错误提示 */}
                    {loginError && (
                      <div className="w-full flex justify-center mt-2">
                        <div
                          className="flex items-center bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 shadow-lg transition-all duration-300 ease-out animate-fade-in w-full"
                          style={{
                            minWidth: 0,
                            maxWidth: "100%",
                            opacity: 1,
                            transform: "translateY(0)",
                            animation: "fadeInUp 0.3s"
                          }}
                        >
                          <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                          <span className="text-sm">{loginError}</span>
                        </div>
                        <style>{`
                          @keyframes fadeInUp {
                            0% {
                              opacity: 0;
                              transform: translateY(10px);
                            }
                            100% {
                              opacity: 1;
                              transform: translateY(0);
                            }
                          }
                          .animate-fade-in {
                            animation: fadeInUp 0.3s;
                          }
                        `}</style>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full text-gray-500 hover:text-gray-700"
                      onClick={() => { stopCamera(); setRegisterStep("success") }}
                    >
                      {t('register_skip_step')}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-10 sm:h-12 border-gray-200 hover:bg-gray-50 bg-transparent text-sm sm:text-base"
                    onClick={() => { stopCamera(); setRegisterStep("info") }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('register_back_step')}
                  </Button>
                </>
              )}

              {registerStep === "success" && (
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('register_success_title')}</h3>
                    <p className="text-gray-600">{t('register_success_description')}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-left">
                    <h4 className="font-medium text-green-800 mb-2">{t('register_account_info_title')}</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p>{t('register_username')}: {registerData.username}</p>
                      <p>{t('register_email')}: {registerData.email}</p>
                      <p>{t('register_phone')}: {registerData.phone}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg text-sm sm:text-base"
                    onClick={resetToLogin}
                  >
                    {t('register_login_now')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 切换登录/注册 */}
          {registerStep === "info" && (
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? t('register_no_account') : t('register_have_account')}
                <Button
                  variant="link"
                  className="p-0 ml-1 text-blue-600 hover:text-blue-700 text-sm"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? t('register_create_account') : t('register_login_now')}
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
