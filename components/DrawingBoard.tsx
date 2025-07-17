import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 400;
const ASPECT_RATIO = CANVAS_HEIGHT / CANVAS_WIDTH;

export default function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

  // 监听容器宽度变化，自适应canvas
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.offsetWidth, CANVAS_WIDTH);
        setCanvasSize({ width, height: Math.round(width * ASPECT_RATIO) });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // 坐标缩放
  const getScaledPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // 开始绘制
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    setHasDrawn(true);
    setLastPos(getScaledPos(e));
  };

  // 绘制中
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !lastPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getScaledPos(e);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    setLastPos({ x, y });
  };

  // 结束绘制
  const handleMouseUp = () => {
    setDrawing(false);
    setLastPos(null);
  };

  // 清空画板
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // 导出图片
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "drawing-board.png";
    link.click();
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 w-full">
      <div style={{ width: "100%", maxWidth: CANVAS_WIDTH }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            display: "block",
            borderRadius: 12,
            background: "#fff",
            boxShadow: "0 2px 8px #0001",
            border: "1px solid #e5e7eb",
            cursor: "crosshair",
            touchAction: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
      <div className="flex space-x-2 w-full">
        <Button variant="outline" onClick={handleClear} disabled={!hasDrawn}
        className="flex-1 bg-white bg-opacity-50 hover:bg-opacity-70 text-gray-800 hover:text-blue-600 h-10 sm:h-12 text-sm sm:text-base transition-colors"
        >
          清空画板
        </Button>
        <Button onClick={handleExport} disabled={!hasDrawn}
        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white h-10 sm:h-12 text-sm sm:text-base hover:from-blue-700 hover:to-purple-700"
        >
          导出图片
        </Button>
      </div>
    </div>
  );
} 