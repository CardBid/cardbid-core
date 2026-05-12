
"""
Mapping of HTTP endpoints to 'views' i.e. request handlers, defined in auctions.views module.

Provided by Whisper.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from auctions.views import TokenObtainPairView, TokenRefreshView, PSAVerifyView, StreamerTestView, AuctionLiveDataView,   AuctionBuyNowView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path("api/token/", TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path("api/token/refresh/", TokenRefreshView.as_view(), name='token_refresh'),

    path("api/", include("auctions.urls")),
    path('v1/auctions/<int:pk>/live-data/', AuctionLiveDataView.as_view(), name='auction-live-data'),
    path('v1/auctions/<int:pk>/buy-now/', AuctionBuyNowView.as_view(), name='auction-buy-now'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)