
"""
Database definition. The following tables (models) are defined:
- CardbidUser   - The application user
- StreamRoom    - Place where one can share her screen
- Category      - Trading card category
- Card          - Actual trading card
- Auction       - Card trading process
- Bid           - Some user's bid on some auction
- AuctionSlot   - Binding of an auction to some stream room

Provided by Whisper.
"""

from django.contrib.auth.models import AbstractUser
from django.core.exceptions     import ValidationError
from django.db                  import models
from django.utils               import timezone

from auctions.managers      import CardbidUserManager
from auctions.permissions   import Roles


class CardbidUser(AbstractUser):
    
    DEFAULT_ROLE = Roles.BUYER
    
    ROLE_CHOICES = (
        (Roles.ADMIN,       "Admin"),
        (Roles.BUYER,       "Kupujący"),
        (Roles.SELLER,      "Sprzedający"),
        (Roles.STREAMER,    "Streamer"),
    )

    email   = models.EmailField(unique=True)
    # password field is implicitly created by django ...
    role    = models.CharField(max_length=10, choices=ROLE_CHOICES, default=DEFAULT_ROLE)

    # Replace default user manager with the cardbid one
    objects = CardbidUserManager()

    # Make django consider our email field as its username field, which is used as
    # login during authentication.
    username        = None
    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        # Do not include password, because it is a hash anyways ...
        return f"CardbidUser(email={self.email}, role={self.role})"


class StreamRoom(models.Model):
    
    is_live     = models.BooleanField(default=False)
    
    # 'related_name' usage: when you have a CardbidUser 'U', you can access all stream
    # rooms related to her using format <U>.<related_name>.all()
    streamer    = models.OneToOneField(CardbidUser, on_delete=models.CASCADE, related_name="stream_rooms")
    
    stream_key  = models.CharField(max_length=100, unique=True, blank=True, null=True, help_text="Unikalny klucz do serwera")
    title       = models.CharField(max_length=100, default="Licytacje na żywo")

    def __str__(self):
        return f"StreamRoom(is_live={self.is_live}, streamer={self.streamer}, stream_key={self.stream_key}, title={self.title})"


class Category(models.Model):
    
    class Meta:
        verbose_name_plural = "Categories"  # Plural form of the model used in admin panel
    
    name = models.CharField(max_length=50)
    
    # URL-friendly string uniquely identifying the category, e.g.:
    # https://polc.lpm/blog/complete-basics -> slug is 'complete-basics'
    slug = models.SlugField(max_length=50, unique=True)

    def __str__(self):
        return f"Category(name={self.name}, slug={self.slug})"


class Card(models.Model):
    
    # This path is relative to 'MEDIA_ROOT' defined in core/settings.py
    CARD_IMAGES_DIR = "cards/"
    
    # So you can access all cards in a Category 'C' like: C.cards.all()
    category            = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="cards")
    
    certificate_number  = models.CharField(max_length=50, blank=True)
    description         = models.TextField()
    grade               = models.CharField(max_length=20)
    image               = models.ImageField(upload_to=CARD_IMAGES_DIR, null=True, blank=True)
    name                = models.CharField(max_length=100)

    def __str__(self):
        return f"Card(category={self.category}, certificate_number={self.certificate_number}, description={self.description}, grade={self.grade}, image={self.image}, name={self.name})"


