
from django.contrib.auth.models import BaseUserManager

# This manager is required to specify custom behaviour in which only email and
# password are required for a user.
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user
