from django.urls import path
from .views import PSAVerifyView, StreamerTestView, TaxCalculatorView, TopUpBalanceView

urlpatterns = [
    path('v1/psa-verify/', PSAVerifyView.as_view(), name='psa-verify'),

    path('test-streamer/', StreamerTestView.as_view(), name='test_streamer'),

    path('tax-calc/', TaxCalculatorView.as_view(), name='tax-calculator'),
    path('top-up/', TopUpBalanceView.as_view(), name='top-up-balance'),

    # path('auctions/', AuctionListView.as_view(), name='auction-list'),
    # path('auctions/<int:pk>/', AuctionDetailView.as_view(), name='auction-detail'),
    # path('rooms/', StreamRoomListView.as_view(), name='room-list'),
]