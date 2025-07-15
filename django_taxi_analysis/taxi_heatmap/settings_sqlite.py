
import os
from .settings import *

# 使用SQLite数据库
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 禁用时区支持以避免问题
USE_TZ = False
