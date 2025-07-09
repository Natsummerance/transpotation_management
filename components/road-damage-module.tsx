"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";

interface DamageResults {
  '纵向裂缝': number;
  '横向裂缝': number;
  '龟裂': number;
  '坑洼': number;
}

interface DetectionResponse {
  results: DamageResults;
  originalImage?: string;
  resultImage?: string;
}

export default function RoadDamageModule() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<DamageResults | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResults(null); // Reset previous results
      setResultImage(null); // Reset result image
    }
  };

  const handleDetect = async () => {
    if (!file) {
      toast.error("请先选择一张图片");
      return;
    }

    setIsLoading(true);
    setResults(null);
    setResultImage(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/detect/road-damage', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '检测失败');
      }

      const data: DetectionResponse = await response.json();
      setResults(data.results);
      if (data.resultImage) {
        setResultImage(data.resultImage);
      }
      toast.success("检测成功！");

    } catch (error: any) {
      console.error("Detection error:", error);
      toast.error(error.message || "检测过程中发生错误");
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = results ? Object.entries(results).map(([name, value]) => ({ name, '数量': value })) : [];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>路面病害检测</CardTitle>
        <CardDescription>上传路面图片，系统将自动检测并分类裂缝、坑洼等病害。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="picture">上传图片</Label>
          <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} className="mt-1" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>原始图片</Label>
            {preview ? (
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                <img src={preview} alt="Original Image" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <p className="text-sm text-muted-foreground">请选择图片</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>检测结果图片</Label>
            {resultImage ? (
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                <img src={resultImage} alt="Detection Result" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <p className="text-sm text-muted-foreground">检测结果图片将在此处显示</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-muted/40 rounded-md p-4 min-h-[300px] flex items-center justify-center">
          {results ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="数量" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">检测统计结果将在此处显示</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleDetect} disabled={isLoading || !file}>
          {isLoading ? '检测中...' : '开始检测'}
        </Button>
      </CardFooter>
    </Card>
  );
}
