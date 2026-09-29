import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClientLayout from '../../components/layout/ClientLayout.jsx'
import Card from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Toast, { useToast } from '../../components/ui/Toast.jsx'
import { clientApi } from '../../services/client.js'
import { COUNTRY_OPTIONS, validateEmail, validateName, validateCompanyText } from '../../utils/formValidation.js'


const STATUS_OPTIONS = ['Active', 'Inactive', 'Prospect']
const CATEGORY_OPTIONS = ['Materials', 'Services', 'Logistics', 'Professional Services', 'Other']
const GST_REGISTRATION_TYPES = ['Registered', 'Composition', 'Unregistered', 'Overseas']
const ADDRESS_TYPES = ['Office', 'Billing', 'Shipping', 'Home']

const EMPTY_FORM = {
  vendor_id: '',
  status: 'Active',
  company_name: '',
  parent_company_id: '',
  gst_registration_type: '',
  category: '',
  gstin: '',
  primary_contact_name: '',
  job_title: '',
  phone: '',
  alt_phone: '',
  email: '',
  fax: '',
  address_type: 'Office',
  address_line1: '',
  address_line2: '',
  city: '',
  state_province: '',
  country: '',
  zip_code: '',
  is_primary_address: false,
  notes: '',
}

const ICONS = {
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 8h4a2 2 0 0 1 2 2v11M9 7h2M9 11h2M9 15h2" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
}

function SectionHeading({ icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-[var(--color-ink-soft)]">{icon}</span>
      <h2 className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink)]">{title}</h2>
    </div>
  )
}

