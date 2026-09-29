
from tenancy.models import Company

from django.db import transaction

from .models import Entity, EntityRole, CustomerDetail, VendorDetail, PartnerDetail, RoleType
from django.utils import timezone

class DuplicateRoleCode(Exception):
    """Raised when a Customer/Vendor/Partner ID is already used in this company."""


class _ContactRepository:
    """One repository per role type (Customer/Vendor/Partner) — same
    tables (Entity, EntityRole), different detail model."""

    role_type = None
    detail_model = None
    detail_related_name = None  # e.g. "customer_detail"

    extra_select_related = ()
    code_prefix = ""

    def base_queryset(self, company):
        return (
            EntityRole.objects
            .filter(entity__company=company, role_type=self.role_type, is_deleted=False)
            .select_related("entity", self.detail_related_name, *self.extra_select_related)
            .prefetch_related("addresses")
        )

    def list_for_company(self, *, company, limit=100, offset=0):
        queryset = self.base_queryset(company).order_by("-created_at")
        count = queryset.count()
        rows = queryset[offset:offset + limit]
        return list(rows), count

    def get_for_company(self, *, company, pk):
        return self.base_queryset(company).filter(pk=pk).first()

    @transaction.atomic
    def create(self, *, company, entity_fields, role_fields, detail_fields, address_fields):
        # Lock the company row so two simultaneous creates cannot get the same ID.
        Company.objects.select_for_update().get(pk=company.pk)

        code = (role_fields.get("role_code") or "").strip()
        if code:
            if self.code_exists(company=company, code=code):
                raise DuplicateRoleCode(code)
        else:
            code = self.next_code(company=company)
        role_fields = {**role_fields, "role_code": code}

        entity = Entity.objects.create(company=company, **entity_fields)

        role = EntityRole.objects.create(
            entity=entity,
            role_type=self.role_type,
            **role_fields,
        )

        self.detail_model.objects.create(role=role, **detail_fields)

        if address_fields:
            entity.addresses.create(role=role, **address_fields)

        return role

    @transaction.atomic
    def update(self, *, role, entity_fields, role_fields, detail_fields, address_fields):
        for key, value in entity_fields.items():
            setattr(role.entity, key, value)
        role.entity.save()

        for key, value in role_fields.items():
            setattr(role, key, value)
        role.save()

        detail = getattr(role, self.detail_related_name)
        for key, value in detail_fields.items():
            setattr(detail, key, value)
        detail.save()

        if address_fields:
            address = role.addresses.filter(is_primary=True).first() or role.addresses.first()
            if address:
                for key, value in address_fields.items():
                    setattr(address, key, value)
                address.save()

        return role

    def set_status(self, *, role, status):
        role.status = status
        role.save(update_fields=["status", "updated_at"])
        return role

    def soft_delete(self, *, role):
        role.is_deleted = True
        role.deleted_at = timezone.now()
        role.save(update_fields=["is_deleted", "deleted_at", "updated_at"])

    def lock_company(self, company):
        # Serialises concurrent creates for one company (Postgres row lock)
        type(company).objects.select_for_update().filter(pk=company.pk).first()

    def code_exists(self, *, company, code):
        return self.base_queryset(company).filter(role_code__iexact=code).exists()

    def next_code(self, *, company):
        # Includes soft-deleted rows so numbers are never reused
        codes = (
            EntityRole.objects
            .filter(entity__company=company, role_type=self.role_type,
                    role_code__istartswith=self.code_prefix)
            .values_list("role_code", flat=True)
        )
        highest = 0
        for code in codes:
            suffix = code[len(self.code_prefix):]
            if suffix.isdigit():
                highest = max(highest, int(suffix))
        return f"{self.code_prefix}{highest + 1:04d}"

class CustomerRepository(_ContactRepository):
    role_type = RoleType.CUSTOMER
    detail_model = CustomerDetail
    detail_related_name = "customer_detail"
    code_prefix = "CUST-"
    extra_select_related = ("customer_detail__sales_rep",)


class VendorRepository(_ContactRepository):
    role_type = RoleType.VENDOR
    detail_model = VendorDetail
    detail_related_name = "vendor_detail"
    code_prefix = "VND-"


class PartnerRepository(_ContactRepository):
    role_type = RoleType.PARTNER
    detail_model = PartnerDetail
    detail_related_name = "partner_detail"
    code_prefix = "PART-"
    extra_select_related = ("entity__parent",)