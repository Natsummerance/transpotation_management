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
import { useUser } from '@/components/user-context';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

// 移除Tabs相关代码，导出SettingsModule时接收一个props: page，page为'profile'或'system'，根据page显示对应内容
export default function SettingsModule({ page = 'profile' }: { page?: 'profile' | 'system' }) {
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

  const { setUser } = useUser();
  const { t } = useTranslation();

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
          
          // 设置头像
          if (data.data.avatar) {
            setProfileImage(data.data.avatar);
          }
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

  // 页面加载时读取系统设置
  useEffect(() => {
    async function fetchSystemSettings() {
      try {
        const res = await fetch("/api/system/settings");
        const data = await res.json();
        if (data.success && data.data) {
          setSystemSettings((prev) => ({ ...prev, ...data.data }));
        }
      } catch (e) {
        // 读取失败不处理
      }
    }
    fetchSystemSettings();
  }, []);

  // 监听语言切换，自动切换i18n语言
  useEffect(() => {
    if (systemSettings.language) {
      i18n.changeLanguage(systemSettings.language);
    }
  }, [systemSettings.language]);

  // 处理头像上传
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("文件大小不能超过5MB")
        return
      }

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert("只能上传图片文件")
        return
      }

      setIsLoading(true)
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert("请先登录")
          return
        }

        // 创建FormData
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch("/api/user/avatar", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();
        
        if (result.success) {
          // 更新本地状态
          setProfileImage(result.data.avatar);
          
          // 更新localStorage中的用户信息
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          currentUser.avatar = result.data.avatar;
          localStorage.setItem('user', JSON.stringify(currentUser));
          // 更新全局Context
          setUser(currentUser);
          alert("头像上传成功")
        } else {
          alert(result.message || "头像上传失败")
        }
      } catch (error) {
        console.error("Avatar upload failed:", error)
        alert("头像上传失败，请重试")
      } finally {
        setIsLoading(false)
      }
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
      const response = await fetch("/api/system/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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
      {/* 顶部标题和操作栏保留 */}
      <div className="flex items-center justify-between">
        <div>
          {page === 'profile' ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900">{t('personal_information')}</h2>
              <p className="text-gray-600 mt-1">{t('manage_your_personal_information_and_avatar')}</p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-gray-900">{t('system_settings')}</h2>
              <p className="text-gray-600 mt-1">{t('manage_account_settings_and_preferences')}</p>
            </>
          )}
        </div>
        <div className="flex space-x-3">
          {/*<Button variant="outline" onClick={handleExportData} disabled={isLoading} className="bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>*/}
          <Button onClick={handleLogout} variant="destructive">
            <LogOut className="w-4 h-4 mr-2" />
            {t('logout')}
          </Button>
        </div>
      </div>

      {/* 根据page显示内容 */}
      {page === 'profile' && (
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('personal_information')}</CardTitle>
              <CardDescription>{t('manage_your_personal_information_and_avatar')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 头像设置 */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img 
                        src={profileImage.startsWith('data:') ? profileImage : profileImage} 
                        alt="头像" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {!profileImage && <User className="w-12 h-12 text-white" />}
                  </div>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
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
                <div className="flex flex-col justify-center">
                  {isEditing ? (
                    <Input
                      id="username-inline"
                      value={userInfo.uname}
                      onChange={(e) => setUserInfo({ ...userInfo, uname: e.target.value })}
                      className="text-lg font-semibold w-40"
                    />
                  ) : (
                    <h3 className="font-semibold text-lg">{userInfo.uname}</h3>
                  )}
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
                      {t('edit')}
                    </Button>
                  )}
                </div>
              </div>

              {/* 基本信息表单（去除用户名输入框） */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email_address')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone_number')}</Label>
                  <Input
                    id="phone"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                {/* 其他字段保持不变 */}
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
              <CardTitle className="text-xl font-bold">{t('change_password')}</CardTitle>
              <CardDescription>{t('update_password_periodically_to_protect_account_security')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t('current_password')}</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder={t('please_enter_current_password')}
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
                <Label htmlFor="new-password">{t('new_password')}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder={t('please_enter_new_password')}
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
                <Label htmlFor="confirm-password">{t('confirm_new_password')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder={t('please_enter_new_password_again')}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={isLoading} className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg text-sm">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                {t('change_password')}
              </Button>
            </CardContent>
          </Card>
          

          {/* 人脸录入模块 */}
          <FaceRecognitionModule />
          </div>
        </div>
      )}
      {page === 'system' && (
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('system_settings')}</CardTitle>
              <CardDescription>{t('customize_system')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">{t('theme')}</Label>
                  <Select
                    value={systemSettings.theme}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, theme: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('light')}</SelectItem>
                      <SelectItem value="dark">{t('dark')}</SelectItem>
                      <SelectItem value="auto">{t('auto')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">{t('language')}</Label>
                  <Select
                    value={systemSettings.language}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">{t('zh-CN')}</SelectItem>
                      <SelectItem value="zh-TW">{t('zh-TW')}</SelectItem>
                      <SelectItem value="en-US">{t('en-US')}</SelectItem>
                      <SelectItem value="ja-JP">{t('ja-JP')}</SelectItem>
                      <SelectItem value="ko-KR">{t('ko-KR')}</SelectItem>
                      <SelectItem value="fr-FR">{t('fr-FR')}</SelectItem>
                      <SelectItem value="de-DE">{t('de-DE')}</SelectItem>
                      <SelectItem value="it-IT">{t('it-IT')}</SelectItem>
                      <SelectItem value="es-ES">{t('es-ES')}</SelectItem>
                      <SelectItem value="pt-PT">{t('pt-PT')}</SelectItem>
                      <SelectItem value="el-GR">{t('el-GR')}</SelectItem>
                      <SelectItem value="ar-SA">{t('ar-SA')}</SelectItem>
                      <SelectItem value="ru-RU">{t('ru-RU')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('timezone')}</Label>
                  <Select
                    value={systemSettings.timezone}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">{t('beijing_time_utc_8')}</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">{t('hong_kong_time_utc_8')}</SelectItem>
                      <SelectItem value="Asia/Taipei">{t('taipei_time_utc_8')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">{t('date_format')}</Label>
                  <Select
                    value={systemSettings.dateFormat}
                    onValueChange={(value) => setSystemSettings({ ...systemSettings, dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">{t('2024_01_15')}</SelectItem>
                      <SelectItem value="MM/DD/YYYY">{t('01_15_2024')}</SelectItem>
                      <SelectItem value="DD/MM/YYYY">{t('15_01_2024')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* 删除自动保存开关，只保留声音提示 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{t('sound')}</h4>
                  <p className="text-sm text-gray-600">{t('enable_system_sound_notifications')}</p>
                </div>
                <Switch
                  checked={systemSettings.soundEnabled}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, soundEnabled: checked })}
                />
              </div>
              <Button onClick={handleSaveSystemSettings} disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {t('save')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
