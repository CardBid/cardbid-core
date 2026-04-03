from django.contrib import admin
from .models import CardbidUser, Card, Auction


@admin.register(CardbidUser)
class CardbidUserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "username", "role", "is_staff", "is_superuser")
    search_fields = ("email", "username")
    list_filter = ("role", "is_staff", "is_superuser")


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "grade", "certificate_number")
    search_fields = ("name", "grade", "certificate_number")

@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display = ("id", "card", "seller", "starting_price", "current_price", "status")
    search_fields = ("card__name", "seller__email")
    list_filter = ("status",)