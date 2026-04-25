import { LockKeyhole } from "lucide-react";

export default function LoginPanel({ credentials, onChange, onSubmit, loading, error }) {
  return (
    <div className="mx-auto max-w-md border border-white/10 bg-[#101115] p-8 animate-rise">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-[#4f8cff] p-3 text-white">
          <LockKeyhole size={22} />
        </div>
        <div>
          <p className="section-kicker">Secure Access</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Educator login</h2>
          <p className="mt-2 text-sm text-slate-400">
            Use the demo credentials from the server env file to unlock grading tools.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <input
          className="input"
          name="username"
          placeholder="Username"
          value={credentials.username}
          onChange={onChange}
        />
        <input
          className="input"
          name="password"
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={onChange}
        />
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
