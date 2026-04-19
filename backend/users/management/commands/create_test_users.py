
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from auctions.permissions import Roles

User = get_user_model()

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        User.objects.create_user(
            email="dawtwilun@plm.com",
            password="1234",
            role=Roles.ADMIN
        )
        self.stdout.write("Created test user 'dawtwilun@plm.com' with password '1234' as ADMIN")
        
        User.objects.create_user(
            email="bonzo@alonzo.com",
            password="1234",
            role=Roles.BUYER
        )
        self.stdout.write("Created test user 'bonzo@alonzo.com' with password '1234' as BUYER")
        
        User.objects.create_user(
            email="celinka@canter.com",
            password="1234",
            role=Roles.SELLER
        )
        self.stdout.write("Created test user 'celinka@canter.com' with password '1234' as SELLER")
        
        User.objects.create_user(
            email="lun@gamin.com",
            password="1234",
            role=Roles.STREAMER
        )
        self.stdout.write("Created test user 'lun@gamin.com' with password '1234' as STREAMER")
