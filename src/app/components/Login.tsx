import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

// Belépés e-mail-címmel és jelszóval (Supabase Auth). Regisztráció nincs: a felhasználót a Supabase
// felületén kell létrehozni, és ott a regisztrációt ki kell kapcsolni.
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(
        error.message.toLowerCase().includes("invalid")
          ? "Hibás e-mail-cím vagy jelszó."
          : "Nem sikerült belépni. Ellenőrizd az internetkapcsolatot, és próbáld újra.",
      );
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <h1 className="text-xl font-medium">Morning Boost</h1>
          <p className="text-sm text-muted-foreground mt-1">Jelentkezz be a jelenléti napló megnyitásához.</p>
        </div>
        <label className="block">
          <span className="text-sm">E-mail</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50"
          />
        </label>
        <label className="block">
          <span className="text-sm">Jelszó</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-[#ef4444]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Belépés
        </button>
      </form>
    </div>
  );
}
