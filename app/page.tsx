'use client';

import { useEffect, useState } from 'react';

type Client = {
  id: number;
  name: string;
  email?: string | null;
  createdAt: string;
};

type Token = {
  id: number;
  clientId: number;
  platform: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

// Static placeholder data — Accounts not yet wired to API
const PLACEHOLDER_ACCOUNTS = [
  { name: 'Acme Corp — Google',  clientId: 'client_abc123', platform: 'Google',  externalId: '123-456-7890' },
  { name: 'Globex — Meta Ads',   clientId: 'client_xyz789', platform: 'Meta',    externalId: 'act_987654321' },
  { name: 'Initech — TikTok',    clientId: 'client_lmn456', platform: 'TikTok',  externalId: 'tt_acc_001122' },
];

const PLATFORM_LABELS: Record<string, string> = { GOOGLE: 'Google', META: 'Meta', TIKTOK: 'TikTok' };

function PlatformBadge({ platform }: { platform: string }) {
  const upper = platform.toUpperCase();
  const cls = upper === 'GOOGLE' ? 'badge-google' : upper === 'META' ? 'badge-meta' : 'badge-tiktok';
  const label = PLATFORM_LABELS[upper] ?? platform;
  return <span className={`table-platform-badge ${cls}`}>{label}</span>;
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleString();
}

function tokenStatus(expiresAt: string | null | undefined): { label: string; cls: string } {
  if (!expiresAt) return { label: 'No Expiry', cls: 'ok' };
  return new Date(expiresAt) > new Date()
    ? { label: 'Valid', cls: 'ok' }
    : { label: 'Expired', cls: 'warn' };
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Clients — real data
  const [clients, setClients]           = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError]   = useState<string | null>(null);

  // Add-client form state
  const [newName, setNewName]         = useState('');
  const [newEmail, setNewEmail]       = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Edit client state
  const [editingClient, setEditingClient]   = useState<Client | null>(null);
  const [editName, setEditName]             = useState('');
  const [editEmail, setEditEmail]           = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError]           = useState<string | null>(null);

  // Delete client state
  const [confirmDeleteId, setConfirmDeleteId]     = useState<number | null>(null);
  const [deleteInProgress, setDeleteInProgress]   = useState<number | null>(null);
  const [deleteError, setDeleteError]             = useState<string | null>(null);

  // Tokens — real data
  const [tokens, setTokens]               = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokensError, setTokensError]     = useState<string | null>(null);

  // Add-token form state
  const [tokenClientId, setTokenClientId]               = useState('');
  const [tokenPlatform, setTokenPlatform]               = useState('');
  const [tokenAccessToken, setTokenAccessToken]         = useState('');
  const [tokenRefreshToken, setTokenRefreshToken]       = useState('');
  const [tokenExpiresAt, setTokenExpiresAt]             = useState('');
  const [tokenSubmitting, setTokenSubmitting]           = useState(false);
  const [tokenSubmitError, setTokenSubmitError]         = useState<string | null>(null);
  const [tokenSubmitSuccess, setTokenSubmitSuccess]     = useState(false);

  // Edit token state
  const [editingToken, setEditingToken]                         = useState<Token | null>(null);
  const [editTokenAccessToken, setEditTokenAccessToken]         = useState('');
  const [editTokenRefreshToken, setEditTokenRefreshToken]       = useState('');
  const [editTokenExpiresAt, setEditTokenExpiresAt]             = useState('');
  const [editTokenSubmitting, setEditTokenSubmitting]           = useState(false);
  const [editTokenError, setEditTokenError]                     = useState<string | null>(null);

  // Delete token state
  const [confirmDeleteTokenId, setConfirmDeleteTokenId]     = useState<number | null>(null);
  const [deleteTokenInProgress, setDeleteTokenInProgress]   = useState<number | null>(null);
  const [deleteTokenError, setDeleteTokenError]             = useState<string | null>(null);

  useEffect(() => { fetchClients(); fetchTokens(); }, []);
      if (editingToken) { setEditingToken(null); setEditTokenError(null); return; }
      if (editingClient) { setEditingClient(null); setEditError(null); return; }
      if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = (menuOpen || !!editingClient || !!editingToken) ? 'hidden' : '';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen, editingClient, editingToken]);

  async function fetchClients() {
    setClientsLoading(true);
    setClientsError(null);
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to load clients');
      const json = await res.json();
      setClients(json.data);
    } catch {
      setClientsError('Could not load clients. Please try again.');
    } finally {
      setClientsLoading(false);
    }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create client');
      setSubmitSuccess(true);
      setNewName('');
      setNewEmail('');
      await fetchClients();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    setEditName(client.name);
    setEditEmail(client.email ?? '');
    setEditError(null);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingClient) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update client');
      setClients((prev) => prev.map((c) => (c.id === editingClient.id ? json.data : c)));
      setEditingClient(null);
      setEditError(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleteInProgress(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete client');
      setClients((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setDeleteInProgress(null);
    }
  }

  return (
    <>
      {/* ================================================================
          HEADER
      ================================================================ */}
      <header className="site-header" role="banner">
        <div className="container">
          <nav className="nav-inner" aria-label="Main navigation">
            <a href="#" className="nav-logo" aria-label="AdPlatform — home">
              <div className="logo-icon" aria-hidden="true">A</div>
              AdPlatform
            </a>

            <ul className="nav-links" role="list">
              <li><a href="#status" className="active">Dashboard</a></li>
              <li><a href="#tokens">Tokens</a></li>
              <li><a href="#accounts">Accounts</a></li>
              <li><a href="#clients">Clients</a></li>
              <li><a href="#coming-soon">Roadmap</a></li>
            </ul>

            <div className="nav-actions">
              <a href="#tokens" className="btn btn-primary">Connect Account</a>
            </div>

            <button
              className="nav-hamburger"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobileNav"
              onClick={() => setMenuOpen(true)}
            >
              <span /><span /><span />
            </button>
          </nav>
        </div>
      </header>

      {/* ================================================================
          MOBILE NAV OVERLAY
      ================================================================ */}
      <div
        id="mobileNav"
        className={`mobile-nav${menuOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{ display: menuOpen ? 'block' : 'none' }}
        onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}
      >
        <div className="mobile-nav-panel">
          <div className="mobile-nav-close">
            <button className="btn btn-ghost" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)}>
              ✕ Close
            </button>
          </div>
          <ul className="mobile-nav-links" role="list">
            <li><a href="#status"      onClick={() => setMenuOpen(false)}>Dashboard</a></li>
            <li><a href="#tokens"      onClick={() => setMenuOpen(false)}>Tokens</a></li>
            <li><a href="#accounts"    onClick={() => setMenuOpen(false)}>Accounts</a></li>
            <li><a href="#clients"     onClick={() => setMenuOpen(false)}>Clients</a></li>
            <li><a href="#coming-soon" onClick={() => setMenuOpen(false)}>Roadmap</a></li>
          </ul>
          <a
            href="#tokens"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => setMenuOpen(false)}
          >
            Connect Account
          </a>
        </div>
      </div>

      <main>
        {/* ================================================================
            HERO
        ================================================================ */}
        <section className="hero" aria-labelledby="heroHeading">
          <div className="container">
            <div className="hero-badge" aria-label="Platform status: API is live">
              <span className="hero-badge-dot" aria-hidden="true" />
              API Live &mdash; v1.0.0
            </div>
            <h1 id="heroHeading">
              Manage all your <span className="accent">Ad Accounts</span><br />in one place
            </h1>
            <p>
              Connect Google, Meta, and TikTok ad accounts.
              Track tokens, sync campaigns, and build reports &mdash;
              all from one unified platform.
            </p>
            <div className="hero-actions">
              <a href="#tokens"  className="btn btn-primary">Connect an Account</a>
              <a href="#status"  className="btn btn-secondary">View Platform Status</a>
            </div>
          </div>
        </section>

        {/* ================================================================
            STATUS CARDS
        ================================================================ */}
        <section className="section" id="status" aria-labelledby="statusHeading">
          <div className="container">
            <div className="section-header">
              <div className="section-label" aria-hidden="true">Platform Overview</div>
              <h2 className="section-title" id="statusHeading">System Status</h2>
              <p className="section-subtitle">Live health and version information for the Ad Platform API.</p>
            </div>

            <div className="status-grid" role="list">
              <article className="card" role="listitem" aria-label="API Health: Operational">
                <div className="status-card-header">
                  <div className="status-icon green" aria-hidden="true">✓</div>
                  <span className="status-badge ok">Operational</span>
                </div>
                <div className="status-card-title">API Health</div>
                <div className="status-card-value">Healthy</div>
                <div className="status-card-desc">All systems responding normally</div>
              </article>

              <article className="card" role="listitem" aria-label="Platform version 1.0.0, stable">
                <div className="status-card-header">
                  <div className="status-icon blue" aria-hidden="true">◆</div>
                  <span className="status-badge info">Stable</span>
                </div>
                <div className="status-card-title">Version</div>
                <div className="status-card-value">1.0.0</div>
                <div className="status-card-desc">Environment: Development</div>
              </article>

              <article className="card" role="listitem" aria-label="3 active connections">
                <div className="status-card-header">
                  <div className="status-icon amber" aria-hidden="true">⚡</div>
                  <span className="status-badge warn">3 Active</span>
                </div>
                <div className="status-card-title">Connections</div>
                <div className="status-card-value">3</div>
                <div className="status-card-desc">Accounts linked across platforms</div>
              </article>
            </div>
          </div>
        </section>

        {/* ================================================================
            TOKENS MODULE — static placeholder
        ================================================================ */}
        <section className="section" id="tokens" aria-labelledby="tokensHeading">
          <div className="container">
            <div className="section-header">
              <div className="section-label" aria-hidden="true">Authentication</div>
              <h2 className="section-title" id="tokensHeading">Access Tokens</h2>
              <p className="section-subtitle">Save and manage OAuth access tokens for each connected platform.</p>
            </div>

            <div className="module-block">
              <div className="module-header">
                <h3 className="module-title">Add Token</h3>
                <span className="status-badge ok">Module Active</span>
              </div>

              <div className="module-body">
                <div className="module-grid">
                  <div>
                    <form aria-label="Add access token form">
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label" htmlFor="tokenClientId">
                            Client ID <span className="required" aria-hidden="true">*</span>
                          </label>
                          <input className="form-input" type="text" id="tokenClientId" name="clientId"
                            placeholder="e.g. client_abc123" autoComplete="off" required />
                        </div>
                        <div className="form-group">
                          <label className="form-label" htmlFor="tokenPlatform">
                            Platform <span className="required" aria-hidden="true">*</span>
                          </label>
                          <div className="form-select-wrapper">
                            <select className="form-select" id="tokenPlatform" name="platform" required defaultValue="">
                              <option value="" disabled>Select platform…</option>
                              <option value="GOOGLE">Google</option>
                              <option value="META">Meta</option>
                              <option value="TIKTOK">TikTok</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="accessToken">
                          Access Token <span className="required" aria-hidden="true">*</span>
                        </label>
                        <input className="form-input" type="text" id="accessToken" name="accessToken"
                          placeholder="Paste your access token here" autoComplete="off" required />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="refreshToken">Refresh Token</label>
                        <input className="form-input" type="text" id="refreshToken" name="refreshToken"
                          placeholder="Optional — paste refresh token" autoComplete="off" />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="expiresAt">Expires At</label>
                        <input className="form-input" type="datetime-local" id="expiresAt" name="expiresAt" />
                        <p className="form-hint">Leave blank if the token does not expire.</p>
                      </div>

                      <div className="form-footer">
                        <p className="form-footer-note">Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.</p>
                        <button type="submit" className="btn btn-primary">Save Token</button>
                      </div>
                    </form>
                  </div>

                  <div>
                    <p className="module-sub-title">Supported Platforms</p>
                    <article className="card platform-card" aria-label="Google Ads">
                      <div className="platform-icon google" aria-hidden="true">G</div>
                      <div>
                        <div className="platform-name">Google Ads</div>
                        <div className="platform-note">OAuth 2.0 · Refresh Token</div>
                      </div>
                      <span className="status-badge ok" style={{ marginLeft: 'auto' }}>Ready</span>
                    </article>
                    <article className="card platform-card" aria-label="Meta Ads">
                      <div className="platform-icon meta" aria-hidden="true">f</div>
                      <div>
                        <div className="platform-name">Meta Ads</div>
                        <div className="platform-note">OAuth 2.0 · Long-lived Token</div>
                      </div>
                      <span className="status-badge ok" style={{ marginLeft: 'auto' }}>Ready</span>
                    </article>
                    <article className="card platform-card" aria-label="TikTok Ads">
                      <div className="platform-icon tiktok" aria-hidden="true">T</div>
                      <div>
                        <div className="platform-name">TikTok Ads</div>
                        <div className="platform-note">OAuth 2.0 · Access Token</div>
                      </div>
                      <span className="status-badge ok" style={{ marginLeft: 'auto' }}>Ready</span>
                    </article>
                  </div>
                </div>

                <div className="module-divider" />
                <p className="module-sub-title">
                  Saved Tokens{' '}
                  <span style={{ color: 'var(--muted)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>
                    (placeholder data)
                  </span>
                </p>

                <div className="table-wrapper">
                  <table aria-label="Saved access tokens">
                    <thead>
                      <tr>
                        <th scope="col">Client ID</th>
                        <th scope="col">Platform</th>
                        <th scope="col">Expires At</th>
                        <th scope="col">Status</th>
                        <th scope="col"><span className="sr-only">Row actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {PLACEHOLDER_TOKENS.map((t) => (
                        <tr key={`${t.clientId}-${t.platform}`}>
                          <td>{t.clientId}</td>
                          <td><PlatformBadge platform={t.platform} /></td>
                          <td>{t.expires}</td>
                          <td><span className="status-badge ok">{t.status}</span></td>
                          <td>
                            <div className="table-actions">
                              <button className="icon-btn" aria-label={`Edit token for ${t.clientId}`} title="Edit">✎</button>
                              <button className="icon-btn" aria-label={`Delete token for ${t.clientId}`} title="Delete">✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            ACCOUNTS MODULE — static placeholder
        ================================================================ */}
        <section className="section" id="accounts" aria-labelledby="accountsHeading">
          <div className="container">
            <div className="section-header">
              <div className="section-label" aria-hidden="true">Ad Accounts</div>
              <h2 className="section-title" id="accountsHeading">Accounts</h2>
              <p className="section-subtitle">Link external ad account IDs from each platform to a client record.</p>
            </div>

            <div className="module-block">
              <div className="module-header">
                <h3 className="module-title">Add Account</h3>
                <span className="status-badge ok">Module Active</span>
              </div>

              <div className="module-body">
                <div className="module-grid">
                  <div>
                    <form aria-label="Add ad account form">
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label" htmlFor="accountClientId">
                            Client ID <span className="required" aria-hidden="true">*</span>
                          </label>
                          <input className="form-input" type="text" id="accountClientId" name="clientId"
                            placeholder="e.g. client_abc123" autoComplete="off" required />
                        </div>
                        <div className="form-group">
                          <label className="form-label" htmlFor="accountPlatform">
                            Platform <span className="required" aria-hidden="true">*</span>
                          </label>
                          <div className="form-select-wrapper">
                            <select className="form-select" id="accountPlatform" name="platform" required defaultValue="">
                              <option value="" disabled>Select platform…</option>
                              <option value="GOOGLE">Google</option>
                              <option value="META">Meta</option>
                              <option value="TIKTOK">TikTok</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="externalAccountId">
                          External Account ID <span className="required" aria-hidden="true">*</span>
                        </label>
                        <input className="form-input" type="text" id="externalAccountId" name="externalAccountId"
                          placeholder="e.g. 123-456-7890" autoComplete="off" required />
                        <p className="form-hint">The account ID as shown in your ad platform dashboard.</p>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="accountName">Account Name</label>
                        <input className="form-input" type="text" id="accountName" name="name"
                          placeholder="e.g. Acme Corp — Google Ads" autoComplete="off" />
                      </div>

                      <div className="form-footer">
                        <p className="form-footer-note">Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.</p>
                        <button type="submit" className="btn btn-primary">Save Account</button>
                      </div>
                    </form>
                  </div>

                  <div>
                    <p className="module-sub-title">How Accounts Work</p>
                    <div className="card" style={{ padding: '20px', borderStyle: 'dashed', background: 'var(--surface3)' }}>
                      <div className="step-list">
                        <div className="step-item">
                          <div className="step-num" aria-hidden="true">1</div>
                          <div>
                            <div className="step-name">Connect a Client</div>
                            <div className="step-desc">Each account is linked to a client record in the system.</div>
                          </div>
                        </div>
                        <div className="step-item">
                          <div className="step-num" aria-hidden="true">2</div>
                          <div>
                            <div className="step-name">Choose a Platform</div>
                            <div className="step-desc">Select Google, Meta, or TikTok for this account.</div>
                          </div>
                        </div>
                        <div className="step-item">
                          <div className="step-num" aria-hidden="true">3</div>
                          <div>
                            <div className="step-name">Enter the Account ID</div>
                            <div className="step-desc">Use the external account ID from your platform dashboard.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="module-divider" />
                <p className="module-sub-title">
                  Saved Accounts{' '}
                  <span style={{ color: 'var(--muted)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>
                    (placeholder data)
                  </span>
                </p>

                <div className="table-wrapper">
                  <table aria-label="Saved ad accounts">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Client ID</th>
                        <th scope="col">Platform</th>
                        <th scope="col">External Account ID</th>
                        <th scope="col"><span className="sr-only">Row actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {PLACEHOLDER_ACCOUNTS.map((a) => (
                        <tr key={a.externalId}>
                          <td>{a.name}</td>
                          <td>{a.clientId}</td>
                          <td><PlatformBadge platform={a.platform} /></td>
                          <td>{a.externalId}</td>
                          <td>
                            <div className="table-actions">
                              <button className="icon-btn" aria-label={`Edit ${a.name}`} title="Edit">✎</button>
                              <button className="icon-btn" aria-label={`Delete ${a.name}`} title="Delete">✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            CLIENTS MODULE — real data from /api/clients
        ================================================================ */}
        <section className="section" id="clients" aria-labelledby="clientsHeading">
          <div className="container">
            <div className="section-header">
              <div className="section-label" aria-hidden="true">Client Management</div>
              <h2 className="section-title" id="clientsHeading">Clients</h2>
              <p className="section-subtitle">Add and manage client records. Live data from the API.</p>
            </div>

            <div className="module-block">
              <div className="module-header">
                <h3 className="module-title">Add Client</h3>
                <span className="status-badge ok">Live Data</span>
              </div>

              <div className="module-body">
                <div className="module-grid">
                  <div>
                    <form aria-label="Add client form" onSubmit={handleAddClient}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="clientName">
                          Name <span className="required" aria-hidden="true">*</span>
                        </label>
                        <input
                          className="form-input"
                          type="text"
                          id="clientName"
                          name="name"
                          placeholder="e.g. Acme Corp"
                          autoComplete="off"
                          required
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="clientEmail">Email</label>
                        <input
                          className="form-input"
                          type="email"
                          id="clientEmail"
                          name="email"
                          placeholder="e.g. hello@acme.com"
                          autoComplete="off"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                        <p className="form-hint">Optional — used for contact and notifications.</p>
                      </div>

                      {submitError && (
                        <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>
                          {submitError}
                        </p>
                      )}
                      {submitSuccess && (
                        <p style={{ color: 'var(--green)', fontSize: '13px', marginBottom: '12px' }}>
                          Client added successfully.
                        </p>
                      )}

                      <div className="form-footer">
                        <p className="form-footer-note">Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.</p>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                          {submitting ? 'Saving…' : 'Save Client'}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div>
                    <p className="module-sub-title">About Clients</p>
                    <div className="card" style={{ padding: '20px', borderStyle: 'dashed', background: 'var(--surface3)' }}>
                      <div className="step-list">
                        <div className="step-item">
                          <div className="step-num" aria-hidden="true">1</div>
                          <div>
                            <div className="step-name">Create a Client</div>
                            <div className="step-desc">A client is the top-level entity — all tokens and accounts belong to a client.</div>
                          </div>
                        </div>
                        <div className="step-item">
                          <div className="step-num" aria-hidden="true">2</div>
                          <div>
                            <div className="step-name">Link Ad Accounts</div>
                            <div className="step-desc">Attach Google, Meta, or TikTok ad accounts to this client.</div>
                          </div>
                        </div>
                        <div className="step-item">
                          <div className="step-num" aria-hidden="true">3</div>
                          <div>
                            <div className="step-name">Add OAuth Tokens</div>
                            <div className="step-desc">Save access tokens needed to sync campaigns and reporting data.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="module-divider" />
                <p className="module-sub-title">All Clients</p>

                {clientsLoading ? (
                  <p style={{ color: 'var(--muted)', fontSize: '14px', padding: '12px 0' }}>Loading clients…</p>
                ) : clientsError ? (
                  <p style={{ color: 'var(--red)', fontSize: '14px', padding: '12px 0' }}>{clientsError}</p>
                ) : (
                  <>
                  <div className="table-wrapper">
                    <table aria-label="All clients">
                      <thead>
                        <tr>
                          <th scope="col">ID</th>
                          <th scope="col">Name</th>
                          <th scope="col">Email</th>
                          <th scope="col">Created</th>
                          <th scope="col"><span className="sr-only">Row actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                              No clients yet. Add one above.
                            </td>
                          </tr>
                        ) : (
                          clients.map((c) => (
                            <tr key={c.id}>
                              <td>{c.id}</td>
                              <td style={{ color: 'var(--white)', fontWeight: 600 }}>{c.name}</td>
                              <td>{c.email ?? <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                              <td>
                                {confirmDeleteId === c.id ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text)' }}>Delete?</span>
                                    <button
                                      className="btn"
                                      style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--red)', color: 'var(--white)', border: 'none' }}
                                      disabled={deleteInProgress === c.id}
                                      onClick={() => handleDelete(c.id)}
                                    >
                                      {deleteInProgress === c.id ? '…' : 'Yes'}
                                    </button>
                                    <button
                                      className="btn btn-ghost"
                                      style={{ padding: '4px 10px', fontSize: '12px' }}
                                      disabled={deleteInProgress === c.id}
                                      onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }}
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <div className="table-actions">
                                    <button
                                      className="icon-btn"
                                      aria-label={`Edit ${c.name}`}
                                      title="Edit"
                                      onClick={() => openEdit(c)}
                                    >✎</button>
                                    <button
                                      className="icon-btn"
                                      aria-label={`Delete ${c.name}`}
                                      title="Delete"
                                      onClick={() => { setConfirmDeleteId(c.id); setDeleteError(null); }}
                                    >✕</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {deleteError && (
                    <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>{deleteError}</p>
                  )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            COMING SOON
        ================================================================ */}
        <section className="section" id="coming-soon" aria-labelledby="comingSoonHeading">
          <div className="container">
            <div className="section-header">
              <div className="section-label" aria-hidden="true">Roadmap</div>
              <h2 className="section-title" id="comingSoonHeading">Coming Soon</h2>
              <p className="section-subtitle">
                These modules are in active development and will be available in upcoming releases.
              </p>
            </div>

            <div className="coming-soon-grid">
              <article className="coming-soon-card" aria-label="Campaigns module — coming soon">
                <div className="coming-soon-icon" aria-hidden="true">📣</div>
                <h3 className="coming-soon-title">Campaigns</h3>
                <p className="coming-soon-desc">
                  Sync and manage ad campaigns across Google, Meta, and TikTok from a single dashboard.
                </p>
                <span className="coming-soon-pill">In Development</span>
              </article>

              <article className="coming-soon-card" aria-label="Reports module — coming soon">
                <div className="coming-soon-icon" aria-hidden="true">📊</div>
                <h3 className="coming-soon-title">Reports</h3>
                <p className="coming-soon-desc">
                  Cross-platform performance reports with spend, impressions, and conversion data.
                </p>
                <span className="coming-soon-pill">In Development</span>
              </article>

              <article className="coming-soon-card" aria-label="Competitor Intelligence — coming soon">
                <div className="coming-soon-icon" aria-hidden="true">🔍</div>
                <h3 className="coming-soon-title">Competitor Intelligence</h3>
                <p className="coming-soon-desc">
                  Track and analyse competitor ad activity across platforms.
                </p>
                <span className="coming-soon-pill">In Development</span>
              </article>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================================
          FOOTER
      ================================================================ */}
      <footer className="site-footer" role="contentinfo">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-left">
              <div className="logo-icon" aria-hidden="true">A</div>
              <div>
                <p className="footer-brand-text"><strong>AdPlatform</strong> &mdash; Multi-platform ad management</p>
                <p className="footer-version">Version 1.0.0 &bull; Development Build</p>
              </div>
            </div>
            <div className="footer-right" aria-label="Footer navigation">
              <a href="#status">Dashboard</a>
              <a href="#tokens">Tokens</a>
              <a href="#accounts">Accounts</a>
              <a href="#clients">Clients</a>
              <a href="#coming-soon">Roadmap</a>
              <span>&copy; 2026 AdPlatform</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ================================================================
          EDIT CLIENT MODAL
      ================================================================ */}
      {editingClient && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editModalTitle"
          onClick={(e) => { if (e.target === e.currentTarget) { setEditingClient(null); setEditError(null); } }}
        >
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title" id="editModalTitle">Edit Client</h2>
              <button
                className="icon-btn"
                aria-label="Close edit modal"
                onClick={() => { setEditingClient(null); setEditError(null); }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="editClientName">
                    Name <span className="required" aria-hidden="true">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    id="editClientName"
                    autoComplete="off"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="editClientEmail">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    id="editClientEmail"
                    autoComplete="off"
                    placeholder="Optional"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>
                {editError && (
                  <p style={{ color: 'var(--red)', fontSize: '13px', marginTop: '4px' }}>{editError}</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={editSubmitting}
                  onClick={() => { setEditingClient(null); setEditError(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

