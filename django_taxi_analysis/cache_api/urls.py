from django.urls import path
from .views import TaxiCacheView

urlpatterns = [
    path('<str:module>/<str:span>/', 
         TaxiCacheView.as_view(), name='taxi_cache'),
] 