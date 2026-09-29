import { useState, useEffect } from 'react'
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
const CATEGORY_OPTIONS = ['Enterprise', 'SMB', 'Government', 'Individual', 'Non-Profit']
const PAYMENT_TERMS_OPTIONS = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60']
const ADDRESS_TYPES = ['Office', 'Billing', 'Shipping', 'Home']

const EMPTY_FORM = {
  customer_id: '',
  status: 'Active',
  company_name: '',
  parent_company_id: '',
  sales_rep_id: '',
  category: '',
  credit_limit: '',
  payment_terms: '',
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

/** Small section heading used across the form — icon + title, matches the
 *  "Basic Information / Contact Information / Address / Additional
 *  Information" groupings in the design. */
function SectionHeading({ icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-[var(--color-ink-soft)]">{icon}</span>
      <h2 className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink)]">{title}</h2>
    </div>
  )
}

const ICONS = {
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
}

export default function CreateCustomerPage() {
  const navigate = useNavigate()
  const { toasts, addToast, removeToast } = useToast()

  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [employees, setEmployees] = useState([])
  const [parentCandidates, setParentCandidates] = useState([])
  const [nextId, setNextId] = useState('')

  // Sales Representative is sourced from the company's own employee list —
  // no separate "sales rep" model needed. Parent Company is sourced from
  // existing customer records of type CUSTOMER.
useEffect(() => {
  clientApi.listEmployees({ limit: 200 }).then((data) => {
    setEmployees(data?.results ?? data ?? [])
  }).catch(() => setEmployees([]))

  clientApi.listCustomers({ limit: 200 }).then((data) => {
    setParentCandidates(data?.results ?? data ?? [])
  }).catch(() => setParentCandidates([]))

  clientApi.getNextCustomerId().then((d) => setNextId(d?.next_id || '')).catch(() => setNextId(''))
}, [])

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const validate = () => {
    const errors = {
      customer_id: '',
      company_name: validateCompanyText(form.company_name, 'Company name'),
      primary_contact_name: validateName(form.primary_contact_name, 'Primary contact name'),
      phone: form.phone.trim() ? '' : 'Phone is required.',
      email: validateEmail(form.email),
      address_line1: form.address_line1.trim() ? '' : 'Address line 1 is required.',
      city: form.city.trim() ? '' : 'City is required.',
      country: form.country ? '' : 'Please select a country.',
    }
    setFieldErrors(errors)
    setTouched((prev) => ({
      ...prev,
      customer_id: true,
      company_name: true,
      primary_contact_name: true,
      phone: true,
      email: true,
      address_line1: true,
      city: true,
      country: true,
    }))
    return !Object.values(errors).some(Boolean)
  }

  const errorText = (field) => touched[field] && fieldErrors[field] ? (
    <p className="mt-1 text-xs text-[var(--color-negative)]">{fieldErrors[field]}</p>
  ) : null

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      addToast('Please fix the highlighted fields', 'error')
      return
    }
    setSubmitting(true)
    try {
      await clientApi.createCustomer({
        ...form,
        credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
        status: form.status.toUpperCase(),
      })
      addToast('Customer created successfully', 'success')
      navigate('/app/customers')
    } catch (err) {
      addToast(err.payload?.message || err.message || 'Failed to create customer', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ClientLayout title="Create Customer" breadcrumb="Customers">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 lg:px-10">
        <button
          onClick={() => navigate('/app/customers')}
          className="flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          {ICONS.back}
          Customers
        </button>

        <div className="flex flex-col gap-1">
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
            Create Customer
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Add a new customer to your system. Fill in the details below to create a customer record.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <p className="mb-3 text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-negative)]">*</span> Required field
          </p>
          <Card className="p-6">
            {/* ── Basic Information ─────────────────────────────── */}
            <SectionHeading icon={ICONS.users} title="Basic Information" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <Input
                  id="customerId"
                  label="Customer ID"
                  placeholder={nextId ? `Auto: ${nextId}` : 'Auto-generated if left blank'}
                  value={form.customer_id}
                  onChange={(e) => update('customer_id', e.target.value)}
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">Leave blank to auto-generate.</p>
                {errorText('customer_id')}
              </div>
              <Select
                id="status"
                label="Status"
                required
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>

              <div>
                <Input
                  id="companyName"
                  label="Company Name"
                  required
                  placeholder="Enter company or customer name"
                  value={form.company_name}
                  onChange={(e) => update('company_name', e.target.value)}
                />
                {errorText('company_name')}
              </div>
              <Select
                id="parentCompany"
                label="Parent Company"
                optional
                value={form.parent_company_id}
                onChange={(e) => update('parent_company_id', e.target.value)}
              >
                <option value="">Select parent company</option>
                {parentCandidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </Select>

              <Select
                id="salesRep"
                label="Sales Representative"
                optional
                value={form.sales_rep_id}
                onChange={(e) => update('sales_rep_id', e.target.value)}
              >
                <option value="">Select sales representative</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()}
                  </option>
                ))}
              </Select>

              <Select
                id="category"
                label="Category"
                optional
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Input
                id="creditLimit"
                label="Credit Limit"
                optional
                type="number"
                min="0"
                placeholder="e.g. 250000"
                value={form.credit_limit}
                onChange={(e) => update('credit_limit', e.target.value)}
              />

              <Select
                id="paymentTerms"
                label="Payment Terms"
                optional
                className="sm:col-start-2"
                value={form.payment_terms}
                onChange={(e) => update('payment_terms', e.target.value)}
              >
                <option value="">Select payment terms</option>
                {PAYMENT_TERMS_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>

            <div className="my-6 border-t border-[var(--color-border)]" />

            {/* ── Contact Information ───────────────────────────── */}
            <SectionHeading icon={ICONS.phone} title="Contact Information" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <Input
                  id="primaryContactName"
                  label="Primary Contact Name"
                  required
                  placeholder="Enter contact name"
                  value={form.primary_contact_name}
                  onChange={(e) => update('primary_contact_name', e.target.value)}
                />
                {errorText('primary_contact_name')}
              </div>
              <div>
                <Input
                  id="phone"
                  label="Phone"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
                {errorText('phone')}
              </div>

              <Input
                id="jobTitle"
                label="Job Title"
                optional
                placeholder="e.g. Sales Manager"
                value={form.job_title}
                onChange={(e) => update('job_title', e.target.value)}
              />
              <Input
                id="altPhone"
                label="Alt Phone"
                optional
                placeholder="e.g. +91 98765 43211"
                value={form.alt_phone}
                onChange={(e) => update('alt_phone', e.target.value)}
              />

              <div>
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  required
                  placeholder="e.g. contact@company.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
                {errorText('email')}
              </div>
              <Input
                id="fax"
                label="Fax"
                optional
                placeholder="e.g. +91 141 2345678"
                value={form.fax}
                onChange={(e) => update('fax', e.target.value)}
              />
            </div>

            <div className="my-6 border-t border-[var(--color-border)]" />

            {/* ── Address ────────────────────────────────────────── */}
            <SectionHeading icon={ICONS.pin} title="Address" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Select
                id="addressType"
                label="Address Type"
                optional
                value={form.address_type}
                onChange={(e) => update('address_type', e.target.value)}
              >
                {ADDRESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <div>
                <Input
                  id="addressLine1"
                  label="Address Line 1"
                  required
                  placeholder="Street address"
                  value={form.address_line1}
                  onChange={(e) => update('address_line1', e.target.value)}
                />
                {errorText('address_line1')}
              </div>
              <Input
                id="addressLine2"
                label="Address Line 2"
                optional
                placeholder="Apartment, suite, etc."
                value={form.address_line2}
                onChange={(e) => update('address_line2', e.target.value)}
              />

              <div>
                <Input
                  id="city"
                  label="City"
                  required
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                />
                {errorText('city')}
              </div>
              <div>
                <Input
                  id="stateProvince"
                  label="State / Province"
                  optional
                  value={form.state_province}
                  onChange={(e) => update('state_province', e.target.value)}
                />
                {errorText('state_province')}
              </div>
              <div>
                <Select
                  id="country"
                  label="Country"
                  required
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                >
                  <option value="">Select country</option>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
                {errorText('country')}
              </div>

              <div>
                <Input
                  id="zipCode"
                  label="ZIP / Postal Code"
                  optional
                  value={form.zip_code}
                  onChange={(e) => update('zip_code', e.target.value)}
                />
                {errorText('zip_code')}
              </div>
              <label className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  checked={form.is_primary_address}
                  onChange={(e) => update('is_primary_address', e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary-soft)]"
                />
                <span className="text-sm text-[var(--color-ink-soft)]">Primary Address</span>
              </label>
            </div>

            <div className="my-6 border-t border-[var(--color-border)]" />

            {/* ── Additional Information ────────────────────────── */}
            <SectionHeading icon={ICONS.doc} title="Additional Information" />
            <label className="flex flex-col gap-1.5" htmlFor="notes">
              <textarea
                id="notes"
                rows={4}
                placeholder="Comments / Notes about this customer..."
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                className="rounded-lg border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
              />
            </label>

            <div className="mt-6 flex justify-end gap-2 border-t border-[var(--color-border)] pt-6">
              <Button type="button" intent="secondary" onClick={() => navigate('/app/customers')}>
                Cancel
              </Button>
              <Button type="submit" intent="primary" isLoading={submitting}>
                Create Customer
              </Button>
            </div>
          </Card>
        </form>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </ClientLayout>
  )
}
