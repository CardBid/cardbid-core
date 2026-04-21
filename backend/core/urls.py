
"""
Mapping of HTTP endpoints to 'views' i.e. request handlers, defined in auctions.views module.

Provided by Whisper.
"""

from auctions.views import TokenObtainPairView, TokenRefreshView
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/',              admin.site.urls),
    path("api/token/",          TokenObtainPairView.as_view()),
    path("api/token/refresh/",  TokenRefreshView.as_view()),

    path("api/", include("auctions.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)