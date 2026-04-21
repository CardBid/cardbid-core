
"""
Django settings for 'core' project.

Provided by Whisper.
"""

from datetime   import timedelta
from pathlib    import Path
import os


ALLOWED_HOSTS = []

AUTH_USER_MODEL = 'auctions.CardbidUser'

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator' },
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator' },
]

# Github project directory with trailing slash included, use it like: BASE_DIR / 'subdir'
BASE_DIR = Path(__file__).resolve().parent.parent

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
    'auctions',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.messages',      # required for admin UI
    'django.contrib.sessions',      # required for admin login
    'django.contrib.staticfiles',
    'users',
    'rest_framework',               # API
    'rest_framework_simplejwt',     # JWT authentication
]

LANGUAGE_CODE = 'pl'

MEDIA_URL = '/media/'

MEDIA_ROOT = BASE_DIR / 'media'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    
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
