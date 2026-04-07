from django.contrib import admin
from .models import CardbidUser, Category, Card, Auction, Bid, StreamRoom, AuctionSlot

@admin.register(CardbidUser)
class CardbidUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'role', 'is_staff')
    list_filter = ('role',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'grade', 'certificate_number')
    search_fields = ('name', 'certificate_number')

@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display = ('card', 'seller', 'current_price', 'status', 'auction_type')
    list_filter = ('status', 'auction_type')

@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ('auction', 'user', 'amount', 'created_at')

@admin.register(StreamRoom)
class StreamRoomAdmin(admin.ModelAdmin):
    list_display = ('streamer', 'title', 'is_live', 'stream_key')
    list_editable = ('is_live',) # Możesz przełączać LIVE prosto z listy!

@admin.register(AuctionSlot)
class AuctionSlotAdmin(admin.ModelAdmin):
    list_display = ('room', 'auction', 'order', 'status')
    list_editable = ('status', 'order')