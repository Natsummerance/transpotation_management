import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { CheckCircle } from "lucide-react";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState("email"); // "email" | "verify" | "reset" | "success"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSendCode = async () => {
    if (!email) {
      alert("请输入邮箱地址");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/sendCode", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (result.code === "0") {
        alert("验证码已发送到您的邮箱");
        setStep("verify");
        setCountdown(60);
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert(result.msg || "发送失败");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/loginByCode", {
        method: "POST",
        body: JSON.stringify({ email, code }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (result.code === "1") {
        setStep("reset");
      } else {
        alert(result.msg || "验证码错误");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/reset/password", {
        method: "POST",
        body: JSON.stringify({ email, newPassword }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (result.code === "0") {
        setStep("success");
      } else {
        alert(result.msg || "重置失败");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 清理定时器
  const handleClose = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>找回密码</DialogTitle>
        </DialogHeader>

        {step === "email" && (
          <div className="space-y-4">
            <Label htmlFor="email">注册邮箱</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg text-sm sm:text-base" onClick={handleSendCode} disabled={isLoading || countdown > 0}>
              {countdown > 0 ? `${countdown}s后可重发` : isLoading ? "发送中..." : "发送验证码"}
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <Label htmlFor="code">验证码</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg text-sm sm:text-base" onClick={handleVerifyCode} disabled={isLoading}>
              {isLoading ? "验证中..." : "下一步"}
            </Button>
          </div>
        )}

        {step === "reset" && (
          <div className="space-y-4">
            <Label htmlFor="new-password">新密码</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Label htmlFor="confirm-password">确认密码</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg text-sm sm:text-base" onClick={handleResetPassword} disabled={isLoading}>
              {isLoading ? "重置中..." : "确认重置"}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-lg font-semibold">密码已重置</p>
            <Button className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg text-sm sm:text-base" onClick={handleClose}>
              返回登录
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
