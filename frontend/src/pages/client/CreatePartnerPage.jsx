import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClientLayout from '../../components/layout/ClientLayout.jsx'
import Card from '../../components/ui/Card.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import Toast, { useToast } from '../../components/ui/Toast.jsx'
import {
  COUNTRY_OPTIONS,
  validateEmail,
  validateName,
} from '../../utils/formValidation.js'

import { clientApi } from '../../services/client.js'

const PARTNER_LEVELS = [
  'Strategic',
  'Preferred',
  'Standard',
  'Registered',
]

const STATUS_OPTIONS = [
  'Active',
  'Inactive',
  'Prospect',
]

const GST_TYPES = [
  'Regular',
  'Composition',
  'Unregistered',
  'SEZ',
]

const CURRENCIES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
]

const ADDRESS_TYPES = [
  'Office',
  'Billing',
  'Shipping',
  'Home',
]

const EMPTY_FORM = {
  partner_level: '',
  status: 'Active',

  company_name: '',
  subpartner_of: '',
  partner_code: '',
  gst_type: '',

  pan: '',
  company_registration_no: '',
  currency: 'INR',

  primary_contact_name: '',
  phone: '',
  job_title: '',
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
  is_primary_address: true,

  additional_notes: '',
}

const ICONS = {
  basic: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M4 21h16M6 21V7l6-4 6 4v14M9 21v-5h6v5M9 10h1M14 10h1M9 13h1M14 13h1" />
    </svg>
  ),

  phone: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),

  pin: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),

  doc: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),

  back: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
}

function SectionHeading({ icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-[var(--color-ink-soft)]">
        {icon}
      </span>

      <h2 className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
        {title}
      </h2>
    </div>
  )
}

