"use client";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
export default function SecurityPanel() {
  const [data, setData] = useState<any>(null),
    [password, setPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [code, setCode] = useState(""),
    [secret, setSecret] = useState(""),
    [busy, setBusy] = useState(false),
    [loadError, setLoadError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/security");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load account");
    setData(result);
    setLoadError("");
    return result;
  }, []);
  useEffect(() => {
    void load().catch((error) => setLoadError(error.message));
  }, [load]);
  async function action(action: string, id?: string) {
    if (action !== "revoke" && !password) {
      toast.error("Enter your current sign-in password above to continue");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, password, newPassword, code }),
      });
      const p = await r.json();
      if (!r.ok) throw new Error(p.error);
      if (p.secret) setSecret(p.secret);
      else {
        toast.success(
          action === "password"
            ? "Password saved. Use your new password for authenticator setup."
            : "Security settings updated",
        );
        setSecret("");
        if (action === "password") {
          setPassword("");
          setNewPassword("");
        }
      }
      const updated = await load();
      if (
        ["password", "enable2FA"].includes(action) &&
        !updated.mustChangePassword &&
        !updated.mustEnable2FA
      )
        window.location.assign(updated.workspacePath);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-serif font-bold">My account & security</h1>
        <p role="status">{loadError || "Loading your account…"}</p>
        {loadError && <a href="/login">Return to sign in</a>}
      </div>
    );
  return (
    <div className="space-y-5 max-w-4xl">
      <h1 className="text-2xl font-serif font-bold">My account & security</h1>
      <p className="text-sm text-slate-600">Signed in as {data.email}</p>
      {data?.mustEnable2FA && (
        <p role="alert" className="bg-amber-50 border rounded-lg p-4">
          {data.mustChangePassword
            ? "After replacing your temporary password, set up an authenticator below to open your workspace."
            : "Your password is already set. Set up an authenticator below to open your workspace; another password change is not required."}
        </p>
      )}
      {data?.mustChangePassword && (
        <p
          role="alert"
          className="bg-amber-50 border border-amber-300 rounded-lg p-4"
        >
          Replace your temporary password before opening firm records.
        </p>
      )}
      {!data.mustChangePassword && !data.mustEnable2FA && (
        <div className="bg-green-50 border rounded-lg p-4 space-y-3">
          <p>Your account is ready. Another password change is not required.</p>
          <a
            href={data.workspacePath}
            className="inline-block bg-navy-900 text-white rounded-lg px-4 py-2"
          >
            Open my workspace
          </a>
        </div>
      )}
      <section className="bg-white rounded-xl border p-5 space-y-4">
        <label className="block text-sm">
          Current sign-in password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block border rounded-lg p-2 w-full mt-1"
          />
          <span className="block mt-2 text-slate-500">
            Use the password you currently sign in with. If you have changed it,
            enter your new password here for authenticator setup.
          </span>
        </label>
        <details open={Boolean(data.mustChangePassword)} className="space-y-4">
          <summary className="cursor-pointer font-medium">
            {data.mustChangePassword
              ? "Replace your temporary password"
              : "Change password (optional)"}
          </summary>
          <label className="block text-sm">
            New password (at least 8 characters)
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              minLength={8}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block border rounded-lg p-2 w-full mt-1"
            />
          </label>
          <button
            disabled={busy}
            onClick={() => action("password")}
            className="bg-navy-900 text-white rounded-lg px-4 py-2"
          >
            Change password
          </button>
        </details>
        <hr />
        <h2 className="font-semibold">
          Two-factor authentication{" "}
          {data?.twoFAEnabled ? "· Enabled" : "· Disabled"}
        </h2>
        {!data.twoFAEnabled && (
          <p className="text-sm text-slate-600">
            Enter your current sign-in password above, choose Set up
            authenticator, and add the displayed key to your authenticator app.
            Enter its six-digit code and choose Confirm and enable.
          </p>
        )}
        {!data?.twoFAEnabled && (
          <button
            disabled={busy || data.mustChangePassword}
            onClick={() => action("setup2FA")}
            className="border rounded-lg p-2"
          >
            Set up authenticator
          </button>
        )}
        {secret && (
          <p className="bg-amber-50 p-3 text-sm break-all">
            Add this key to your authenticator app: <strong>{secret}</strong>.
            Then enter its six-digit code below.
          </p>
        )}
        <input
          aria-label="Authenticator code"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Six-digit code"
          maxLength={6}
          className="border rounded-lg p-2"
        />
        {secret && (
          <button
            disabled={busy}
            onClick={() => action("enable2FA")}
            className="ml-3 border rounded-lg p-2"
          >
            Confirm and enable
          </button>
        )}
        {data?.twoFAEnabled && !data.twoFARequired && (
          <button
            disabled={busy}
            onClick={() => action("disable2FA")}
            className="ml-3 border rounded-lg p-2"
          >
            Disable 2FA
          </button>
        )}
      </section>
      <section className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-3">Active sessions</h2>
        {data?.sessions?.map((s: any) => (
          <div key={s.id} className="border-t py-3 text-sm">
            <p className="break-words">
              {s.userAgent} {s.current ? "(This session)" : ""}
            </p>
            <p className="text-slate-500">
              {s.ipAddress} · {new Date(s.createdAt).toLocaleString("en-IN")}
            </p>
            {!s.current && (
              <button
                disabled={busy}
                onClick={() => action("revoke", s.id)}
                className="text-red-700"
              >
                Terminate session
              </button>
            )}
          </div>
        ))}
      </section>
      <section className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold">My activity</h2>
        {data?.logs?.map((l: any) => (
          <p key={l.id} className="text-sm border-t py-2 mt-2">
            {new Date(l.createdAt).toLocaleString("en-IN")} · {l.action} ·{" "}
            {l.entity}
          </p>
        ))}
      </section>
    </div>
  );
}
