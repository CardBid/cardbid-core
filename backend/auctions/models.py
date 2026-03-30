
from django.db                  import models
from django.contrib.auth.models import AbstractUser

"""
NOTICE: Djangah adds ID primary key fields by default
"""

class CardbidUser(AbstractUser):
    ROLE_CHOICES    = (
    #    In-database        Alias
        ('buyer',           'Kupujący'),
        ('seller',          'Sprzedający'),
        ('admin',           'Admin'),
    )
    email           = models.EmailField (unique=True)
    role            = models.CharField  (max_length=6, choices=ROLE_CHOICES)
    # Tell djangah tha we wanna to take email as username, by which djangah auths
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']


class Card(models.Model):
    name                = models.CharField(max_length=100)
    description         = models.TextField()
    grade               = models.CharField(max_length=10)
    certificate_number  = models.CharField(max_length=50, blank=True)


""" This djangah table links a Cardbid user with some card, and provides information
    about an auction (see fields belowah!)"""
class Auction(models.Model):
    STATUS_CHOICES  = (
    #    In-database        Alias
        ('active',          'Aktywna'),
        ('ended',           'Zakończona')
    )
    seller          = models.ForeignKey     (CardbidUser,   on_delete=models.CASCADE)
    card            = models.ForeignKey     (Card,          on_delete=models.CASCADE)
    starting_price  = models.DecimalField   (max_digits=10, decimal_places=2)
    current_price   = models.DecimalField   (max_digits=10, decimal_places=2, default=0)
    status          = models.CharField      (max_length=20, choices=STATUS_CHOICES)
