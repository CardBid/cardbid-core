
"""
Mapping of HTTP endpoints to 'views' i.e. request handlers, defined in auctions.views module.

Provided by Whisper.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from auctions.views import (
    RegisterView,
    MyTokenObtainPairView,
    TokenRefreshView,
    LogoutView,
    create_payment,
    stripe_webhook,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),

    path("api/", include("auctions.urls")),
    
    path("api/top-up/", create_payment),
    path("api/stripe-webhook/", stripe_webhook),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
