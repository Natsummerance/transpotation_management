"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Shield } from "lucide-react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [faceRecognitionActive, setFaceRecognitionActive] = useState(false)

  const handleLogin = async (type: "normal" | "face") => {
    setIsLoading(true)
    // 模拟登录过程
    setTimeout(() => {
      setIsLoading(false)
      window.location.href = "/dashboard"
    }, 2000)
  }

  const startFaceRecognition = () => {
    setFaceRecognitionActive(true)
    // 模拟人脸识别过程
    setTimeout(() => {
      handleLogin("face")
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">城市交通管理系统</CardTitle>
          <CardDescription>交管部门专用系统</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="normal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="normal">账号登录</TabsTrigger>
              <TabsTrigger value="face">人脸识别</TabsTrigger>
            </TabsList>

            <TabsContent value="normal" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input id="username" placeholder="请输入用户名" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" placeholder="请输入密码" />
              </div>
              <Button className="w-full" onClick={() => handleLogin("normal")} disabled={isLoading}>
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </TabsContent>

            <TabsContent value="face" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="mx-auto w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  {faceRecognitionActive ? (
                    <div className="text-center">
                      <div className="animate-pulse">
                        <Camera className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">识别中...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">点击开始识别</p>
                    </div>
                  )}
                </div>
                <Button className="w-full" onClick={startFaceRecognition} disabled={faceRecognitionActive || isLoading}>
                  {faceRecognitionActive ? "人脸识别中..." : "开始人脸识别"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
