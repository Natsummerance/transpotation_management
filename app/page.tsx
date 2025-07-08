"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Shield, User, Lock, Mail, Phone, Scan, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react"

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

  const handleLogin = async () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      window.location.href = "/dashboard"
    }, 2000)
  }

  const handleRegister = async () => {
    if (registerStep === "info") {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setRegisterStep("face")
      }, 1000)
    } else if (registerStep === "face") {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setRegisterStep("success")
      }, 3000)
    }
  }

  const startFaceRecognition = () => {
    setFaceRecognitionActive(true)
    setTimeout(() => {
      if (isLogin) {
        handleLogin()
      } else {
        handleRegister()
      }
    }, 3000)
  }

  const sendVerificationCode = () => {
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

  const resetToLogin = () => {
    setIsLogin(true)
    setRegisterStep("info")
    setFaceRecognitionActive(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><g fill="#ffffff" fillOpacity="0.05"><circle cx="30" cy="30" r="2"/></g></g></svg>')}")`,
          }}
        ></div>
      </div>

      <div className="absolute top-10 left-10 text-white/20">
        <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center">
          <Shield className="w-16 h-16" />
        </div>
      </div>

      <div className="absolute bottom-10 right-10 text-white/20">
        <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
          <Camera className="w-12 h-12" />
        </div>
      </div>

      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 shadow-2xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            智慧交管系统
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg">{isLogin ? "登录您的账户" : "创建新账户"}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            // 登录界面
            <Tabs value={loginMode} onValueChange={(value) => setLoginMode(value as LoginMode)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100">
                <TabsTrigger
                  value="password"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  密码登录
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  验证码
                </TabsTrigger>
                <TabsTrigger
                  value="face"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs"
                >
                  <Scan className="w-3 h-3 mr-1" />
                  人脸识别
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account" className="text-sm font-medium text-gray-700">
                    账户
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="account"
                      placeholder="用户名/邮箱/手机号"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500"
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
                      className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      登录中...
                    </div>
                  ) : (
                    "登录系统"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="code" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-code" className="text-sm font-medium text-gray-700">
                    手机号/邮箱
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="account-code"
                      placeholder="请输入手机号或邮箱"
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500"
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
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500"
                        value={loginData.code}
                        onChange={(e) => setLoginData({ ...loginData, code: e.target.value })}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="h-12 px-4 border-gray-200 hover:bg-gray-50 bg-transparent"
                      onClick={sendVerificationCode}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `${countdown}s` : "发送验证码"}
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      验证中...
                    </div>
                  ) : (
                    "验证登录"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="face" className="space-y-6">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-40 h-40 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
                    {faceRecognitionActive ? (
                      <div className="text-center">
                        <div className="relative">
                          <div className="animate-pulse">
                            <Camera className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                          </div>
                          <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping"></div>
                        </div>
                        <p className="text-sm text-blue-600 font-medium">正在识别中...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-600">点击开始人脸识别</p>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg"
                    onClick={startFaceRecognition}
                    disabled={faceRecognitionActive || isLoading}
                  >
                    {faceRecognitionActive ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        人脸识别中...
                      </div>
                    ) : (
                      <>
                        <Scan className="w-4 h-4 mr-2" />
                        开始人脸识别
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            // 注册界面
            <div className="space-y-6">
              {registerStep === "info" && (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                        用户名
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="username"
                          placeholder="请输入用户名"
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500"
                          value={registerData.username}
                          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        />
                      </div>
                    </div>
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
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500"
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
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        />
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
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg"
                    onClick={handleRegister}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        注册中...
                      </div>
                    ) : (
                      "下一步：录入人脸"
                    )}
                  </Button>
                </>
              )}

              {registerStep === "face" && (
                <>
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">录入人脸信息</h3>
                    <p className="text-sm text-gray-600">请正对摄像头，保持面部清晰可见</p>
                  </div>
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-48 h-48 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
                      {faceRecognitionActive ? (
                        <div className="text-center">
                          <div className="relative">
                            <div className="animate-pulse">
                              <Camera className="w-16 h-16 mx-auto mb-4 text-green-600" />
                            </div>
                            <div className="absolute inset-0 border-2 border-green-500 rounded-full animate-ping"></div>
                          </div>
                          <p className="text-sm text-green-600 font-medium">正在录入人脸...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-sm text-gray-600">点击开始录入人脸</p>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg"
                      onClick={startFaceRecognition}
                      disabled={faceRecognitionActive || isLoading}
                    >
                      {faceRecognitionActive ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          录入中...
                        </div>
                      ) : (
                        <>
                          <Scan className="w-4 h-4 mr-2" />
                          开始录入人脸
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
                    onClick={() => setRegisterStep("info")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回上一步
                  </Button>
                </>
              )}

              {registerStep === "success" && (
                <div className="text-center space-y-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">注册成功！</h3>
                    <p className="text-gray-600">您的账户已创建完成，人脸信息已录入</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-green-800 mb-2">账户信息</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p>用户名: {registerData.username}</p>
                      <p>邮箱: {registerData.email}</p>
                      <p>手机号: {registerData.phone}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
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
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "还没有账户？" : "已有账户？"}
                <Button
                  variant="link"
                  className="p-0 ml-1 text-blue-600 hover:text-blue-700"
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
