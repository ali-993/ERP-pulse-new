from django.db import transaction
from rest_framework.exceptions import ValidationError

from .repositories import CustomerRepository, VendorRepository, PartnerRepository, DuplicateRoleCode
from .models import EntityRole, RoleType


class _ContactService:
    role_type = None
    repository_class = None
    parent_field = "parent_company_id"   # incoming flat field name
    code_field = "role_code_source"      # set per subclass
    notes_field = "notes"
    detail_fields = ()                   # set per subclass

    def __init__(self):
        self.repository = self.repository_class()

    def _resolve_parent(self, *, company, parent_role_id):
        if not parent_role_id:
            return None
        parent_role = (
            EntityRole.objects
            .filter(id=parent_role_id, role_type=self.role_type, entity__company=company)
            .select_related("entity")
            .first()
        )
        if not parent_role:
            raise ValidationError({self.parent_field: "Selected parent record was not found."})
        return parent_role.entity

    def _split(self, *, company, data):
        parent_entity = self._resolve_parent(company=company, parent_role_id=data.get(self.parent_field))

        entity_fields = {
            "company_name": data.get("company_name"),
            "parent": parent_entity,
        }

        role_fields = {
            "role_code": (data.get(self.code_field) or "").strip(),
            "status": data.get("status"),
            "notes": data.get(self.notes_field, "") or "",
        }

        detail_fields = {name: data.get(name) for name in self.detail_fields}

        address_fields = {
            "address_type": data.get("address_type", "Office"),
            "contact_name": data.get("primary_contact_name", ""),
            "job_title": data.get("job_title", ""),
            "phone": data.get("phone", ""),
            "alt_phone": data.get("alt_phone", ""),
            "fax": data.get("fax", ""),
            "email": data.get("email", ""),
            "address_line1": data.get("address_line1", ""),
            "address_line2": data.get("address_line2", ""),
            "city": data.get("city", ""),
            "state_province": data.get("state_province", ""),
            "country": data.get("country", ""),
            "zip_code": data.get("zip_code", ""),
            "is_primary": data.get("is_primary_address", True),
        }

        return entity_fields, role_fields, detail_fields, address_fields

    def list_for_company(self, *, company, limit=100, offset=0):
        return self.repository.list_for_company(company=company, limit=limit, offset=offset)

    def get_for_company(self, *, company, pk):
        return self.repository.get_for_company(company=company, pk=pk)

    @transaction.atomic
    def next_code(self, *, company):
        return self.repository.next_code(company=company)

    def create(self, *, company, data):
        entity_fields, role_fields, detail_fields, address_fields = self._split(company=company, data=data)
        try:
            return self.repository.create(
                company=company,
                entity_fields=entity_fields,
                role_fields=role_fields,
                detail_fields=detail_fields,
                address_fields=address_fields,
            )
        except DuplicateRoleCode:
            raise ValidationError({self.code_field: "This ID is already in use. Leave it blank to auto-generate one."})

    def update(self, *, company, role, data):
        entity_fields, role_fields, detail_fields, address_fields = self._split(company=company, data=data)
        return self.repository.update(
            role=role,
            entity_fields=entity_fields,
            role_fields=role_fields,
            detail_fields=detail_fields,
            address_fields=address_fields,
        )
    
    def set_status(self, *, role, status):
        return self.repository.set_status(role=role, status=status)

    def delete(self, *, role):
        self.repository.soft_delete(role=role)

class CustomerService(_ContactService):
    role_type = RoleType.CUSTOMER
    repository_class = CustomerRepository
    code_field = "customer_id"
    detail_fields = ("category", "credit_limit", "payment_terms", "sales_rep")


class VendorService(_ContactService):
    role_type = RoleType.VENDOR
    repository_class = VendorRepository
    code_field = "vendor_id"
    detail_fields = ("category", "gst_registration_type", "gstin")


class PartnerService(_ContactService):
    role_type = RoleType.PARTNER
    repository_class = PartnerRepository
    code_field = "partner_code"
    parent_field = "subpartner_of"
    notes_field = "additional_notes"
    detail_fields = ("partner_level", "gst_type", "pan", "company_registration_no", "currency")