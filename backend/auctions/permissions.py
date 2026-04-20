
"""
All about permissions stuff. At this moment, it defines RBAC (Role-Based Access Control)
for use mainly by views.

Provided by Whisper.
"""

from rest_framework.permissions import BasePermission


class Roles:
    ADMIN       = "admin"
    BUYER       = "buyer"
    SELLER      = "seller"
    STREAMER    = "streamer"


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.ADMIN]


class IsBuyer(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.BUYER, Roles.ADMIN]


class IsSeller(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.SELLER, Roles.ADMIN]
        
        
class IsStreamer(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.STREAMER, Roles.ADMIN]

