
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

UWAGA!  jak nie widać tabelek w panelu admina do edycji (np. nie można widzieć zawartości
        tabeli Transaction) to nie znaczy że nie działa, tylko w admin.py trzeba zrobić
        pozycje dla tej klasy.
"""

from django.contrib.auth.models import AbstractUser
from django.core.exceptions     import ValidationError
from django.db                  import models
from django.utils               import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

from auctions.managers      import CardbidUserManager
from auctions.permissions   import Roles

from cloudinary.models import CloudinaryField

# Country and State models for tax calculations
class Country(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=2, unique=True) # PL, US, GB
    default_vat = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    duty_rate = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    has_states = models.BooleanField(default=False)

    def __str__(self):
        return self.name

# States for United States (or other countries with states and different tax rates)
class State(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='states')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=5) # CA, NY, TX
    tax_rate = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.country.code} - {self.name}"

class CardbidUser(AbstractUser):
    
    DEFAULT_ROLE = Roles.BUYER
    
    ROLE_CHOICES = (
        (Roles.ADMIN,       "Admin"),
        (Roles.BUYER,       "Buyer"),
        (Roles.SELLER,      "Seller"),
        (Roles.STREAMER,    "Streamer"),
    )

    email   = models.EmailField(unique=True)
    # password field is implicitly created by django ...
    role    = models.CharField(max_length=10, choices=ROLE_CHOICES, default=DEFAULT_ROLE)

    # Replace default user manager with the cardbid one
    objects = CardbidUserManager()

    # Make django consider our email field as its username field, which is used as
    # login during authentication.
    username        = models.CharField(max_length=150, unique=True)

    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True)
    state = models.ForeignKey(State, on_delete=models.SET_NULL, null=True, blank=True)
    shipping_address = models.TextField(blank=True)
    birth_date = models.DateField(null=True, blank=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # środki zarezerwowane pod aktywne oferty w aukcjach
    frozen_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["username"]

    def clean(self):
        super().clean()
        if self.country and self.country.has_states and not self.state:
            raise ValidationError({
                'state': 'You must to choose a state if your country has states.'
            })

        if self.state: 
            if self.country and self.state.country != self.country:
                state_name = self.state.name 
                country_name = self.country.name
                raise ValidationError({
                    'state': f'Region ({state_name}) does not belong to {country_name}!'
                })
            
        if self.country and not self.country.has_states:
            self.state = None
            
    def save(self, *args, **kwargs):
        self.full_clean(exclude=['password'])
        super().save(*args, **kwargs)

    def __str__(self):
        # Do not include password, because it is a hash anyways ...
        return f"{self.username} ({self.email}) - role: {self.role}"


class Transaction(models.Model):
    
    class Status:
        PENDING     = "pending"
        COMPLETED   = "completed"
        FAILED      = "failed"
    
    class Type:
        PAYMENT_IN  = "payment in"
        PAYMENT_OUT = "payment out"
        FREEZE      = "freeze"
        UNFREEZE    = "unfreeze"
    
    DEFAULT_STATUS = Status.FAILED
    
    STATUS_CHOICES = (
        ( Status.PENDING,   "trwająca" ),
        ( Status.COMPLETED, "zakończona" ),
        ( Status.FAILED,    "nieudana" )
    )
    
    DEFAULT_TYPE = Type.PAYMENT_IN
    
    TYPE_CHOICES = (
        ( Type.PAYMENT_IN,  "płatność wchodząca" ),
        ( Type.PAYMENT_OUT, "płatność wychodząca" ),
        ( Type.FREEZE,      "wstrzymana" ),
        ( Type.UNFREEZE,    "wznowiona" )
    )
    
    user                = models.ForeignKey(CardbidUser, on_delete=models.CASCADE, related_name="transactions")
    amount              = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    trans_type          = models.CharField(max_length=18, choices=TYPE_CHOICES, default=DEFAULT_TYPE)
    trans_status        = models.CharField(max_length=10, choices=STATUS_CHOICES, default=DEFAULT_STATUS)
    stripe_intent_id    = models.CharField(max_length=255, unique=True)
    timestamp           = models.DateTimeField(auto_now_add=True)  # Automatically set on a record creation
    
    def __str__(self):
        return f"Transaction(user={self.user}, amount={self.amount}, trans_type={self.trans_type}, trans_status={self.trans_status}, stripe_intent_id={self.stripe_intent_id}, timestamp={self.timestamp})"


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
    image               = CloudinaryField('image', null=True, blank=True)
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
        (Status.ACTIVE,     "Active"),
        (Status.CANCELLED,  "Cancelled"),
        (Status.ENDED,      "Ended"),
    )
    
    DEFAULT_TYPE = Type.BIDDING;

    TYPE_CHOICES = (
        (Type.BIDDING,  "Only Bidding"),
        (Type.BUY_NOW,  "Only Buy Now"),
        (Type.HYBRID,   "Bidding + Buy Now"),
    )

    # So you can access all auctions for sale of CardbidUser 'U' like: U.auctions_selling.all()
    seller          = models.ForeignKey(CardbidUser, on_delete=models.CASCADE, related_name="auctions_selling")
    
    # So you can access all auctions including Card 'C' like: C.auctions.all()
    card            = models.ForeignKey(Card, on_delete=models.CASCADE, related_name="auctions")
    
    auction_type    = models.CharField(max_length=10, choices=TYPE_CHOICES, default=DEFAULT_TYPE)
    starting_price  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0)
    buy_now_price   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    min_increment = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=1.00
    )

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
        
        if self.auction_type == self.Type.BIDDING:
            if self.starting_price is None:
                raise ValidationError("Auction must have a starting price.")
            self.buy_now_price = None
            if self.current_price is None or self.current_price == 0:
                self.current_price = self.starting_price
        
        elif self.auction_type == self.Type.BUY_NOW:
            if self.buy_now_price is None:
                raise ValidationError("Auction must have a 'Buy Now' price.")
            self.starting_price = None
            self.current_price  = self.buy_now_price 

        elif self.auction_type == self.Type.HYBRID:
            if self.starting_price is None or self.buy_now_price is None:
                raise ValidationError("Hybrid auction must have both starting_price and buy_now_price.")
            if self.buy_now_price <= self.starting_price:
                raise ValidationError("In hybrid mode, the 'Buy Now' price must be higher than the starting price.")
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

    STATUS_CHOICES = (
        (Status.ACTIVE,     "Active"),
        (Status.FINISHED,   "Finished"),
        (Status.PENDING,    "Pending"),
    )

    auction = models.OneToOneField('Auction', on_delete=models.CASCADE)
    order   = models.PositiveIntegerField(help_text="Number of the slot (e.g., 1, 2, 3...)")
    
    # So you can access all auction slots in StreamRoom 'SR' like: SR.slots.all()
    room    = models.ForeignKey(StreamRoom, on_delete=models.CASCADE, related_name="slots")
    
    status  = models.CharField(max_length=10,choices=STATUS_CHOICES,default="pending")

    is_opened = models.BooleanField(
        default=False, 
        help_text="Indicates whether the physical package/card has been opened on the stream"
    )

    def __str__(self):
        return f"AuctionSlot(auction={self.auction}, order={self.order}, room={self.room}, status={self.status}, is_opened={self.is_opened})"


class Review(models.Model):
    buyer = models.ForeignKey(CardbidUser, on_delete=models.CASCADE, related_name="reviews_given")
    seller = models.ForeignKey(CardbidUser, on_delete=models.CASCADE, related_name="reviews_received")
    auction = models.OneToOneField(Auction, on_delete=models.CASCADE)
    
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review(seller={self.seller.username}, rating={self.rating}, auction={self.auction.id})"


class Notification(models.Model):
    class Type:
        OUTBID = "outbid"
        WON = "won"
        SYSTEM = "system"
        
    TYPE_CHOICES = (
        (Type.OUTBID, "Outbid"),
        (Type.WON, "Won"),
        (Type.SYSTEM, "System"),
    )

    user = models.ForeignKey(CardbidUser, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=Type.SYSTEM)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification({self.user.username}, read={self.is_read}, msg={self.message})"
