from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.exceptions import ValidationError

class CardbidUser(AbstractUser):
    ROLE_CHOICES = (
        ("buyer", "Kupujący"),
        ("seller", "Sprzedający"),
        ("streamer", "Streamer"),
        ("admin", "Admin"),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="buyer")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email} ({self.role})"

class StreamRoom(models.Model):
    streamer = models.OneToOneField(CardbidUser, on_delete=models.CASCADE, related_name="stream_room")
    title = models.CharField(max_length=100, default="Licytacje na żywo")
    stream_url = models.URLField(blank=True, null=True, help_text="Link do YouTube/Twitch")
    is_live = models.BooleanField(default=False)

    def __str__(self):
        status = "LIVE" if self.is_live else "OFFLINE"
        return f"[{status}] Pokój: {self.streamer.username}"

class Category(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=50, unique=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

class Card(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="cards")
    grade = models.CharField(max_length=20)
    certificate_number = models.CharField(max_length=50, blank=True)
    image = models.ImageField(upload_to="cards/", null=True, blank=True)

    def __str__(self):
        cert = self.certificate_number if self.certificate_number else "brak certyfikatu"
        return f"{self.name} - {self.grade} - {cert}"

class Auction(models.Model):
    STATUS_CHOICES = (
        ("active", "Aktywna"),
        ("ended", "Zakończona"),
        ("cancelled", "Anulowana"),
    )

    TYPE_CHOICES = (
        ("bidding", "Tylko Licytacja"),
        ("buy_now", "Tylko Kup Teraz"),
        ("hybrid", "Licytacja + Kup Teraz"),
    )

    seller = models.ForeignKey(CardbidUser, on_delete=models.CASCADE, related_name="auctions_selling")
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name="auctions")
    auction_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="bidding")

    starting_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0)
    buy_now_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(default=timezone.now)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    winner = models.ForeignKey('CardbidUser', on_delete=models.SET_NULL, null=True, blank=True, related_name="auctions_won")

    def clean(self):
        if self.auction_type == "buy_now":
            if self.buy_now_price is None:
                raise ValidationError("Aukcja 'Kup Teraz' musi mieć podaną cenę buy_now_price.")
            self.starting_price = None
            self.current_price = self.buy_now_price 

        elif self.auction_type == "bidding":
            if self.starting_price is None:
                raise ValidationError("Licytacja musi mieć podaną cenę wywoławczą (starting_price).")
            self.buy_now_price = None
            if self.current_price is None or self.current_price == 0:
                self.current_price = self.starting_price

        elif self.auction_type == "hybrid":
            if self.starting_price is None or self.buy_now_price is None:
                raise ValidationError("Tryb hybrydowy wymaga podania ZARÓWNO ceny wywoławczej, jak i ceny Kup Teraz.")
            if self.buy_now_price <= self.starting_price:
                raise ValidationError("W trybie hybrydowym cena 'Kup Teraz' musi być wyższa niż wywoławcza.")
            if self.current_price is None or self.current_price == 0:
                self.current_price = self.starting_price

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.card.name} | {self.seller.email} | {self.current_price} PLN | [{self.get_auction_type_display()}] | {self.get_status_display()}"

class Bid(models.Model):
    auction = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name="bids")
    user = models.ForeignKey(CardbidUser, on_delete=models.CASCADE, related_name="bids_placed")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-amount"]

    def __str__(self):
        return f"{self.user.email} | {self.amount} PLN | {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"