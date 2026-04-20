
"""
Provides class(es) allowing for HTTP requests handling. At this point, there are
only JWT token test views, but who knows the future ... data is provided by the 
core.asgi module.

Provided by Whisper.
"""

# These are used to test JWT receiving & refreshing tokens, remove in production please!
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

