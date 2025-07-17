import os
import json
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views import View
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

CACHE_ROOT = os.path.join(settings.BASE_DIR, 'public', 'cache', 'taxi')


@method_decorator(csrf_exempt, name='dispatch')
class TaxiCacheView(View):
    def get(self, request, module, span):
        """读取缓存json文件"""
        file_path = os.path.join(CACHE_ROOT, module, f'{span}.json')
        if not os.path.exists(file_path):
            return JsonResponse({'error': 'not found'}, status=404)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return JsonResponse(data, safe=False)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def post(self, request, module, span):
        """写入缓存json文件"""
        file_dir = os.path.join(CACHE_ROOT, module)
        os.makedirs(file_dir, exist_ok=True)
        file_path = os.path.join(file_dir, f'{span}.json')
        try:
            body = request.body.decode('utf-8')
            data = json.loads(body)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def put(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(['GET', 'POST'])

    def delete(self, request, *args, **kwargs):
        return HttpResponseNotAllowed(['GET', 'POST']) 