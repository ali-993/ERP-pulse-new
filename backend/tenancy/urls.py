from django.urls import include, path
from rest_framework.routers import DefaultRouter

from tenancy.views import (
    ClientMeView,
    ClientRoleListView,
    CompanyEmployeeViewSet,
    CompanySettingsView,
)

from contacts.views import CustomerViewSet, VendorViewSet, PartnerViewSet

router = DefaultRouter()
router.register(r'employees', CompanyEmployeeViewSet, basename='client-employee')

router.register(r'customers', CustomerViewSet, basename='client-customer')
router.register(r'vendors', VendorViewSet, basename='client-vendor')
router.register(r'partners', PartnerViewSet, basename='client-partner')
urlpatterns = [
    path('me/', ClientMeView.as_view(), name='client-me'),
    path('roles/', ClientRoleListView.as_view(), name='client-roles'),
    path('settings/', CompanySettingsView.as_view(), name='client-settings'),
    path('', include(router.urls)),
]