class Auction(models.Model):
    
    class Status:
        ACTIVE      = "active"
        CANCELLED   = "cancelled"
        ENDED       = "ended"
        
    class Type:
        BIDDING = "bidding"
        BUY_NOW = "buy_now"
        HYBRID  = "hybrid"
    
    DEFAULT_STATUS = Status.ACTIVE
    
    STATUS_CHOICES = (
        (Status.ACTIVE,     "Aktywna"),
        (Status.CANCELLED,  "Anulowana"),
        (Status.ENDED,      "Zakończona"),
    )
    
    DEFAULT_TYPE = Type.BIDDING;

    TYPE_CHOICES = (
        (Type.BIDDING,  "Tylko Licytacja"),
        (Type.BUY_NOW,  "Tylko Kup Teraz"),
        (Type.HYBRID,   "Licytacja + Kup Teraz"),
    )

    # So you can access all auctions for sale of CardbidUser 'U' like: U.auctions_selling.all()
    seller          = models.ForeignKey(CardbidUser, on_delete=models.CASCADE, related_name="auctions_selling")
    
    # So you can access all auctions including Card 'C' like: C.auctions.all()
    card            = models.ForeignKey(Card, on_delete=models.CASCADE, related_name="auctions")
    
    auction_type    = models.CharField(max_length=10, choices=TYPE_CHOICES, default=DEFAULT_TYPE)
    starting_price  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0)
    buy_now_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    start_date      = models.DateTimeField(default=timezone.now)
    end_date        = models.DateTimeField(default=timezone.now)
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DEFAULT_STATUS)
    
    # So you can access all auctions won by CardbidUser 'U' like: U.auctions_won.all()
    winner          = models.ForeignKey('CardbidUser', on_delete=models.SET_NULL, null=True, blank=True, related_name="auctions_won")

    def __str__(self):
        return f"Auction(seller={self.seller}, card={self.card}, auction_type={self.auction_type}, starting_price={self.starting_price}, current_price={self.current_price}, \
        buy_now_price={self.buy_now_price}, start_date={self.start_date}, end_date={self.end_date}, status={self.status}, winner={self.winner})"

    def clean(self):
        """
        Validate the model data.
        """
        
        if self.auction_type == Type.BIDDING:
            if self.starting_price is None:
                raise ValidationError("Licytacja musi mieć podaną cenę wywoławczą (starting_price).")
            self.buy_now_price = None
            if self.current_price is None or self.current_price == 0:
                self.current_price = self.starting_price
        
        elif self.auction_type == Type.BUY_NOW:
            if self.buy_now_price is None:
                raise ValidationError("Aukcja 'Kup Teraz' musi mieć podaną cenę buy_now_price.")
            self.starting_price = None
            self.current_price  = self.buy_now_price 

        elif self.auction_type == Type.HYBRID:
            if self.starting_price is None or self.buy_now_price is None:
                raise ValidationError("Tryb hybrydowy wymaga podania ZARÓWNO ceny wywoławczej, jak i ceny Kup Teraz.")
            if self.buy_now_price <= self.starting_price:
                raise ValidationError("W trybie hybrydowym cena 'Kup Teraz' musi być wyższa niż wywoławcza.")
            if self.current_price is None or self.current_price == 0:
                self.current_price = self.starting_price

    def save(self, *args, **kwargs):
        """
        Commit the model to the database.
        """
        
        # Before doing so, validate it using our method
        self.clean()
        super().save(*args, **kwargs)


class Bid(models.Model):
    
    class Meta:
        ordering = ["-amount"]  # = ORDER BY amount DESC
    
    amount      = models.DecimalField(max_digits=10, decimal_places=2)
    
    # So you can access all bids including Auction 'A' like: A.bids.all()
    auction     = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name="bids")
    
    created_at  = models.DateTimeField(auto_now_add=True)
    
    # So you can access all bids placed by CardbidUser 'U' like: U.bids_placed.all()
    user        = models.ForeignKey(CardbidUser, on_delete=models.CASCADE, related_name="bids_placed")

    def __str__(self):
        return f"Bid(amount={self.amount}, auction={self.auction}, created_at={self.created_at}, user={self.user})"


class AuctionSlot(models.Model):
    
    class Meta:
        ordering = ['order']  # ORDER BY order ASC
    
    class Status:
        ACTIVE      = "active"
        FINISHED    = "finished"
        PENDING     = "pending"
    
    STATUS_CHOICES = [
        (Status.ACTIVE,     'Teraz'),
        (Status.FINISHED,   'Zakończone'),
        (Status.PENDING,    'W kolejce'),
    ]

    auction = models.OneToOneField('Auction', on_delete=models.CASCADE)
    order   = models.PositiveIntegerField(help_text="Numer slotu (np. 1, 2, 3...)")
    
    # So you can access all auction slots in StreamRoom 'SR' like: SR.slots.all()
    room    = models.ForeignKey(StreamRoom, on_delete=models.CASCADE, related_name="slots")
    
    status  = models.CharField(max_length=10, choices=STATUS_CHOICES, default=Status.PENDING)

    def __str__(self):
        return f"AuctionSlot(auction={self.auction}, order={self.order}, room={self.room}, status={self.status})"

