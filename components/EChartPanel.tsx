import React from "react";
import ReactECharts from "echarts-for-react";

interface EChartPanelProps {
  option: any;
  loading?: boolean;
  height?: number | string;
}

export default function EChartPanel({ option, loading = false, height = 400 }: EChartPanelProps) {
  return (
    <div style={{ height }}>
      <ReactECharts
        option={option}
        style={{ height: "100%" }}
        showLoading={loading}
        notMerge
        lazyUpdate
        theme="shine"
      />
    </div>
  );
} 