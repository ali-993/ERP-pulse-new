from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from common.pagination import paginated_response
from common.common_utils import success_response
from tenancy.permissions import IsCompanyUser

from .services import CustomerService, VendorService, PartnerService
from .serializers import (
    CustomerReadSerializer, CustomerWriteSerializer,
    VendorReadSerializer, VendorWriteSerializer,
    PartnerReadSerializer, PartnerWriteSerializer,
)


class _ContactViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsCompanyUser]

    service_class = None
    read_serializer_class = None
    write_serializer_class = None
    label = "Record"

    def _company(self, request):
        return request.user.company

    def list(self, request):
        company = self._company(request)
        try:
            offset = max(0, int(request.query_params.get('offset', 0)))
        except (ValueError, TypeError):
            offset = 0
        try:
            limit = max(1, min(int(request.query_params.get('limit', 20)), 100))
        except (ValueError, TypeError):
            limit = 20

        service = self.service_class()
        rows, count = service.list_for_company(company=company, limit=limit, offset=offset)
        return paginated_response(
            message=f'{self.label}s fetched successfully.',
            results=self.read_serializer_class(rows, many=True).data,
            count=count,
            request=request,
            offset=offset,
            limit=limit,
        )

    @action(detail=False, methods=['get'], url_path='next-id')
    def next_id(self, request):
        service = self.service_class()
        return success_response(
            message='Next ID generated.',
            data={'next_id': service.next_code(company=self._company(request))},
        )
    
    def retrieve(self, request, pk=None):
        company = self._company(request)
        service = self.service_class()
        role = service.get_for_company(company=company, pk=pk)
        if not role:
            return Response({'detail': f'{self.label} not found.'}, status=status.HTTP_404_NOT_FOUND)
        return success_response(
            message=f'{self.label} fetched successfully.',
            data=self.read_serializer_class(role).data,
        )

    def create(self, request):
        company = self._company(request)
        serializer = self.write_serializer_class(data=request.data, context={'company': company})
        serializer.is_valid(raise_exception=True)
        service = self.service_class()
        role = service.create(company=company, data=serializer.validated_data)
        return success_response(
            message=f'{self.label} created successfully.',
            data=self.read_serializer_class(role).data,
            status_code=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, pk=None):
        company = self._company(request)
        service = self.service_class()
        role = service.get_for_company(company=company, pk=pk)
        if not role:
            return Response({'detail': f'{self.label} not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.write_serializer_class(data=request.data, context={'company': company}, partial=True)
        serializer.is_valid(raise_exception=True)
        role = service.update(company=company, role=role, data=serializer.validated_data)
        return success_response(
            message=f'{self.label} updated successfully.',
            data=self.read_serializer_class(role).data,
        )
        
    def _change_status(self, request, pk, new_status, verb):
        service = self.service_class()
        role = service.get_for_company(company=self._company(request), pk=pk)
        if not role:
            return Response({'detail': f'{self.label} not found.'}, status=status.HTTP_404_NOT_FOUND)
        role = service.set_status(role=role, status=new_status)
        return success_response(
        message=f'{self.label} {verb} successfully.',
        data=self.read_serializer_class(role).data,
    )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        return self._change_status(request, pk, 'ACTIVE', 'activated')

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        return self._change_status(request, pk, 'INACTIVE', 'deactivated')

    def destroy(self, request, pk=None):
        service = self.service_class()
        role = service.get_for_company(company=self._company(request), pk=pk)
        if not role:
            return Response({'detail': f'{self.label} not found.'}, status=status.HTTP_404_NOT_FOUND)
        service.delete(role=role)
        return success_response(message=f'{self.label} deleted successfully.')


class CustomerViewSet(_ContactViewSet):
    service_class = CustomerService
    read_serializer_class = CustomerReadSerializer
    write_serializer_class = CustomerWriteSerializer
    label = "Customer"


class VendorViewSet(_ContactViewSet):
    service_class = VendorService
    read_serializer_class = VendorReadSerializer
    write_serializer_class = VendorWriteSerializer
    label = "Vendor"


class PartnerViewSet(_ContactViewSet):
    service_class = PartnerService
    read_serializer_class = PartnerReadSerializer
    write_serializer_class = PartnerWriteSerializer
    label = "Partner"