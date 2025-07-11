"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Camera,
  Lock,
  Bell,
  Shield,
  Globe,
  Download,
  Save,
  Eye,
  EyeOff,
  LogOut,
  Edit,
  Check,
  X,
  Loader2,
} from "lucide-react"
import FaceRecognitionModule from "./face-recognition-module"

export default function SettingsModule() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 用户信息状态
  const [userInfo, setUserInfo] = useState({
    uname: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    bio: "",
  })

  // 页面加载时获取用户信息
  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setUserInfo({
            uname: data.data.uname || "",
            email: data.data.email || "",
            phone: data.data.phone || "",
            department: "",
            position: "",
            bio: "",
          });
        }
      } catch (e) {
        // 获取失败不处理
      }
    }
    fetchProfile();
  }, []);

  // 密码修改状态
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // 系统设置状态
  const [systemSettings, setSystemSettings] = useState({
    theme: "light",
    language: "zh-CN",
    timezone: "Asia/Shanghai",
    dateFormat: "YYYY-MM-DD",
    autoSave: true,
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    soundEnabled: true,
    autoLogout: 30,
  })

  // 安全设置状态
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    faceRecognition: true,
    loginNotifications: true,
    sessionTimeout: 60,
    ipWhitelist: "",
  })

  // 处理头像上传
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("文件大小不能超过5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 保存用户信息
  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          ...userInfo,
          avatar: profileImage,
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        // 更新localStorage里的user
        const data = await response.json();
        localStorage.setItem("user", JSON.stringify(data.data));
        alert("个人信息更新成功")
        window.location.reload(); // 让dashboard右上角立即刷新
      } else {
        throw new Error("更新失败")
      }
    } catch (error) {
      console.error("Profile update failed:", error)
      alert("更新失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 修改密码
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("新密码和确认密码不匹配")
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert("密码长度至少6位")
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token');
      const pwdHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) pwdHeaders["Authorization"] = `Bearer ${token}`;
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: pwdHeaders,
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const result = await response.json();
      if (result.success) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        alert("密码修改成功")
      } else {
        alert(result.message || "密码修改失败")
      }
    } catch (error) {
      console.error("Password change failed:", error)
      alert("密码修改失败，请检查当前密码是否正确")
    } finally {
      setIsLoading(false)
    }
  }

  // 保存系统设置
  const handleSaveSystemSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(systemSettings),
      })

      if (response.ok) {
        alert("系统设置保存成功")
      } else {
        throw new Error("保存失败")
      }
    } catch (error) {
      console.error("Settings save failed:", error)
      alert("保存失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 退出登录
  const handleLogout = async () => {
    if (confirm("确定要退出登录吗？")) {
      try {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        })
      } catch (error) {
        console.error("Logout failed:", error)
      } finally {
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")
        window.location.href = "/"
      }
    }
  }

  // 导出数据
  const handleExportData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/export", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `user_data_${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("导出失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">系统设置</h2>
          <p className="text-gray-600 mt-1">管理您的账户设置和系统偏好</p>
        </div>
        <div className="flex space-x-3">
          {/*<Button variant="outline" onClick={handleExportData} disabled={isLoading} className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>*/}
          <Button onClick={handleLogout} variant="destructive">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="profile" className="data-[state=active]:bg-white">
            <User className="w-4 h-4 mr-2" />
            个人信息
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white">
            <Shield className="w-4 h-4 mr-2" />
            安全设置
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-white">
            <Globe className="w-4 h-4 mr-2" />
            系统设置
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white">
            <Bell className="w-4 h-4 mr-2" />
            通知设置
          </TabsTrigger>
        </TabsList>

        {/* 个人信息设置 */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">个人信息</CardTitle>
              <CardDescription>管理您的个人资料和头像</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像设置 */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage || "/placeholder.svg"} alt="头像" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    aria-label="上传头像"
                    title="选择头像图片"
                    placeholder="选择头像图片"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{userInfo.uname}</h3>
                  <p className="text-gray-600">{userInfo.position}</p>
                  <p className="text-sm text-gray-500">{userInfo.department}</p>
                </div>
                <div className="ml-auto">
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSaveProfile} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="bg-transparent"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="bg-transparent">
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                  )}
                </div>
              </div>

              {/* 基本信息表单 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    value={userInfo.uname}
                    onChange={(e) => setUserInfo({ ...userInfo, uname: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号码</Label>
                  <Input
                    id="phone"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                {/*<div className="space-y-2">
                  <Label htmlFor="department">部门</Label>
                  <Input
                    id="department"
                    value={userInfo.department}
                    onChange={(e) => setUserInfo({ ...userInfo, department: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">职位</Label>
                  <Input
                    id="position"
                    value={userInfo.position}
                    onChange={(e) => setUserInfo({ ...userInfo, position: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>*/}
              </div>

              {/*<div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  value={userInfo.bio}
                  onChange={(e) => setUserInfo({ ...userInfo, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>*/}
            </CardContent>
          </Card>

          {/* 密码修改 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">修改密码</CardTitle>
              <CardDescription>定期更新密码以保护账户安全</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="请输入当前密码"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="请输入新密码"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="请再次输入新密码"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={isLoading} className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg text-sm">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                修改密码
              </Button>
            </CardContent>
          </Card>
          

          {/* 人脸录入模块 */}
          <FaceRecognitionModule />
          </div>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">安全设置</CardTitle>
              <CardDescription>管理您的账户安全选项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">双因素认证</h4>
                  <p className="text-sm text-gray-600">为您的账户添加额外的安全层</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">人脸识别登录</h4>
                  <p className="text-sm text-gray-600">使用人脸识别快速登录</p>
                </div>
                <Switch
                  checked={securitySettings.faceRecognition}
                  onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, faceRecognition: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">登录通知</h4>
                  <p className="text-sm text-gray-600">新设备登录时发送通知</p>
                </div>
                <Switch
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, loginNotifications: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout">会话超时时间（分钟）</Label>
                <Select
                  value={securitySettings.sessionTimeout.toString()}
                  onValueChange={(value) =>
                    setSecuritySettings({ ...securitySettings, sessionTimeout: Number.parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15分钟</SelectItem>
                    <SelectItem value="30">30分钟</SelectItem>
                    <SelectItem value="60">1小时</SelectItem>
                    <SelectItem value="120">2小时</SelectItem>
                    <SelectItem value="480">8小时</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ip-whitelist">IP白名单</Label>
                <Textarea
                  id="ip-whitelist"
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })}
                  placeholder="输入允许访问的IP地址，每行一个"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统设置 */}
        <TabsContent value="system" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">系统设置</CardTitle>
              <CardDescription>自定义系统外观和行为</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">主题</Label>
                  <Select
                    value={systemSettings.theme}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">浅色主题</SelectItem>
                      <SelectItem value="dark">深色主题</SelectItem>
                      <SelectItem value="auto">跟随系统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">语言</Label>
                  <Select
                    value={systemSettings.language}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="zh-TW">繁体中文</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">时区</Label>
                  <Select
                    value={systemSettings.timezone}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">北京时间 (UTC+8)</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">香港时间 (UTC+8)</SelectItem>
                      <SelectItem value="Asia/Taipei">台北时间 (UTC+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">日期格式</Label>
                  <Select
                    value={systemSettings.dateFormat}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">2024-01-15</SelectItem>
                      <SelectItem value="MM/DD/YYYY">01/15/2024</SelectItem>
                      <SelectItem value="DD/MM/YYYY">15/01/2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">自动保存</h4>
                  <p className="text-sm text-gray-600">自动保存您的工作进度</p>
                </div>
                <Switch
                  checked={systemSettings.autoSave}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoSave: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">声音提示</h4>
                  <p className="text-sm text-gray-600">启用系统声音提示</p>
                </div>
                <Switch
                  checked={systemSettings.soundEnabled}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, soundEnabled: checked })}
                />
              </div>
              <Button onClick={handleSaveSystemSettings} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">通知设置</CardTitle>
              <CardDescription>管理您接收通知的方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">系统通知</h4>
                  <p className="text-sm text-gray-600">接收系统重要通知</p>
                </div>
                <Switch
                  checked={systemSettings.notifications}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, notifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">邮件通知</h4>
                  <p className="text-sm text-gray-600">通过邮件接收通知</p>
                </div>
                <Switch
                  checked={systemSettings.emailNotifications}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">短信通知</h4>
                  <p className="text-sm text-gray-600">通过短信接收重要通知</p>
                </div>
                <Switch
                  checked={systemSettings.smsNotifications}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, smsNotifications: checked })}
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">通知类型</h4>
                <div className="space-y-3">
                  {[
                    { key: "traffic", label: "交通事件", enabled: true },
                    { key: "violation", label: "违章检测", enabled: true },
                    { key: "hazard", label: "道路危险", enabled: true },
                    { key: "system", label: "系统维护", enabled: false },
                    { key: "security", label: "安全警告", enabled: true },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm">{item.label}</span>
                        {item.enabled && (
                          <Badge variant="default" className="text-xs">
                            已启用
                          </Badge>
                        )}
                      </div>
                      <Switch checked={item.enabled} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
