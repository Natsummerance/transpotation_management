from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
import os


schema_view = get_schema_view(
   openapi.Info(
      title="交通管理系统 API 文档",
      default_version='v1',
      description="自动生成的 Swagger 接口文档",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

# 自定义静态文件视图，添加CORS头


def cors_static_file(request, path):
    file_path = settings.BASE_DIR / 'public' / 'cache' / path
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            content = f.read()
        response = HttpResponse(content, content_type='application/json')
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = '*'
        return response
    return HttpResponse(b'File not found', status=404)


urlpatterns = [
    path('admin/', admin.site.urls),
    # 你的其他接口路由
    path('api/', include('heatmap_api.urls')),
    # 添加缓存API路由
    path('api/cache/taxi/', include('cache_api.urls')),
    # 自定义缓存文件服务，带CORS头
    path('api/cache/taxi/<path:path>', cors_static_file, name='cors_cache'),

    # drf-yasg 文档路由
    re_path(r'^swagger(?P<format>\\\\.json|\\\\.yaml)$', 
            schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), 
         name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), 
         name='schema-redoc'),
]

# 添加静态文件服务
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, 
                          document_root=settings.STATIC_ROOT)
    urlpatterns += static('/api/cache/', 
                          document_root=settings.BASE_DIR / 'public' / 'cache') 