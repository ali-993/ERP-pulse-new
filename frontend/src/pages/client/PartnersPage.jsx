import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ClientLayout from '../../components/layout/ClientLayout.jsx'
import Card from '../../components/ui/Card.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import { clientApi } from '../../services/client.js'

const STATUS_BADGE_TONE = {
  ACTIVE: 'positive',
  INACTIVE: 'neutral',
  PROSPECT: 'netsuite',
}

const pageSize = 10

const formatLabel = (value) => {
  if (!value) return '—'

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const getName = (partner) =>
  partner.company_name ||
  partner.partner_name ||
  partner.name ||
  '—'

const getCode = (partner) =>
  partner.partner_code ||
  partner.partner_id ||
  '—'

const getContact = (partner) =>
  partner.primary_contact_name ||
  partner.contact_name ||
  '—'

const getLocation = (partner) =>
  [partner.city, partner.country].filter(Boolean).join(', ') || '—'


function Icon({ name, className = 'h-4 w-4' }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    className,
    'aria-hidden': true,
  }

  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 9v11M16 9v11" /></>,
    card: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h.01M11 8h.01M15 8h.01M7 13h10M7 17h6" /></>,
    more: <><circle cx="12" cy="5" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="19" r="1.4" fill="currentColor" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
    pause: <path d="M9 5v14M15 5v14" />,
    play: <path d="m7 4 13 8-13 8Z" />,
    trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="m6 7 1 13h10l1-13M9 7V4h6v3" /></>,
  }

  return <svg {...common}>{paths[name]}</svg>
}


