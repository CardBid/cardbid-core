
"""
Custom user manager definitions. Only one is required for Cardbid project so this
script is not so biggah.

Provided by Whisper.
"""

from django.contrib.auth.models import BaseUserManager


class CardbidUserManager(BaseUserManager):
    """
    Facilitates management of a Cardbid user, characterized by an email, a password,
    and optionally by a role (see auctions.permissions.Roles)
    """
    
    # Note: if you do not provide password, you will not be able to log in, all password
    #       checks will fail. It may be intended or not, there are some use cases though ...
    def create_user(self, email, password=None, **extra_fields):
        
        if not email:
            raise ValueError('The email must be set you goober!')
        email   = self.normalize_email(email)
        user    = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user
        
    def create_superuser(self, email, password=None, **extra_fields):
        
        extra_fields.setdefault("is_staff",     True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active",    True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(email, password, **extra_fields)

