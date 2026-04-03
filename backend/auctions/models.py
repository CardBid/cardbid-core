from django.db import models
from django.contrib.auth.models import AbstractUser


class CardbidUser(AbstractUser):
    ROLE_CHOICES = (
        ("buyer", "Kupujący"),
        ("seller", "Sprzedający"),
        ("admin", "Admin"),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=6, choices=ROLE_CHOICES)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.email} ({self.role})"


class Card(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    grade = models.CharField(max_length=20)
    certificate_number = models.CharField(max_length=50, blank=True)

    def __str__(self):
        cert = self.certificate_number if self.certificate_number else "brak certyfikatu"
        return f"{self.name} - {self.grade} - {cert}"

class Auction(models.Model):
    STATUS_CHOICES = (
        ("active", "Aktywna"),
        ("ended", "Zakończona"),
    )

    seller = models.ForeignKey(CardbidUser, on_delete=models.CASCADE)
    card = models.ForeignKey(Card, on_delete=models.CASCADE)
    starting_price = models.DecimalField(max_digits=10, decimal_places=2)
    current_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    def __str__(self):
        return f"{self.card.name} | {self.seller.email} | {self.status}"