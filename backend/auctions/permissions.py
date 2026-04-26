
"""
All about permissions stuff. At this moment, it defines RBAC (Role-Based Access Control)
for use mainly by views.

Provided by Whisper.
"""

from rest_framework import permissions


class Roles:
    ADMIN       = "admin"
    BUYER       = "buyer"
    SELLER      = "seller"
    STREAMER    = "streamer"


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.ADMIN]


class IsBuyer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.BUYER, Roles.ADMIN]


class IsSeller(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.SELLER, Roles.ADMIN]


class IsStreamer(permissions.BasePermission):
    """
    Pozwala na dostęp tylko użytkownikom z rolą 'streamer'.
    """
    def title(self):
        return "Tylko dla Streamerów"

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'role', None) == 'streamer'
        )
