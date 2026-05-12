from django.urls import path
from .views import PSAVerifyView, StreamerTestView, AuctionLiveDataView, AuctionBuyNowView

urlpatterns = [
    path('v1/psa-verify/', PSAVerifyView.as_view(), name='psa-verify'),
    path('test-streamer/', StreamerTestView.as_view(), name='test_streamer'),
    path('v1/auctions/<int:pk>/live-data/', AuctionLiveDataView.as_view(), name='auction-live-data'),
    path('v1/auctions/<int:pk>/buy-now/', AuctionBuyNowView.as_view(), name='auction-buy-now'),
]

