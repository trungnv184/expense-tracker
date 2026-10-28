export function StorageUnavailable({ reason }: { reason: string }) {
  return (
    <main style={{ maxWidth: 560 }}>
      <div className="card card-pad" role="alert">
        <div className="eyebrow">Ledger</div>
        <h1 style={{ margin: '8px 0 12px' }}>Storage is unavailable</h1>
        <p>
          Ledger keeps your expenses in this browser, but the browser won’t let it save data right now. This often happens
          in private browsing windows or when site data is blocked.
        </p>
        <p className="muted">Open Ledger in a normal window, or allow site data for this page, then reload.</p>
        <p className="muted" style={{ fontSize: 13 }}>
          Details: {reason}
        </p>
        <button className="btn primary" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    </main>
  );
}
