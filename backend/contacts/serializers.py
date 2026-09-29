from django.contrib.auth import get_user_model
from .models import RecordStatus

User = get_user_model()

from rest_framework import serializers
from .models import EntityRole, CustomerDetail, VendorDetail, PartnerDetail, RoleType


class _BaseContactReadSerializer(serializers.ModelSerializer):
    """Shared read shape: flattens Entity + EntityRole + primary Address
    onto one object. Subclasses add their type-specific detail fields."""

    company_name = serializers.CharField(source="entity.company_name", allow_null=True, read_only=True)
    parent_company_id = serializers.UUIDField(source="entity.parent_id", allow_null=True, read_only=True)
    notes = serializers.CharField(read_only=True)

    primary_contact_name = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    alt_phone = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    fax = serializers.SerializerMethodField()
    address_type = serializers.SerializerMethodField()
    address_line1 = serializers.SerializerMethodField()
    address_line2 = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    state_province = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    zip_code = serializers.SerializerMethodField()
    is_primary_address = serializers.SerializerMethodField()

    def _addr(self, obj):
        # cached per-instance so 14 SerializerMethodFields don't run 14 queries
        if not hasattr(obj, "_primary_address_cache"):
            obj._primary_address_cache = obj.addresses.filter(is_primary=True).first() or obj.addresses.first()
        return obj._primary_address_cache

    def get_primary_contact_name(self, obj):
        addr = self._addr(obj)
        return addr.contact_name if addr else ""

    def get_job_title(self, obj):
        addr = self._addr(obj)
        return addr.job_title if addr else ""

    def get_phone(self, obj):
        addr = self._addr(obj)
        return addr.phone if addr else ""

    def get_alt_phone(self, obj):
        addr = self._addr(obj)
        return addr.alt_phone if addr else ""

    def get_email(self, obj):
        addr = self._addr(obj)
        return addr.email if addr else ""

    def get_fax(self, obj):
        addr = self._addr(obj)
        return addr.fax if addr else ""

    def get_address_type(self, obj):
        addr = self._addr(obj)
        return addr.address_type if addr else ""

    def get_address_line1(self, obj):
        addr = self._addr(obj)
        return addr.address_line1 if addr else ""

    def get_address_line2(self, obj):
        addr = self._addr(obj)
        return addr.address_line2 if addr else ""

    def get_city(self, obj):
        addr = self._addr(obj)
        return addr.city if addr else ""

    def get_state_province(self, obj):
        addr = self._addr(obj)
        return addr.state_province if addr else ""

    def get_country(self, obj):
        addr = self._addr(obj)
        return addr.country if addr else ""

    def get_zip_code(self, obj):
        addr = self._addr(obj)
        return addr.zip_code if addr else ""

    def get_is_primary_address(self, obj):
        addr = self._addr(obj)
        return addr.is_primary if addr else False


class CustomerReadSerializer(_BaseContactReadSerializer):
    customer_id = serializers.CharField(source="role_code", read_only=True)
    category = serializers.CharField(source="customer_detail.category", read_only=True)
    credit_limit = serializers.DecimalField(source="customer_detail.credit_limit", max_digits=12, decimal_places=2, read_only=True, allow_null=True)
    payment_terms = serializers.CharField(source="customer_detail.payment_terms", read_only=True)
    sales_rep_id = serializers.UUIDField(source="customer_detail.sales_rep_id", read_only=True, allow_null=True)
    sales_rep_name = serializers.SerializerMethodField()

    def get_sales_rep_name(self, obj):
        rep = getattr(obj.customer_detail, "sales_rep", None)
        return rep.get_full_name() if rep else ""

    class Meta:
        model = EntityRole
        fields = (
            "id", "customer_id", "status", "company_name", "parent_company_id",
            "category", "credit_limit", "payment_terms", "sales_rep_id", "sales_rep_name",
            "primary_contact_name", "job_title", "phone", "alt_phone", "email", "fax",
            "address_type", "address_line1", "address_line2", "city", "state_province",
            "country", "zip_code", "is_primary_address", "notes", "created_at",
        )


class VendorReadSerializer(_BaseContactReadSerializer):
    vendor_id = serializers.CharField(source="role_code", read_only=True)
    category = serializers.CharField(source="vendor_detail.category", read_only=True)
    gst_registration_type = serializers.CharField(source="vendor_detail.gst_registration_type", read_only=True)
    gstin = serializers.CharField(source="vendor_detail.gstin", read_only=True)

    class Meta:
        model = EntityRole
        fields = (
            "id", "vendor_id", "status", "company_name", "parent_company_id",
            "category", "gst_registration_type", "gstin",
            "primary_contact_name", "job_title", "phone", "alt_phone", "email", "fax",
            "address_type", "address_line1", "address_line2", "city", "state_province",
            "country", "zip_code", "is_primary_address", "notes", "created_at",
        )


