"use client";

export default function Home() {
  async function callApi(path: string) {
    const res = await fetch(path);
    const data = await res.json();
    alert(JSON.stringify(data, null, 2));
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Ad Platform Dashboard</h1>

      <button onClick={() => callApi("/api/accounts/sync?clientId=1")}>
        Sync Accounts
      </button>
      <br /><br />

      <button onClick={() => callApi("/api/campaigns/sync?clientId=1")}>
        Sync Campaigns
      </button>
      <br /><br />

      <button onClick={() => callApi("/api/ads/sync?clientId=1")}>
        Sync Ads
      </button>
      <br /><br />

      <button
        onClick={() =>
          callApi(
            "/api/metrics/sync?clientId=1&from=2026-04-01&to=2026-04-06"
          )
        }
      >
        Sync Metrics
      </button>
    </main>
  );
}