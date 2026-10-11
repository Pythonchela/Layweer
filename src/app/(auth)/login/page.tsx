"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Scale,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", code: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [insecureLoginUrl, setInsecureLoginUrl] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.protocol === 'http:' &&
        !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
      const url = new URL(window.location.href);
      url.protocol = 'https:';
      setInsecureLoginUrl(url.href);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (window.location.protocol === 'http:' &&
        !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
      toast.error('Open the secure HTTPS version to sign in.');
      return;
    }
    if (!form.email || !form.password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    setDbError(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          code: form.code,
        }),
      });

      const data = await res.json();

      if (res.status === 503) {
        // Database not initialised yet
        setDbError(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "Login failed. Check your credentials.");
        setLoading(false);
        return;
      }

      localStorage.removeItem("token");
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(`Welcome back, ${data.user.name}!`);

      if (data.user.mustChangePassword || data.user.mustEnable2FA) {
        router.push("/account");
      } else if (data.user.role === "CLIENT") {
        router.push("/portal");
      } else {
        router.push("/admin/dashboard");
      }
    } catch {
      toast.error("Network error. Is the dev server running?");
      setLoading(false);
    }
  };

  // Prefill helper
  const prefill = (email: string, password: string) => {
    setForm({ email, password, code: "" });
    setDbError(false);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gold-500 rounded-xl flex items-center justify-center">
              <Scale className="w-7 h-7 text-navy-900" />
            </div>
            <div className="text-left">
              <div className="text-white font-serif font-bold text-2xl">
                LexFirm Pro
              </div>
              <div className="text-gold-400 text-xs">Management System</div>
            </div>
          </Link>
        </div>

        {/* Database not ready banner */}
        {dbError && (
          <div className="mb-4 bg-red-900/60 border border-red-500/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-300 font-semibold text-sm mb-2">
              <AlertTriangle className="w-4 h-4" /> Database not initialised
            </div>
            <p className="text-red-200 text-xs leading-relaxed mb-3">
              The database tables haven&apos;t been created yet. Run these
              commands once in your terminal, then try logging in again:
            </p>
            <div className="bg-black/50 rounded-lg p-3 font-mono text-xs text-green-300 space-y-1">
              <div>
                <span className="text-gray-500">1.</span> npx prisma db push
              </div>
              <div>
                <span className="text-gray-500">2.</span> npx prisma generate
              </div>
              <div>
                <span className="text-gray-500">3.</span> node prisma/seed.js
              </div>
            </div>
            <p className="text-red-300 text-xs mt-2">
              Or double-click <strong>setup.bat</strong> in the project folder.
            </p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-navy-800" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-navy-900">
              Sign In
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Enter your credentials to access the system
            </p>
          </div>

          {insecureLoginUrl ? (
            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Open secure login</p>
              <p className="mt-2">Sign in using the HTTPS version of this website. If it does not open, the website&apos;s secure connection still needs to be activated.</p>
              <a href={insecureLoginUrl} className="mt-4 inline-block font-semibold underline">Open secure login</a>
            </div>
          ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm text-gray-300">
              Authenticator code (if enabled)
              <input
                aria-label="Authenticator code"
                autoComplete="one-time-code"
                inputMode="numeric"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="block w-full mt-1 rounded-lg p-2 text-gray-900"
                maxLength={6}
              />
            </label>
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          )}

          {/* Demo credentials — clickable */}
          {process.env.NODE_ENV !== "production" && (
            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-2">
                <Shield className="w-3.5 h-3.5" /> Demo Credentials — click to
                prefill
              </div>
              <div className="space-y-2">
                {[
                  {
                    label: "Super Admin",
                    email: "admin@lexfirm.com",
                    password: "Admin@123",
                  },
                  {
                    label: "Sr. Advocate",
                    email: "rajendra@lexfirm.com",
                    password: "Advocate@123",
                  },
                  {
                    label: "Client Portal",
                    email: "client@demo.com",
                    password: "Client@123",
                  },
                ].map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => prefill(c.email, c.password)}
                    className="w-full flex items-center justify-between text-xs text-amber-800 hover:bg-amber-100 px-2 py-1.5 rounded-lg transition-colors text-left"
                  >
                    <span className="font-medium w-28">{c.label}:</span>
                    <span className="font-mono text-amber-700 truncate">
                      {c.email}
                    </span>
                    <span className="font-mono ml-2 text-amber-600">
                      {c.password}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-5">
            For account issues, contact your system administrator.
          </p>
        </div>

        {/* Setup reminder */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-4 bg-navy-800/50 border border-navy-700/50 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-xs flex items-center justify-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-gold-400" />
              First time? Run{" "}
              <code className="text-gold-300 font-mono mx-1">setup.bat</code> or
              <code className="text-gold-300 font-mono mx-1">
                npm run db:setup
              </code>{" "}
              first.
            </p>
          </div>
        )}

        <p className="text-center text-gray-500 text-sm mt-4">
          <Link href="/" className="text-gold-400 hover:text-gold-300">
            ← Back to Website
          </Link>
        </p>
      </div>
    </div>
  );
}