export default function CreateVendorPage() {
  const navigate = useNavigate()
  const { toasts, addToast, removeToast } = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [parentCandidates, setParentCandidates] = useState([])
  const [nextId, setNextId] = useState('')

  useEffect(() => {
    clientApi.listVendors({ limit: 200 })
      .then((data) => setParentCandidates(data?.results ?? data ?? []))
      .catch(() => setParentCandidates([]))

    clientApi.getNextVendorId().then((d) => setNextId(d?.next_id || '')).catch(() => setNextId(''))
  }, [])

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    setTouched((previous) => ({ ...previous, [field]: true }))
  }

  const validate = () => {
    const errors = {
      vendor_id: '',
      company_name: validateCompanyText(form.company_name, 'Company name'),
      primary_contact_name: validateName(form.primary_contact_name, 'Primary contact name'),
      phone: form.phone.trim() ? '' : 'Phone is required.',
      email: validateEmail(form.email),
      address_line1: form.address_line1.trim() ? '' : 'Address line 1 is required.',
      city: form.city.trim() ? '' : 'City is required.',
      country: form.country ? '' : 'Please select a country.',
      gst_registration_type: form.gst_registration_type ? '' : 'Please select a GST registration type.',
      gstin: form.gst_registration_type === 'Registered'
        ? (/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.gstin.trim()) ? '' : 'Enter a valid 15-character GSTIN.')
        : '',
    }

    setFieldErrors(errors)
    setTouched((previous) => ({
      ...previous,
      ...Object.fromEntries(Object.keys(errors).map((field) => [field, true])),
    }))

    return !Object.values(errors).some(Boolean)
  }

  const errorText = (field) => (
    touched[field] && fieldErrors[field]
      ? <p className="mt-1 text-xs text-[var(--color-negative)]">{fieldErrors[field]}</p>
      : null
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      addToast('Please fix the highlighted fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      await clientApi.createVendor({
        ...form,
        status: form.status.toUpperCase(),
      })
      addToast('Vendor created successfully', 'success')
      navigate('/app/vendors')
    } catch (err) {
      addToast(err.payload?.message || err.message || 'Failed to create vendor', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ClientLayout title="Create Vendor" breadcrumb="Vendors">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 lg:px-10">
        <button
          type="button"
          onClick={() => navigate('/app/vendors')}
          className="flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          {ICONS.back}
          Vendors
        </button>

        <div className="flex flex-col gap-1">
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">Create Vendor</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Add a new vendor to your system. Fill in the details below to create a vendor record.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

                    <p className="mb-3 text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-negative)]">*</span> Required field
          </p>
          
          <Card className="p-4 sm:p-6">
            <SectionHeading icon={ICONS.building} title="Basic Information" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <Input id="vendorId" label="Vendor ID" placeholder={nextId ? `Auto: ${nextId}` : 'Auto-generated if left blank'} value={form.vendor_id} onChange={(e) => update('vendor_id', e.target.value)} />
                <p className="mt-1 text-xs text-[var(--color-muted)]">Leave blank to auto-generate.</p>
                {errorText('vendor_id')}
              </div>

              <Select id="status" label="Status" required value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
              </Select>

              <div>
                <Input id="companyName" label="Company Name" required placeholder="Enter vendor company name" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} />
                {errorText('company_name')}
              </div>

              <Select id="parentCompany" label="Parent Company" optional value={form.parent_company_id} onChange={(e) => update('parent_company_id', e.target.value)}>
                <option value="">Select parent company</option>
                {parentCandidates.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.company_name}</option>)}
              </Select>

              <Select id="gstRegistrationType" label="GST Registration Type" required error={touched.gst_registration_type && fieldErrors.gst_registration_type} value={form.gst_registration_type} onChange={(e) => update('gst_registration_type', e.target.value)}>
                <option value="">Select GST registration type</option>
                {GST_REGISTRATION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>

              <Select id="category" label="Category" optional value={form.category} onChange={(e) => update('category', e.target.value)}>
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
              </Select>

              <Input id="gstin" label="GSTIN" required={form.gst_registration_type === 'Registered'} optional={form.gst_registration_type !== 'Registered'} error={touched.gstin && fieldErrors.gstin} placeholder="e.g. 27ABCDE1234F1Z5" value={form.gstin} onChange={(e) => update('gstin', e.target.value.toUpperCase())} />
            </div>

            <div className="my-6 border-t border-[var(--color-border)]" />

            <SectionHeading icon={ICONS.phone} title="Contact Information" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <Input id="primaryContactName" label="Primary Contact Name" required placeholder="Enter contact name" value={form.primary_contact_name} onChange={(e) => update('primary_contact_name', e.target.value)} />
                {errorText('primary_contact_name')}
              </div>
              <div>
                <Input id="phone" label="Phone" required placeholder="e.g. +91 98765 43210" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                {errorText('phone')}
              </div>
              <Input id="jobTitle" label="Job Title" optional placeholder="e.g. Purchase Manager" value={form.job_title} onChange={(e) => update('job_title', e.target.value)} />
              <Input id="altPhone" label="Alt Phone" optional placeholder="e.g. +91 98765 43211" value={form.alt_phone} onChange={(e) => update('alt_phone', e.target.value)} />
              <div>
                <Input id="email" label="Email" type="email" required placeholder="e.g. contact@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                {errorText('email')}
              </div>
              <Input id="fax" label="Fax" optional placeholder="e.g. +91 141 2345678" value={form.fax} onChange={(e) => update('fax', e.target.value)} />
            </div>

            <div className="my-6 border-t border-[var(--color-border)]" />

            <SectionHeading icon={ICONS.pin} title="Address" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Select id="addressType" label="Address Type" optional value={form.address_type} onChange={(e) => update('address_type', e.target.value)}>
                {ADDRESS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>
              <div>
                <Input id="addressLine1" label="Address Line 1" required placeholder="Street address" value={form.address_line1} onChange={(e) => update('address_line1', e.target.value)} />
                {errorText('address_line1')}
              </div>
              <Input id="addressLine2" label="Address Line 2" optional placeholder="Apartment, suite, etc." value={form.address_line2} onChange={(e) => update('address_line2', e.target.value)} />

              <div>
                <Input id="city" label="City" required placeholder="City" value={form.city} onChange={(e) => update('city', e.target.value)} />
                {errorText('city')}
              </div>
              <div>
                <Input id="stateProvince" label="State / Province" optional placeholder="State / Province" value={form.state_province} onChange={(e) => update('state_province', e.target.value)} />
                {errorText('state_province')}
              </div>
              <div>
                <Select id="country" label="Country" required value={form.country} onChange={(e) => update('country', e.target.value)}>
                  <option value="">Select country</option>
                  {COUNTRY_OPTIONS.map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}
                </Select>
                {errorText('country')}
              </div>

              <div>
                <Input id="zipCode" label="ZIP / Postal Code" optional placeholder="ZIP / Postal Code" value={form.zip_code} onChange={(e) => update('zip_code', e.target.value)} />
                {errorText('zip_code')}
              </div>
              <label className="flex items-center gap-2 pt-7">
                <input type="checkbox" checked={form.is_primary_address} onChange={(e) => update('is_primary_address', e.target.checked)} className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary-soft)]" />
                <span className="text-sm text-[var(--color-ink-soft)]">Primary Address</span>
              </label>
            </div>

            <div className="my-6 border-t border-[var(--color-border)]" />

            <SectionHeading icon={ICONS.doc} title="Additional Information" />
            <textarea
              id="notes"
              rows={4}
              placeholder="Comments / Notes about this vendor..."
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
            />

            <div className="mt-6 flex justify-end gap-2 border-t border-[var(--color-border)] pt-6">
              <Button type="button" intent="secondary" onClick={() => navigate('/app/vendors')}>Cancel</Button>
              <Button type="submit" intent="primary" isLoading={submitting}>Create Vendor</Button>
            </div>
          </Card>
        </form>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </ClientLayout>
  )
}
