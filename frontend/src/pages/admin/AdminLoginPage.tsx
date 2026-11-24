import { AlertCircle, ArrowLeft, Camera, Lock } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { extractApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";

export function AdminLoginPage() {
  const { admin, loading, login } = useAuth();
  const { business } = useBusiness();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && admin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(extractApiError(err, "Invalid email or password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {business?.businessName || "Public Website"}
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-white">
              <Camera className="h-5 w-5 text-amber-200" />
            </div>
            <h1 className="mt-4 font-serif text-2xl font-medium text-stone-900">
              Administrator Sign In
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Manage bookings, photography services, portfolio galleries, and
              studio details.
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-800"
              >
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@studiolens.com"
                className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-800"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:opacity-60"
            >
              <Lock className="h-4 w-4" />
              <span>
                {submitting ? "Signing In..." : "Sign In to Dashboard"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
