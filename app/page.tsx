"use client"

import { useState } from "react"
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
} from "lucide-react"

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

  // 调用登录接口 POST /api/login
  const handleLogin = async () => {
    setIsLoading(true)
    try {
      // 模拟API调用
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginData.account,
          password: loginData.password,
          loginType: loginMode,
        }),
      })

      if (response.ok) {
        setTimeout(() => {
          setIsLoading(false)
          window.location.href = "/dashboard"
        }, 2000)
      }
    } catch (error) {
      console.error("Login failed:", error)
      setIsLoading(false)
    }
  }

  // 调用注册接口 POST /api/register
  const handleRegister = async () => {
    if (registerStep === "info") {
      setIsLoading(true)
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerData),
        })

        if (response.ok) {
          setTimeout(() => {
            setIsLoading(false)
            setRegisterStep("face")
          }, 1000)
        }
      } catch (error) {
        console.error("Registration failed:", error)
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

  // 调用人脸识别接口 POST /api/face/verify 或 POST /api/face/register
  const startFaceRecognition = async () => {
    setFaceRecognitionActive(true)
    try {
      const endpoint = isLogin ? "/api/face/verify" : "/api/face/register"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: loginData.account || registerData.username,
          action: isLogin ? "verify" : "register",
        }),
      })

      setTimeout(() => {
        if (isLogin) {
          handleLogin()
        } else {
          handleRegister()
        }
      }, 3000)
    } catch (error) {
      console.error("Face recognition failed:", error)
      setFaceRecognitionActive(false)
    }
  }

  // 调用发送验证码接口 POST /api/auth/send-code
  const sendVerificationCode = async () => {
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: loginData.account,
          type: loginData.account.includes("@") ? "email" : "phone",
        }),
      })

      if (response.ok) {
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
      }
    } catch (error) {
      console.error("Send code failed:", error)
    }
  }

  const resetToLogin = () => {
    setIsLogin(true)
    setRegisterStep("info")
    setFaceRecognitionActive(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* 背景装饰 - 移动端优化 */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><g fill="#ffffff" fillOpacity="0.05"><circle cx="30" cy="30" r="2"/></g></g></svg>')}")`,
          }}
        ></div>
      </div>

      {/* 装饰元素 - 移动端隐藏 */}
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
                  <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/login</div>
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
                      <div className="absolute -bottom-5 right-0 text-xs text-gray-400">/api/auth/send-code</div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Button
                    className="w-full h-10 sm:h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg text-sm sm:text-base"
                    onClick={handleLogin}
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
                  <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/login</div>
                </div>
              </TabsContent>

              <TabsContent value="face" className="space-y-4 sm:space-y-6">
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="mx-auto w-32 sm:w-40 h-32 sm:h-40 border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
                    {faceRecognitionActive ? (
                      <div className="text-center">
                        <div className="relative">
                          <div className="animate-pulse">
                            <Camera className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 sm:mb-3 text-blue-600" />
                          </div>
                          <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping"></div>
                        </div>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">正在识别中...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
                        <p className="text-xs sm:text-sm text-gray-600">点击开始人脸识别</p>
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
                      ) : (
                        <>
                          <Scan className="w-4 h-4 mr-2" />
                          开始人脸识别
                        </>
                      )}
                    </Button>
                    <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/face/verify</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            // 注册界面 - 移动端优化
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
                    <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/register</div>
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
                    <div className="mx-auto w-40 sm:w-48 h-40 sm:h-48 border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
                      {faceRecognitionActive ? (
                        <div className="text-center">
                          <div className="relative">
                            <div className="animate-pulse">
                              <Camera className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-3 sm:mb-4 text-green-600" />
                            </div>
                            <div className="absolute inset-0 border-2 border-green-500 rounded-full animate-ping"></div>
                          </div>
                          <p className="text-sm text-green-600 font-medium">正在录入人脸...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
                          <p className="text-sm text-gray-600">点击开始录入人脸</p>
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
                        ) : (
                          <>
                            <Scan className="w-4 h-4 mr-2" />
                            开始录入人脸
                          </>
                        )}
                      </Button>
                      <div className="absolute -bottom-5 right-0 text-xs text-gray-400">调用 /api/face/register</div>
                    </div>
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

          {/* 切换登录/注册 - 移动端优化 */}
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
    </div>
  )
}
