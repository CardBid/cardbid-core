from django.urls import path
from .views import (
    PSAVerifyView, StreamerTestView, TaxCalculatorView, 
    TopUpBalanceView, UserProfileView, CardListCreateView,
    CategoryListView, AuctionListCreateView, AuctionDetailView, PlaceBidView, UserInventoryView, UserActiveBidsView,
    AuctionBidHistoryView, LiveRoomsListView, StreamRoomToggleView, CountryListView, BuyNowView, AuctionLiveDataView, RoomTimelineView, SlotOpenView,
    UserBalanceView, CreateAuctionView, UserSettingsView, ActivateSlotView, ReviewCreateView, SellerReviewsView, UserNotificationsView, MarkNotificationReadView,
    stripe_webhook
)

urlpatterns = [
    # --- AUTH & PROFILE ---
    path('v1/psa-verify/', PSAVerifyView.as_view(), name='psa-verify'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('user/balance/', UserBalanceView.as_view(), name='user-balance'),
    path('test-streamer/', StreamerTestView.as_view(), name='test-streamer'),

    # --- FINANCES ---
    path('tax-calc/', TaxCalculatorView.as_view(), name='tax-calculator'),
    path('top-up/', TopUpBalanceView.as_view(), name='top-up-balance'),
    path('stripe/webhook/', stripe_webhook, name='stripe-webhook'),

    # --- CARDS ---
    path('cards/', CardListCreateView.as_view(), name='card-list'), 
    path('categories/', CategoryListView.as_view(), name='category-list'),

    # --- USER DASHBOARD ---
    path('user/inventory/', UserInventoryView.as_view(), name='user_inventory'),
    path('user/active-bids/', UserActiveBidsView.as_view(), name='user_active_bids'),

    # --- AUCTIONS ---
    path('auctions/', AuctionListCreateView.as_view(), name='auction-list'),
    path('auctions/<int:pk>/', AuctionDetailView.as_view(), name='auction-detail'),
    path('auctions/<int:pk>/bid/', PlaceBidView.as_view(), name='place-bid'),
    path('auctions/<int:pk>/bids/', AuctionBidHistoryView.as_view(), name='auction-bids'),
    path('auctions/<int:pk>/buy-now/', BuyNowView.as_view(), name='buy-now'),
    path('auctions/create/', CreateAuctionView.as_view(), name='create-auction'),

    # --- AUCTION LIVE STREAMING & ROOMS ---
    path('slots/<int:slot_id>/open/', SlotOpenView.as_view(), name='slot-open'),
    path('rooms/<int:room_id>/timeline/', RoomTimelineView.as_view(), name='room-timeline'),
    path('auctions/<int:pk>/live-data/', AuctionLiveDataView.as_view(), name='auction-live-data'),
    path('live-rooms/', LiveRoomsListView.as_view(), name='live-rooms-list'),
    path('live-rooms/toggle/', StreamRoomToggleView.as_view(), name='live-rooms-toggle'),
    path('slots/<int:slot_id>/activate/', ActivateSlotView.as_view(), name='activate-slot'),

    # --- COUNTRIES & STATES ---
    path('countries/', CountryListView.as_view(), name='country-list'),
    path('user/settings/', UserSettingsView.as_view(), name='user-settings'),

    # --- REVIEWS & NOTIFICATIONS ---
    path('reviews/create/', ReviewCreateView.as_view()),
    path('reviews/seller/<int:seller_id>/', SellerReviewsView.as_view()),
    path('notifications/', UserNotificationsView.as_view()),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view()),
]