export default function PartnersPage() {
  const navigate = useNavigate()

  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [levelFilter, setLevelFilter] = useState('ALL')

  const [view, setView] = useState('table')
  const [page, setPage] = useState(1)
  const [menu, setMenu] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [notice, setNotice] = useState(null)

  const loadPartners = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await clientApi.listPartners({ limit: 100 })
      const list = data?.results ?? data ?? []

      setPartners(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(
        err.payload?.message ||
        err.message ||
        'Failed to load partners',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPartners()
  }, [loadPartners])

  const filteredPartners = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return partners.filter((partner) => {
      const searchableText = [
        getName(partner),
        getCode(partner),
        getContact(partner),
        partner.email,
        partner.phone,
        partner.city,
        partner.country,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query || searchableText.includes(query)

      const partnerStatus =
        String(partner.status || '').toUpperCase()

      const matchesStatus =
        statusFilter === 'ALL' ||
        partnerStatus === statusFilter

      const matchesLevel =
        levelFilter === 'ALL' ||
        partner.partner_level === levelFilter

      return matchesSearch && matchesStatus && matchesLevel
    })
  }, [
    partners,
    searchTerm,
    statusFilter,
    levelFilter,
  ])

  useEffect(() => {
    setPage(1)
  }, [
    searchTerm,
    statusFilter,
    levelFilter,
  ])

  useEffect(() => {
    if (!menu) return

    const close = () => setMenu(null)
    const onKey = (e) => e.key === 'Escape' && close()

    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  useEffect(() => {
    if (!notice) return

    const t = setTimeout(() => setNotice(null), 4000)

    return () => clearTimeout(t)
  }, [notice])

  const openMenu = (e, partner) => {
    const r = e.currentTarget.getBoundingClientRect()
    const openUp = r.bottom + 240 > window.innerHeight

    setMenu((m) =>
      m?.partner.id === partner.id
        ? null
        : {
          partner,
          top: openUp ? r.top - 236 : r.bottom + 4,
          left: Math.max(8, r.right - 224),
        }
    )
  }

  const runAction = async (action, successText) => {
    try {
      await action()

      setNotice({
        type: 'success',
        text: successText,
      })

      await loadPartners()
    } catch (err) {
      setNotice({
        type: 'error',
        text:
          err.payload?.message ||
          err.payload?.detail ||
          err.message ||
          'Action failed',
      })
    }
  }

  const handleToggleStatus = (partner) => {
    const inactive = partner.status === 'INACTIVE'

    runAction(
      () =>
        inactive
          ? clientApi.activatePartner(partner.id)
          : clientApi.deactivatePartner(partner.id),
      `${getName(partner)} ${inactive ? 'activated' : 'deactivated'}.`
    )
  }

  const handleDuplicate = (partner) =>
    runAction(
      () =>
        clientApi.createPartner({
          partner_id: `${getCode(partner)}-COPY`,
          status: partner.status,
          company_name: `${getName(partner)} (Copy)`,
          partner_level: partner.partner_level || '',
          primary_contact_name: partner.primary_contact_name || partner.contact_name || '',
          job_title: partner.job_title || '',
          phone: partner.phone || '',
          alt_phone: partner.alt_phone || '',
          email: partner.email || '',
          fax: partner.fax || '',
          address_type: partner.address_type || 'Office',
          address_line1: partner.address_line1 || '',
          address_line2: partner.address_line2 || '',
          city: partner.city || '',
          state_province: partner.state_province || '',
          country: partner.country || '',
          zip_code: partner.zip_code || '',
          is_primary_address: !!partner.is_primary_address,
          notes: partner.notes || '',
        }),
      `${getName(partner)} duplicated.`
    )

  const handleConfirmDelete = () => {
    const partner = confirmDelete

    setConfirmDelete(null)

    runAction(
      () => clientApi.deletePartner(partner.id),
      `${getName(partner)} deleted.`
    )
  }

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPartners.length / pageSize),
  )

  const currentPage = Math.min(page, totalPages)

  const visiblePartners = filteredPartners.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  return (
    <ClientLayout
      title="Partners"
      breadcrumb="Partners"
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 lg:px-10">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
              Partners
            </h1>

            <p className="text-sm text-[var(--color-muted)]">
              Manage your partner relationships, contacts, and account details.
            </p>
          </div>

          <Button
            intent="primary"
            onClick={() => navigate('/app/partners/new')}
          >
            + Add Partner
          </Button>
        </div>

        {notice && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${notice.type === 'success'
                ? 'border-[var(--color-positive)]/30 bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
                : 'border-[var(--color-negative)]/30 bg-[var(--color-negative-soft)] text-[var(--color-negative)]'
              }`}
          >
            {notice.text}
          </div>
        )}

        {/* Filters */}
        <Card className="p-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">

            <div className="relative min-w-0 flex-1">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
              />

              <input
                type="search"
                aria-label="Search partners"
                placeholder="Search by name, ID, contact, phone, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-white pl-9 pr-3 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
              />
            </div>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PROSPECT">Prospect</option>
            </select>

            <select
              aria-label="Filter by partner level"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="ALL">All Partners</option>
              <option value="Strategic">Strategic</option>
              <option value="Preferred">Preferred</option>
              <option value="Standard">Standard</option>
              <option value="Registered">Registered</option>
            </select>

            <div className="flex h-10 rounded-lg border border-[var(--color-border)] bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView('table')}
                aria-label="Table view"
                className={`flex items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${view === 'table'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]'
                  }`}
              >
                <Icon name="table" className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </button>

              <button
                type="button"
                onClick={() => setView('card')}
                aria-label="Card view"
                className={`flex items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors ${view === 'card'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]'
                  }`}
              >
                <Icon name="card" className="h-4 w-4" />
                <span className="hidden sm:inline">Card</span>
              </button>
            </div>

          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <Card className="p-5">
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-12 w-full"
                />
              ))}
            </div>
          </Card>
        ) : error ? (
          <Card className="p-6">
            <ErrorState
              message={error}
              onRetry={loadPartners}
            />
          </Card>
        ) : filteredPartners.length === 0 ? (
          <EmptyState
            title={
              partners.length === 0
                ? 'No partners yet'
                : 'No partners match your filters'
            }
            description={
              partners.length === 0
                ? 'Start building your partner network by adding your first partner.'
                : 'Try changing your search or filters.'
            }
            action={
              partners.length === 0
                ? () => navigate('/app/partners/new')
                : undefined
            }
            actionLabel={
              partners.length === 0
                ? '+ Add Partner'
                : undefined
            }
          />
        ) : view === 'table' ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[var(--color-primary-soft)]">
                  <tr className="border-b border-[var(--color-primary)]/15 text-[11px] uppercase tracking-wider text-[var(--color-primary-dark)]">

                    <th className="px-5 py-3 font-semibold">
                      Partner
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Primary Contact
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Phone
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Partner Level
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Subpartner Of
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      PAN
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-3">
                      <span className="sr-only">Actions</span>
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {visiblePartners.map((partner) => {
                    const name = getName(partner)
                    const status = String(
                      partner.status || '',
                    ).toUpperCase()

                    return (
                      <tr
                        key={partner.id}
                        className="border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-canvas)]"
                      >

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary-dark)]">
                              {(name || '?').charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium text-[var(--color-ink)]">
                                {name}
                              </p>

                              <p className="font-mono text-xs text-[var(--color-muted)]">
                                {getCode(partner)}
                              </p>
                            </div>

                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-[var(--color-ink)]">
                            {getContact(partner)}
                          </p>

                          <p className="text-xs text-[var(--color-muted)]">
                            {partner.email || ''}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-[var(--color-ink-soft)]">
                          {partner.phone || '—'}
                        </td>

                        <td className="px-5 py-4">
                          {partner.partner_level ? (
                            <span className="inline-flex rounded-md border border-[var(--color-border)] bg-white px-2 py-0.5 text-xs font-medium text-[var(--color-ink-soft)]">
                              {partner.partner_level}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-5 py-4 text-[var(--color-ink-soft)]">
  {partner.subpartner_of || '—'}
</td>

<td className="px-5 py-4 font-mono text-xs text-[var(--color-ink-soft)]">
  {partner.pan || '—'}
</td>

                        <td className="px-5 py-4">
                          <Badge
                            tone={
                              STATUS_BADGE_TONE[status] ||
                              'neutral'
                            }
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />

                            {partner.status
                              ? partner.status.charAt(0) +
                              partner.status.slice(1).toLowerCase()
                              : '—'}
                          </Badge>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-label={`Actions for ${name}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              openMenu(e, partner)
                            }}
                            className="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                          >
                            <Icon name="more" className="h-4 w-4" />
                          </button>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {!loading && !error && filteredPartners.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">

                <span>
                  Showing{' '}
                  {(currentPage - 1) * pageSize + 1}
                  –
                  {Math.min(
                    currentPage * pageSize,
                    filteredPartners.length,
                  )}{' '}
                  of {filteredPartners.length} partners
                </span>

                <div className="flex items-center gap-1">

                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setPage((p) => Math.max(1, p - 1))
                    }
                    className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 disabled:opacity-40"
                  >
                    ‹
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  )
                    .slice(0, 5)
                    .map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`min-w-8 rounded-md px-2.5 py-1.5 ${pageNumber === currentPage
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'border border-[var(--color-border)] hover:bg-[var(--color-canvas)]'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((p) =>
                        Math.min(totalPages, p + 1),
                      )
                    }
                    className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 disabled:opacity-40"
                  >
                    ›
                  </button>

                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visiblePartners.map((partner) => {
              const name = getName(partner)

              return (
                <Card
                  key={
                    partner.id ||
                    partner.partner_code ||
                    partner.partner_id
                  }
                  className="p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
                        {name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join('')
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="font-medium text-[var(--color-ink)]">
                          {name}
                        </p>

                        <p className="text-xs text-[var(--color-muted)]">
                          {getCode(partner)}
                        </p>
                      </div>
                    </div>

                    <Icon name="more" className="h-4 w-4" />
                  </div>

                  <div className="mt-4 flex items-center justify-between">

                    <Badge
                      tone={
                        STATUS_BADGE_TONE[
                        String(
                          partner.status || '',
                        ).toUpperCase()
                        ] || 'neutral'
                      }
                    >
                      {formatLabel(partner.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="text-[var(--color-ink-soft)]">
                      {getContact(partner)}
                    </p>

                    <p className="text-[var(--color-muted)]">
                      {partner.email || '—'}
                    </p>

                    <p className="text-[var(--color-muted)]">
                      {partner.phone || '—'}
                    </p>

                    <p className="text-[var(--color-muted)]">
                      {getLocation(partner)}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      {menu && (
        <div
          role="menu"
          style={{
            position: 'fixed',
            top: menu.top,
            left: menu.left,
          }}
          className="z-50 w-56 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg"
        >
          {[
            ['eye', 'View Partner', () => { }],
            ['edit', 'Edit Partner', () => { }],
            ...(getCode(menu.partner)?.endsWith('-COPY')
              ? []
              : [
                [
                  'copy',
                  'Duplicate Partner',
                  () => handleDuplicate(menu.partner),
                ],
              ]),
          ].map(([icon, label, onClick]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={onClick}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
            >
              <Icon
                name={icon}
                className="h-4 w-4 text-[var(--color-muted)]"
              />
              {label}
            </button>
          ))}

          <div className="my-1 border-t border-[var(--color-border)]" />

          <button
            type="button"
            role="menuitem"
            onClick={() => handleToggleStatus(menu.partner)}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-canvas)]"
          >
            <Icon
              name={
                menu.partner.status === 'INACTIVE'
                  ? 'play'
                  : 'pause'
              }
              className="h-4 w-4 text-[var(--color-muted)]"
            />

            {menu.partner.status === 'INACTIVE'
              ? 'Activate Partner'
              : 'Deactivate Partner'}
          </button>

          <div className="my-1 border-t border-[var(--color-border)]" />

          <button
            type="button"
            role="menuitem"
            onClick={() => setConfirmDelete(menu.partner)}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-negative)] hover:bg-[var(--color-negative-soft)]"
          >
            <Icon name="trash" className="h-4 w-4" />
            Delete Partner
          </button>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              Delete partner?
            </h3>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              “{getName(confirmDelete)}” will be removed from your partners list.
            </p>

            <div className="mt-6 flex justify-end gap-2">

              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-[var(--color-negative)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Delete
              </button>

            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  )
}