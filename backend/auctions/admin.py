
"""
Admin panel tables (models) presentation definition (after logging in).

Provided by Whisper.
"""

from auctions.models    import CardbidUser, Category, Card, Auction, Bid, StreamRoom, AuctionSlot, Transaction
from django.contrib     import admin


@admin.register(CardbidUser)
class CardbidUserAdmin(admin.ModelAdmin):
    list_display        = ('id','email', 'username', 'role', 'is_staff', 'balance', 'frozen_balance')
    list_display_links  = ('email',)
    list_filter         = ('role',)
    
    
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display        = ('user','amount', 'trans_type', 'trans_status', 'stripe_intent_id', 'timestamp')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display        = ('id','name', 'slug')
    list_display_links  = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display        = ('id','name', 'category', 'grade', 'certificate_number')
    list_display_links  = ('name',)
    search_fields       = ('name', 'certificate_number')


@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display        = ('id','card', 'seller', 'current_price', 'status', 'auction_type')
    list_display_links  = ('card',)
    list_filter         = ('status', 'auction_type')


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display        = ('auction', 'user', 'amount', 'created_at')
    list_display_links  = ('auction',)


@admin.register(StreamRoom)
class StreamRoomAdmin(admin.ModelAdmin):
    list_display        = ('id','streamer', 'title', 'is_live', 'stream_key')
    list_display_links  = ('streamer',)
    list_editable       = ('is_live',)


@admin.register(AuctionSlot)
class AuctionSlotAdmin(admin.ModelAdmin):
    list_display        = ('id', 'room', 'auction', 'order', 'status')
    list_display_links  = ('room',)
    list_editable       = ('status', 'order')