class PartnerReadSerializer(_BaseContactReadSerializer):
    partner_code = serializers.CharField(source="role_code", read_only=True)
    partner_level = serializers.CharField(source="partner_detail.partner_level", read_only=True)
    gst_type = serializers.CharField(source="partner_detail.gst_type", read_only=True)
    pan = serializers.CharField(source="partner_detail.pan", read_only=True)
    company_registration_no = serializers.CharField(source="partner_detail.company_registration_no", read_only=True)
    currency = serializers.CharField(source="partner_detail.currency", read_only=True)
    subpartner_of = serializers.SerializerMethodField()
    def get_subpartner_of(self, obj):
        parent = getattr(obj.entity, "parent", None)
        return parent.company_name if parent else ""
    additional_notes = serializers.CharField(source="notes", read_only=True)

    class Meta:
        model = EntityRole
        fields = (
            "id", "partner_code", "status", "company_name", "subpartner_of",
            "partner_level", "gst_type", "pan", "company_registration_no", "currency",
            "primary_contact_name", "job_title", "phone", "alt_phone", "email", "fax",
            "address_type", "address_line1", "address_line2", "city", "state_province",
            "country", "zip_code", "is_primary_address", "additional_notes", "created_at",
        )

class CustomerWriteSerializer(serializers.Serializer):
    customer_id = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(choices=RecordStatus.choices, default=RecordStatus.ACTIVE)
    company_name = serializers.CharField()
    parent_company_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    sales_rep_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    category = serializers.CharField(required=False, allow_blank=True, default="")
    credit_limit = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    payment_terms = serializers.CharField(required=False, allow_blank=True, default="")
    primary_contact_name = serializers.CharField()
    job_title = serializers.CharField(required=False, allow_blank=True, default="")
    phone = serializers.CharField()
    alt_phone = serializers.CharField(required=False, allow_blank=True, default="")
    email = serializers.EmailField()
    fax = serializers.CharField(required=False, allow_blank=True, default="")
    address_type = serializers.CharField(required=False, default="Office")
    address_line1 = serializers.CharField()
    address_line2 = serializers.CharField(required=False, allow_blank=True, default="")
    city = serializers.CharField()
    state_province = serializers.CharField(required=False, allow_blank=True, default="")
    country = serializers.CharField()
    zip_code = serializers.CharField(required=False, allow_blank=True, default="")
    is_primary_address = serializers.BooleanField(required=False, default=False)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        company = self.context.get("company")
        sales_rep_id = attrs.pop("sales_rep_id", None)
        if sales_rep_id:
            user = User.objects.filter(id=sales_rep_id, company=company).first()
            if not user:
                raise serializers.ValidationError({"sales_rep_id": "Selected sales representative was not found."})
            attrs["sales_rep"] = user
        else:
            attrs["sales_rep"] = None
        return attrs


class VendorWriteSerializer(serializers.Serializer):
    vendor_id = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(choices=RecordStatus.choices, default=RecordStatus.ACTIVE)
    company_name = serializers.CharField()
    parent_company_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    category = serializers.CharField(required=False, allow_blank=True, default="")
    gst_registration_type = serializers.CharField()
    gstin = serializers.CharField(required=False, allow_blank=True, default="")
    primary_contact_name = serializers.CharField()
    job_title = serializers.CharField(required=False, allow_blank=True, default="")
    phone = serializers.CharField()
    alt_phone = serializers.CharField(required=False, allow_blank=True, default="")
    email = serializers.EmailField()
    fax = serializers.CharField(required=False, allow_blank=True, default="")
    address_type = serializers.CharField(required=False, default="Office")
    address_line1 = serializers.CharField()
    address_line2 = serializers.CharField(required=False, allow_blank=True, default="")
    city = serializers.CharField()
    state_province = serializers.CharField(required=False, allow_blank=True, default="")
    country = serializers.CharField()
    zip_code = serializers.CharField(required=False, allow_blank=True, default="")
    is_primary_address = serializers.BooleanField(required=False, default=False)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        if attrs.get("gst_registration_type") == "Registered" and not attrs.get("gstin", "").strip():
            raise serializers.ValidationError({"gstin": "GSTIN is required for registered vendors."})
        return attrs

class PartnerWriteSerializer(serializers.Serializer):
    partner_code = serializers.CharField(required=False, allow_blank=True, default="")
    partner_level = serializers.CharField()
    status = serializers.ChoiceField(choices=RecordStatus.choices, default=RecordStatus.ACTIVE)
    subpartner_of = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    company_name = serializers.CharField()
    gst_type = serializers.CharField()
    pan = serializers.CharField()
    company_registration_no = serializers.CharField(required=False, allow_blank=True, default="")
    currency = serializers.CharField()
    primary_contact_name = serializers.CharField()
    job_title = serializers.CharField(required=False, allow_blank=True, default="")
    phone = serializers.CharField()
    alt_phone = serializers.CharField(required=False, allow_blank=True, default="")
    email = serializers.EmailField()
    fax = serializers.CharField(required=False, allow_blank=True, default="")
    address_type = serializers.CharField(required=False, default="Office")
    address_line1 = serializers.CharField()
    address_line2 = serializers.CharField(required=False, allow_blank=True, default="")
    city = serializers.CharField()
    state_province = serializers.CharField(required=False, allow_blank=True, default="")
    country = serializers.CharField()
    zip_code = serializers.CharField(required=False, allow_blank=True, default="")
    is_primary_address = serializers.BooleanField(required=False, default=True)
    additional_notes = serializers.CharField(required=False, allow_blank=True, default="")