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

export default function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [view, setView] = useState('table')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [menu, setMenu] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [notice, setNotice] = useState(null)

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await clientApi.listCustomers({ limit: 100 })
      const list = data?.results ?? data ?? []
      setCustomers(list)
    } catch (err) {
      setError(err.payload?.message || err.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter, categoryFilter])

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

  const openMenu = (e, customer) => {
    const r = e.currentTarget.getBoundingClientRect()
    const openUp = r.bottom + 240 > window.innerHeight
    setMenu((m) =>
      m?.customer.id === customer.id
        ? null
        : { customer, top: openUp ? r.top - 236 : r.bottom + 4, left: Math.max(8, r.right - 224) }
    )
  }

  const runAction = async (action, successText) => {
    try {
      await action()
      setNotice({ type: 'success', text: successText })
      await loadCustomers()
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.payload?.message || err.payload?.detail || err.message || 'Action failed',
      })
    }
  }

  const handleToggleStatus = (c) => {
    const inactive = c.status === 'INACTIVE'
    runAction(
      () => (inactive ? clientApi.activateCustomer(c.id) : clientApi.deactivateCustomer(c.id)),
      `${c.company_name} ${inactive ? 'activated' : 'deactivated'}.`
    )
  }

  const handleDuplicate = (c) =>
    runAction(
      () =>
        clientApi.createCustomer({
          customer_id: `${c.customer_id}-COPY`,
          status: c.status,
          company_name: `${c.company_name} (Copy)`,
          sales_rep_id: c.sales_rep_id || null,
          category: c.category || '',
          credit_limit: c.credit_limit ?? null,
          payment_terms: c.payment_terms || '',
          primary_contact_name: c.primary_contact_name,
          job_title: c.job_title || '',
          phone: c.phone,
          alt_phone: c.alt_phone || '',
          email: c.email,
          fax: c.fax || '',
          address_type: c.address_type || 'Office',
          address_line1: c.address_line1,
          address_line2: c.address_line2 || '',
          city: c.city,
          state_province: c.state_province,
          country: c.country,
          zip_code: c.zip_code,
          is_primary_address: !!c.is_primary_address,
          notes: c.notes || '',
        }),
      `${c.company_name} duplicated.`
    )

  const handleConfirmDelete = () => {
    const c = confirmDelete
    setConfirmDelete(null)
    runAction(() => clientApi.deleteCustomer(c.id), `${c.company_name} deleted.`)
  }

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return customers.filter((c) => {
      const searchable = [
        c.company_name, c.customer_id, c.primary_contact_name, c.email, c.phone,
        c.city, c.country, c.category, c.sales_rep_name,
      ].filter(Boolean).join(' ').toLowerCase()

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === 'ALL' || c.status === statusFilter) &&
        (categoryFilter === 'ALL' || c.category === categoryFilter)
      )
    })
  }, [customers, searchTerm, statusFilter, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const showStart = filtered.length ? (safePage - 1) * pageSize + 1 : 0
  const showEnd = Math.min(safePage * pageSize, filtered.length)

  return (
    <ClientLayout title="Customers" breadcrumb="Customers">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
              Customers
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              Manage your customer relationships, contacts, and account details.
            </p>
          </div>
          <Button intent="primary" onClick={() => navigate('/app/customers/new')}>
            + Add Customer
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

        <Card className="p-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                type="search"
                aria-label="Search customers"
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
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="ALL">All categories</option>
              <option value="Enterprise">Enterprise</option>
              <option value="SMB">SMB</option>
              <option value="Government">Government</option>
              <option value="Individual">Individual</option>
              <option value="Non-Profit">Non-Profit</option>
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

        <Card className="overflow-hidden">

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={loadCustomers} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={customers.length === 0 ? 'No customers yet' : 'No customers match your search'}
              description={
                customers.length === 0
                  ? 'Add your first customer to get started.'
                  : 'Try a different search or filter.'
              }
              action={customers.length === 0 ? () => navigate('/app/customers/new') : undefined}
              actionLabel={customers.length === 0 ? '+ Add Customer' : undefined}
            />
          ) : view === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[var(--color-primary-soft)]">
                  <tr className="border-b border-[var(--color-primary)]/15 text-[11px] uppercase tracking-wider text-[var(--color-primary-dark)]">
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Primary Contact</th>
                    <th className="px-5 py-3 font-semibold">Phone</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Sales Representative</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-canvas)]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary-dark)]">
                            {(customer.company_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--color-ink)]">{customer.company_name || '—'}</p>
                            <p className="font-mono text-xs text-[var(--color-muted)]">{customer.customer_id || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[var(--color-ink)]">{customer.primary_contact_name || '—'}</p>
                        <p className="text-xs text-[var(--color-muted)]">{customer.email || ''}</p>
                      </td>
                      <td className="px-5 py-4 text-[var(--color-ink-soft)]">{customer.phone || '—'}</td>
                      <td className="px-5 py-4 text-[var(--color-ink-soft)]">
                        {[customer.city, customer.country].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-5 py-4">
                        {customer.category ? (
                          <span className="inline-flex rounded-md border border-[var(--color-border)] bg-white px-2 py-0.5 text-xs font-medium text-[var(--color-ink-soft)]">
                            {customer.category}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        {customer.sales_rep_name ? (
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] font-semibold text-white">
                              {customer.sales_rep_name.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-[var(--color-ink-soft)]">{customer.sales_rep_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-muted)]">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={STATUS_BADGE_TONE[customer.status] || 'neutral'}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {customer.status
                            ? customer.status.charAt(0) + customer.status.slice(1).toLowerCase()
                            : '—'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-label={`Actions for ${customer.company_name}`}
                          onClick={(e) => { e.stopPropagation(); openMenu(e, customer) }}
                          className="rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                        >
                          <Icon name="more" className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((customer) => (
                <article key={customer.id} className="rounded-xl border border-[var(--color-border)] p-4 transition-colors hover:border-[var(--color-primary)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-[var(--color-ink)]">{customer.company_name || '—'}</h3>
                      <p className="text-xs text-[var(--color-muted)]">{customer.customer_id || '—'}</p>
                    </div>
                    <Badge tone={STATUS_BADGE_TONE[customer.status] || 'neutral'}>
                      {customer.status ? customer.status.charAt(0) + customer.status.slice(1).toLowerCase() : '—'}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-[var(--color-muted)]">Contact</span><span className="text-right text-[var(--color-ink-soft)]">{customer.primary_contact_name || '—'}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-[var(--color-muted)]">Phone</span><span className="text-right text-[var(--color-ink-soft)]">{customer.phone || '—'}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-[var(--color-muted)]">Location</span><span className="text-right text-[var(--color-ink-soft)]">{[customer.city, customer.country].filter(Boolean).join(', ') || '—'}</span></div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
              <span>Showing {showStart}–{showEnd} of {filtered.length} customers</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 disabled:opacity-40">‹</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
                  <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`min-w-8 rounded-md px-2.5 py-1.5 ${pageNumber === safePage ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] hover:bg-[var(--color-canvas)]'}`}>
                    {pageNumber}
                  </button>
                ))}
                <button type="button" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 disabled:opacity-40">›</button>
              </div>
            </div>
          )}
        </Card>
      </div>
      {menu && (
        <div
          role="menu"
          style={{ position: 'fixed', top: menu.top, left: menu.left }}
          className="z-50 w-56 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg"
        >
          {[
            ['eye', 'View Customer', () => { }],
            ['edit', 'Edit Customer', () => { }],
            ...(menu.customer.customer_id?.endsWith('-COPY')
              ? []
              : [['copy', 'Duplicate Customer', () => handleDuplicate(menu.customer)]]),
          ].map(([icon, label, onClick]) => (
            <button key={label} type="button" role="menuitem" onClick={onClick}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-canvas)]">
              <Icon name={icon} className="h-4 w-4 text-[var(--color-muted)]" />
              {label}
            </button>
          ))}
          <div className="my-1 border-t border-[var(--color-border)]" />
          <button type="button" role="menuitem" onClick={() => handleToggleStatus(menu.customer)}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-canvas)]">
            <Icon name={menu.customer.status === 'INACTIVE' ? 'play' : 'pause'} className="h-4 w-4 text-[var(--color-muted)]" />
            {menu.customer.status === 'INACTIVE' ? 'Activate Customer' : 'Deactivate Customer'}
          </button>
          <div className="my-1 border-t border-[var(--color-border)]" />
          <button type="button" role="menuitem" onClick={() => setConfirmDelete(menu.customer)}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-negative)] hover:bg-[var(--color-negative-soft)]">
            <Icon name="trash" className="h-4 w-4" />
            Delete Customer
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">Delete customer?</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              “{confirmDelete.company_name}” will be removed from your customers list.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDelete}
                className="rounded-lg bg-[var(--color-negative)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  )
}
