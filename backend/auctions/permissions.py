
"""
RBAC Implementation

one would then write:
permission_classes = [IsSeller]

in some APIView inheriter in order to make the view only available for a seller
"""

from rest_framework.permissions import BasePermission

class Roles:
    BUYER = "buyer"
    SELLER = "seller"
    STREAMER = "streamer"
    ADMIN = "admin"

class IsSeller(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.SELLER, Roles.ADMIN]

class IsBuyer(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.BUYER, Roles.ADMIN]

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Roles.ADMIN]
