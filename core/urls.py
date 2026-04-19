"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Tutaj w przyszłości dodasz ścieżki do API, np.:
    # path('api/', include('auctions.urls')),
]

# Ta sekcja odpowiada za to, żeby zdjęcia (MEDIA) wyświetlały się w przeglądarce 
# podczas pracy lokalnej (gdy DEBUG = True w settings.py)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)