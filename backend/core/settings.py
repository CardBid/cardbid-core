
"""
Django settings for 'core' project.

Provided by Whisper.
"""

from datetime   import timedelta
from pathlib    import Path
from celery.schedules import crontab
import os
from dotenv import load_dotenv

load_dotenv()


STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'amogus')
STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY', 'sugoma')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', 'nomindah')

ALLOWED_HOSTS = ['*']

AUTH_USER_MODEL = 'auctions.CardbidUser'

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator' },
]

# Github project directory with trailing slash included, use it like: BASE_DIR / 'subdir'
BASE_DIR = Path(__file__).resolve().parent.parent


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'cardbid_db',
        'USER': 'admin',
        'PASSWORD': 'adminpassword',
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': '5432',
    }
}

# Note: in final version, one should disable that setting
DEBUG = True

INSTALLED_APPS = [
    'daphne',
    'auctions',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.messages',      # required for admin UI
    'django.contrib.sessions',      # required for admin login
    'django.contrib.staticfiles',
    'corsheaders',
    'users',
    'rest_framework',               # API
    'rest_framework_simplejwt',     # JWT authentication
]

LANGUAGE_CODE = 'pl'

MEDIA_URL = '/media/'

MEDIA_ROOT = BASE_DIR / 'media'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',

    'django.middleware.security.SecurityMiddleware',

    'whitenoise.middleware.WhiteNoiseMiddleware',
    
    'django.contrib.sessions.middleware.SessionMiddleware',
    
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',

    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

USE_I18N = True

USE_TZ = True

REST_FRAMEWORK = {

    # Use JSON Web Token authentication (stateless)
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    
    # Allow only authenticated users for requests
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    
    # Allow JSON (data) and HTML (visual) response for a request
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# Main URL routing module
ROOT_URLCONF = 'core.urls'

# Must keep it secret, it is used for cryptographic signing
SECRET_KEY = 'django-insecure-=d4bw6aqv$*g&wnzg47#3dr@--#wu3#^5cv(9nmk(=arf0vt8s'

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":    timedelta(minutes=15),
    "AUTH_HEADER_TYPES":        ("Bearer",),
    "REFRESH_TOKEN_LIFETIME":   timedelta(days=7),
}

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS':     [],
        'APP_DIRS': True,
        'OPTIONS':  {
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
            ],
        },
    },
]

TIME_ZONE = 'UTC'

WSGI_APPLICATION = 'core.wsgi.application'
ASGI_APPLICATION = 'core.asgi.application'

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                (
                    os.environ.get("REDIS_HOST", "localhost"),
                    int(os.environ.get("REDIS_PORT", 6379)),
                )
            ],
        },
    },
}

# CELERY CONFIGURATION
TIME_ZONE = 'Europe/Warsaw'
USE_TZ = True
CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_RESULT_BACKEND = 'redis://redis:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = False

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis", 6379)],
        },
    },
}

CELERY_BEAT_SCHEDULE = {
    'close-expired-auctions-every-minute': {
        'task': 'auctions.tasks.close_expired_auctions',
        'schedule': crontab(minute='*'), # Uruchamia się co 1 minutę
    },
}
