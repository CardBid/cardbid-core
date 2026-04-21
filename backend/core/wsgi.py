
"""
Compatibility layer, normally it is almost fully replaced by ASGI but better leave
it here for e.g. possible fallback. It still forwards traffic to ASGI though.

Provided by Whisper.
"""

from django.core.wsgi   import get_wsgi_application
from os                 import environ


environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_wsgi_application()
