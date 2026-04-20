
"""
Command of manage.py utility, which creates 4 example users with all available roles.

Provided by Whisper.
"""


from auctions.permissions           import Roles
from django.core.management.base    import BaseCommand
from django.contrib.auth            import get_user_model


User = get_user_model()

class Command(BaseCommand):
    
    def handle(self, *args, **kwargs):
        
        creds = [
            ("dawtwilun@plm.com",   "1234", Roles.ADMIN),
            ("canter@tol.com",      "1234", Roles.BUYER),
            ("sduolc@dale.com",     "1234", Roles.SELLER),
            ("lun@gamin.com",       "1234", Roles.STREAMER),
        ]
        
        for cred in creds:
            user = User.objects.create_user(email=cred[0], password=cred[1], role=cred[2])
            self.stdout.write(f"Created user {user} with password '{cred[1]}'")
