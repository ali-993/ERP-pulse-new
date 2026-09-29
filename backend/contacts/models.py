import uuid
from django.db import models
from django.conf import settings
from core.models import BaseModel


class RoleType(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    VENDOR = "VENDOR", "Vendor"
    PARTNER = "PARTNER", "Partner"


class RecordStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    PROSPECT = "PROSPECT", "Prospect"


class Entity(BaseModel):
    company = models.ForeignKey("tenancy.Company", on_delete=models.CASCADE, related_name="entities")
    company_name = models.CharField(max_length=200, blank=True, null=True)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children")
    web_address = models.CharField(max_length=255, blank=True, default="")
    comments = models.TextField(blank=True, default="")


class EntityRole(BaseModel):
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="roles")
    role_type = models.CharField(max_length=20, choices=RoleType.choices)
    role_code = models.CharField(max_length=50)          # customer_id / vendor_id / partner_code
    status = models.CharField(max_length=20, choices=RecordStatus.choices, default=RecordStatus.ACTIVE)
    notes = models.TextField(blank=True, default="")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["entity", "role_type"], name="uniq_entity_role_type"
            ),
        ]


class CustomerDetail(BaseModel):
    role = models.OneToOneField(EntityRole, on_delete=models.CASCADE, related_name="customer_detail")
    category = models.CharField(max_length=50, blank=True, default="")
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    payment_terms = models.CharField(max_length=50, blank=True, default="")
    sales_rep = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="customer_accounts")
    default_order_priority = models.IntegerField(null=True, blank=True)
    referring_partner_role = models.ForeignKey(EntityRole, on_delete=models.SET_NULL, null=True, blank=True, related_name="referred_customers")


class VendorDetail(BaseModel):
    role = models.OneToOneField(EntityRole, on_delete=models.CASCADE, related_name="vendor_detail")
    category = models.CharField(max_length=50, blank=True, default="")
    gst_registration_type = models.CharField(max_length=30, blank=True, default="")
    gstin = models.CharField(max_length=50, blank=True, default="")
    payment_terms = models.CharField(max_length=50, blank=True, default="")
    bank_account = models.CharField(max_length=100, blank=True, default="")
    vendor_rating = models.CharField(max_length=20, blank=True, default="")


class PartnerDetail(BaseModel):
    role = models.OneToOneField(EntityRole, on_delete=models.CASCADE, related_name="partner_detail")
    partner_level = models.CharField(max_length=30, blank=True, default="")
    gst_type = models.CharField(max_length=30, blank=True, default="")
    pan = models.CharField(max_length=20, blank=True, default="")
    company_registration_no = models.CharField(max_length=100, blank=True, default="")
    currency = models.CharField(max_length=10, default="INR")
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    referral_code = models.CharField(max_length=50, blank=True, default="")


class Address(BaseModel):
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="addresses")
    role = models.ForeignKey(EntityRole, on_delete=models.CASCADE, related_name="addresses")
    address_type = models.CharField(max_length=20, blank=True, default="Office")
    contact_name = models.CharField(max_length=200, blank=True, default="")
    job_title = models.CharField(max_length=100, blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    alt_phone = models.CharField(max_length=30, blank=True, default="")
    fax = models.CharField(max_length=30, blank=True, default="")
    email = models.CharField(max_length=150, blank=True, default="")
    login_access = models.BooleanField(default=False)
    address_line1 = models.CharField(max_length=255, blank=True, default="")
    address_line2 = models.CharField(max_length=255, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    state_province = models.CharField(max_length=100, blank=True, default="")
    country = models.CharField(max_length=100, blank=True, default="")
    zip_code = models.CharField(max_length=20, blank=True, default="")
    is_primary = models.BooleanField(default=True)