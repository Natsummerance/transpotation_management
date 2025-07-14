'use client';
// @ts-expect-error: 忽略 swagger-ui-react 的类型声明缺失
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerPage() {
  return (
    <div style={{ height: '100vh' }}>
      <SwaggerUI url="/api/swagger" />
    </div>
  );
} 