export default function CreatePartnerPage() {
  const navigate = useNavigate()
  const {
    toasts,
    addToast,
    removeToast,
  } = useToast()

  const [form, setForm] = useState(EMPTY_FORM)

  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})

  const [submitting, setSubmitting] = useState(false)
  const [parentCandidates, setParentCandidates] = useState([])
  const [nextId, setNextId] = useState('')

  useEffect(() => {
    clientApi
      .listPartners({ limit: 200 })
      .then((data) => {
        const list = data?.results ?? data ?? []

        setParentCandidates(
          Array.isArray(list) ? list : [],
        )
      })
      .catch(() => {
        setParentCandidates([])
      })

    clientApi.getNextPartnerId().then((d) => setNextId(d?.next_id || '')).catch(() => setNextId(''))
  }, [])

  const update = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))

    setTouched((previous) => ({
      ...previous,
      [field]: true,
    }))
  }

  const validate = () => {
    const errors = {

      company_name: form.company_name.trim()
    ? ''
    : 'Partner name is required.',

      partner_level: form.partner_level
        ? ''
        : 'Please select a partner level.',

      partner_code: '',

      primary_contact_name:
        validateName(
          form.primary_contact_name,
          'Primary contact name',
        ),

      phone: form.phone.trim()
        ? ''
        : 'Phone is required.',

      email: validateEmail(form.email),

      address_line1: form.address_line1.trim()
        ? ''
        : 'Address line 1 is required.',

      city: form.city.trim()
        ? ''
        : 'City is required.',

            gst_type: form.gst_type ? '' : 'Please select a GST type.',
      pan: form.pan.trim() ? '' : 'PAN is required.',
      currency: form.currency ? '' : 'Please select a currency.',

      country: form.country
        ? ''
        : 'Please select a country.',
    }

    setFieldErrors(errors)

    setTouched((previous) => ({
  ...previous,
  company_name: true,
  partner_level: true,
  partner_code: true,
      primary_contact_name: true,
      phone: true,
      email: true,
      address_line1: true,
      city: true,
            gst_type: true,
      pan: true,
      currency: true,
      country: true,
    }))

    return !Object.values(errors).some(Boolean)
  }

  const errorText = (field) =>
    touched[field] &&
    fieldErrors[field] ? (
      <p className="mt-1 text-xs text-[var(--color-negative)]">
        {fieldErrors[field]}
      </p>
    ) : null

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validate()) {
      addToast(
        'Please fix the highlighted fields',
        'error',
      )
      return
    }

    setSubmitting(true)

    try {
      await clientApi.createPartner({
        ...form,
        status: form.status.toUpperCase(),
      })

      addToast(
        'Partner created successfully',
        'success',
      )

      navigate('/app/partners')
    } catch (err) {
      addToast(
        err.payload?.message ||
          err.message ||
          'Failed to create partner',
        'error',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ClientLayout
      title="Create Partner"
      breadcrumb="Partners"
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 lg:px-10">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/app/partners')}
          className="flex w-fit items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          {ICONS.back}
          Partners
        </button>

        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
            Create Partner
          </h1>

          <p className="text-sm text-[var(--color-muted)]">
            Add a new partner to your system. Fill in the details below to create a partner record.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

                    <p className="mb-3 text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-negative)]">*</span> Required field
          </p>
          
          <Card className="p-6">

            {/* Basic Information */}
            <SectionHeading
              icon={ICONS.basic}
              title="Basic Information"
            />

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">

              <div>
                <Input
                  id="partnerId"
                  label="Partner ID"
                  placeholder={nextId ? `Auto: ${nextId}` : 'Auto-generated if left blank'}
                  value={form.partner_code}
                  onChange={(event) => update('partner_code', event.target.value)}
                />
                <p className="mt-1 text-xs text-[var(--color-muted)]">Leave blank to auto-generate.</p>
                {errorText('partner_code')}
              </div>

              <div>
  <Input
    id="partnerName"
    label="Partner Name"
    required
    placeholder="Enter partner name"
    value={form.company_name}
    onChange={(event) =>
      update(
        'company_name',
        event.target.value,
      )
    }
  />

  {errorText('company_name')}
</div>

              <div>
                <Select
                  id="partnerLevel"
                  label="Partner Level"
                  required
                  value={form.partner_level}
                  onChange={(event) =>
                    update(
                      'partner_level',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select partner level
                  </option>

                  {PARTNER_LEVELS.map(
                    (level) => (
                      <option
                        key={level}
                        value={level}
                      >
                        {level}
                      </option>
                    ),
                  )}
                </Select>

                {errorText('partner_level')}
              </div>

              <Select
                id="status"
                label="Status"
                required
                value={form.status}
                onChange={(event) =>
                  update(
                    'status',
                    event.target.value,
                  )
                }
              >
                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ),
                )}
              </Select>

              <Select
                id="subpartnerOf"
                label="Subpartner Of"
                optional
                value={form.subpartner_of}
                onChange={(event) =>
                  update(
                    'subpartner_of',
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select subpartner
                </option>

                {parentCandidates.map(
                  (partner) => (
                    <option
                      key={
                        partner.id ||
                        partner.partner_code
                      }
                      value={
                        partner.id ||
                        partner.partner_code
                      }
                    >
                      {partner.company_name ||
                        partner.partner_name ||
                        partner.name ||
                        partner.partner_code}
                    </option>
                  ),
                )}
              </Select>



              <Select
                id="gstType"
                label="GST Type"
                required
error={touched.gst_type && fieldErrors.gst_type}
                value={form.gst_type}
                onChange={(event) =>
                  update(
                    'gst_type',
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select GST type
                </option>

                {GST_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  ),
                )}
              </Select>

              <Input
                id="pan"
                label="PAN"
                required
error={touched.pan && fieldErrors.pan}
                placeholder="e.g. ABCDE1234F"
                value={form.pan}
                onChange={(event) =>
                  update(
                    'pan',
                    event.target.value.toUpperCase(),
                  )
                }
              />

              <Input
                id="companyRegistrationNo"
                label="Company Registration No."
                optional
                placeholder="e.g. 123456789012"
                value={
                  form.company_registration_no
                }
                onChange={(event) =>
                  update(
                    'company_registration_no',
                    event.target.value,
                  )
                }
              />

              <Select
                id="currency"
                label="Currency"
                required
error={touched.currency && fieldErrors.currency}
                value={form.currency}
                onChange={(event) =>
                  update(
                    'currency',
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select currency
                </option>

                {CURRENCIES.map(
                  (currency) => (
                    <option
                      key={currency}
                      value={currency}
                    >
                      {currency}
                    </option>
                  ),
                )}
              </Select>
            </div>

            <div className="my-6 border-t border-[var(--color-border)]" />

            {/* Contact Information */}
            <SectionHeading
              icon={ICONS.phone}
              title="Contact Information"
            />

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">

              <div>
                <Input
                  id="primaryContactName"
                  label="Primary Contact Name"
                  required
                  placeholder="Enter contact name"
                  value={
                    form.primary_contact_name
                  }
                  onChange={(event) =>
                    update(
                      'primary_contact_name',
                      event.target.value,
                    )
                  }
                />

                {errorText(
                  'primary_contact_name',
                )}
              </div>

              <div>
                <Input
                  id="phone"
                  label="Phone"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(event) =>
                    update(
                      'phone',
                      event.target.value,
                    )
                  }
                />

                {errorText('phone')}
              </div>

              <Input
                id="jobTitle"
                label="Job Title"
                optional
                placeholder="e.g. Business Development Manager"
                value={form.job_title}
                onChange={(event) =>
                  update(
                    'job_title',
                    event.target.value,
                  )
                }
              />

              <Input
                id="altPhone"
                label="Alt Phone"
                optional
                placeholder="e.g. +91 98765 43211"
                value={form.alt_phone}
                onChange={(event) =>
                  update(
                    'alt_phone',
                    event.target.value,
                  )
                }
              />

              <div>
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  required
                  placeholder="e.g. contact@partner.com"
                  value={form.email}
                  onChange={(event) =>
                    update(
                      'email',
                      event.target.value,
                    )
                  }
                />

                {errorText('email')}
              </div>

              <Input
                id="fax"
                label="Fax"
                optional
                placeholder="e.g. +91 141 2345678"
                value={form.fax}
                onChange={(event) =>
                  update(
                    'fax',
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="my-6 border-t border-[var(--color-border)]" />

            {/* Address */}
            <SectionHeading
              icon={ICONS.pin}
              title="Address"
            />

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">

              <Select
                id="addressType"
                label="Address Type"
                optional
                value={form.address_type}
                onChange={(event) =>
                  update(
                    'address_type',
                    event.target.value,
                  )
                }
              >
                {ADDRESS_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  ),
                )}
              </Select>

              <div>
                <Input
                  id="addressLine1"
                  label="Address Line 1"
                  required
                  placeholder="Street address"
                  value={form.address_line1}
                  onChange={(event) =>
                    update(
                      'address_line1',
                      event.target.value,
                    )
                  }
                />

                {errorText(
                  'address_line1',
                )}
              </div>

              <Input
                id="addressLine2"
                label="Address Line 2"
                optional
                placeholder="Apartment, suite, etc."
                value={form.address_line2}
                onChange={(event) =>
                  update(
                    'address_line2',
                    event.target.value,
                  )
                }
              />

              <div>
                <Input
                  id="city"
                  label="City"
                  required
                  placeholder="City"
                  value={form.city}
                  onChange={(event) =>
                    update(
                      'city',
                      event.target.value,
                    )
                  }
                />

                {errorText('city')}
              </div>

              <div>
                <Input
                  id="stateProvince"
                  label="State / Province"
                  optional
                  placeholder="State / Province"
                  value={form.state_province}
                  onChange={(event) =>
                    update(
                      'state_province',
                      event.target.value,
                    )
                  }
                />

                {errorText(
                  'state_province',
                )}
              </div>

              <div>
                <Select
                  id="country"
                  label="Country"
                  required
                  value={form.country}
                  onChange={(event) =>
                    update(
                      'country',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Select country
                  </option>

                  {COUNTRY_OPTIONS.map(
                    (country) => (
                      <option
                        key={country.value}
                        value={country.value}
                      >
                        {country.label}
                      </option>
                    ),
                  )}
                </Select>

                {errorText('country')}
              </div>

              <Input
                id="zipCode"
                label="ZIP / Postal Code"
                optional
                placeholder="ZIP / Postal Code"
                value={form.zip_code}
                onChange={(event) =>
                  update(
                    'zip_code',
                    event.target.value,
                  )
                }
              />

              <label className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  checked={
                    form.is_primary_address
                  }
                  onChange={(event) =>
                    update(
                      'is_primary_address',
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                />

                <span className="text-sm text-[var(--color-ink-soft)]">
                  Primary Address
                </span>
              </label>
            </div>

            <div className="my-6 border-t border-[var(--color-border)]" />

            {/* Additional Information */}
            <SectionHeading
              icon={ICONS.doc}
              title="Additional Information"
            />

            <textarea
              id="additionalNotes"
              rows={3}
              placeholder="Comments / Notes about this partner..."
              value={form.additional_notes}
              onChange={(event) =>
                update(
                  'additional_notes',
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
            />

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2 border-t border-[var(--color-border)] pt-6">
              <Button
                type="button"
                intent="secondary"
                onClick={() =>
                  navigate('/app/partners')
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                intent="primary"
                isLoading={submitting}
              >
                Create Partner
              </Button>
            </div>
          </Card>
        </form>
      </div>

      <Toast
        toasts={toasts}
        removeToast={removeToast}
      />
    </ClientLayout>
  )
}