
"""
Mapping of HTTP endpoints to 'views' i.e. request handlers, defined in auctions.views module.

Provided by Whisper.
"""

from auctions.views import TokenObtainPairView, TokenRefreshView
from django.contrib import admin
from django.urls    import path


urlpatterns = [
    path('admin/',              admin.site.urls),
    path("api/token/",          TokenObtainPairView.as_view()),
    path("api/token/refresh/",  TokenRefreshView.as_view()),
]
