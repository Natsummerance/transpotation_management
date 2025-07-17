"use client"
import { useState } from 'react';
import FaceRecognitionModule from '@/components/face-recognition-module';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Camera } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  if (success) {
    router.replace('/');
    return null;
  }

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
          <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 select-none text-center">
            智慧交通管理系统
          </div>
          <div className="text-base text-gray-600 text-center mb-2">人脸录入信息</div>
        </div>
        <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 gap-4">
          <div className="w-full flex flex-col items-center justify-center bg-transparent shadow-none border-0">
            <FaceRecognitionModule onSuccess={() => setSuccess(true)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 