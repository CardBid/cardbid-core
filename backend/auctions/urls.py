from django.urls import path
from .views import MyTokenObtainPairView, TokenRefreshView, StreamerTestView

urlpatterns = [
    path("token/",          MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/",  TokenRefreshView.as_view(), name="token_refresh"),

    path('test-streamer/', StreamerTestView.as_view(), name='test_streamer'),

    # path('auctions/', AuctionListView.as_view(), name='auction-list'),
    # path('auctions/<int:pk>/', AuctionDetailView.as_view(), name='auction-detail'),
    # path('rooms/', StreamRoomListView.as_view(), name='room-list'),
]