import { useState, useEffect, useRef, useCallback } from "react";
import { Calendar, Users, BarChart3, CloudOff } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import SessionTab from "./components/SessionTab";
import PassesTab from "./components/PassesTab";
import ReportsTab from "./components/ReportsTab";
import Login from "./components/Login";
import type { Session as AuthSession } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface Member {
  id: string;
  name: string;
  email: string;
  passesRemaining: number;
  totalPasses: number;
  renewals: number;
  sessionsUsed: number;
  debt: number;
}

export interface SessionAttendance {
  memberId: string;
  checked: boolean;
}

export interface Session {
  date: string; // ISO date string
  attendance: SessionAttendance[];
  dropIns: string[];
  totalOverride?: number;
  notes?: string;
  cancelled?: boolean;
}

// A tagok ábécérendben (magyar szabályok szerint) jelennek meg.
function sortMembers(list: Member[]): Member[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "hu"));
}

function memberToRow(m: Member) {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    passes_remaining: m.passesRemaining,
    total_passes: m.totalPasses,
    renewals: m.renewals,
    sessions_used: m.sessionsUsed,
    debt: m.debt,
  };
}

function rowToMember(r: Record<string, unknown>): Member {
  return {
    id: r.id as string,
    name: r.name as string,
    email: (r.email as string) ?? "",
    passesRemaining: r.passes_remaining as number,
    totalPasses: r.total_passes as number,
    renewals: r.renewals as number,
    sessionsUsed: r.sessions_used as number,
    debt: r.debt as number,
  };
}

function sessionToRow(s: Session) {
  return {
    date: s.date,
    attendance: s.attendance,
    drop_ins: {
      names: s.dropIns,
      totalOverride: s.totalOverride ?? null,
      notes: s.notes ?? null,
      cancelled: s.cancelled ?? false,
    },
  };
}

function rowToSession(r: Record<string, unknown>): Session {
  const rawDropIns = r.drop_ins;
  const isLegacyArray = Array.isArray(rawDropIns);
  type DropInsBlob = { names?: string[]; totalOverride?: number; notes?: string; cancelled?: boolean };
  const blob = isLegacyArray ? null : (rawDropIns as DropInsBlob | null);

  return {
    date: r.date as string,
    attendance: r.attendance as SessionAttendance[],
    dropIns: isLegacyArray ? (rawDropIns as string[]) : (blob?.names ?? []),
    totalOverride: isLegacyArray ? undefined : (blob?.totalOverride ?? undefined),
    notes: isLegacyArray ? undefined : (blob?.notes ?? undefined),
    cancelled: isLegacyArray ? undefined : (blob?.cancelled ?? undefined),
  };
}

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState("session");
  // undefined: még nem tudjuk, be van-e lépve; null: nincs belépve
  const [auth, setAuth] = useState<AuthSession | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuth(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAuth(session));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = auth?.user.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      const [m, s] = await Promise.all([
        supabase.from("members").select("*"),
        supabase.from("sessions").select("*"),
      ]);
      if (cancelled) return;
      if (m.error || s.error) {
        console.error("Betöltési hiba:", m.error ?? s.error);
        setLoadError(true);
      } else {
        setMembers(sortMembers((m.data ?? []).map(rowToMember)));
        setSessions((s.data ?? []).map(rowToSession));
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const logout = () => {
    supabase.auth.signOut();
    setMembers([]);
    setSessions([]);
  };

  // Mentés: minden változás után a teljes (kis méretű) listát elküldjük. Ha nem sikerül (pl. nincs térerő
  // a teremben), ezt jól láthatóan jelezzük, és a kapcsolat visszatérésekor automatikusan újra megpróbáljuk.
  const latest = useRef<{ members: Member[]; sessions: Session[] }>({ members: [], sessions: [] });
  latest.current = { members, sessions };
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveMembers = useCallback(async (list: Member[]) => {
    const { error } = await supabase.from("members").upsert(list.map(memberToRow), { onConflict: "id" });
    if (error) {
      console.error("Members mentési hiba:", error);
      setSaveFailed(true);
    }
    return !error;
  }, []);

  const saveSessions = useCallback(async (list: Session[]) => {
    const { error } = await supabase.from("sessions").upsert(list.map(sessionToRow), { onConflict: "date" });
    if (error) {
      console.error("Sessions mentési hiba:", error);
      setSaveFailed(true);
    }
    return !error;
  }, []);

  const retrySave = useCallback(async () => {
    setSaving(true);
    const okM = await saveMembers(latest.current.members);
    const okS = await saveSessions(latest.current.sessions);
    setSaving(false);
    if (okM && okS) setSaveFailed(false);
  }, [saveMembers, saveSessions]);

  useEffect(() => {
    if (!saveFailed) return;
    const onOnline = () => void retrySave();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [saveFailed, retrySave]);

  const updateMembers = (newMembers: Member[]) => {
    const sorted = sortMembers(newMembers);
    setMembers(sorted);
    void saveMembers(sorted);
  };

  const updateSessions = (newSessions: Session[]) => {
    setSessions(newSessions);
    void saveSessions(newSessions);
  };

  const deleteMember = async (id: string) => {
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      console.error("Törlési hiba:", error);
      alert("Nem sikerült törölni. Ellenőrizd az internetkapcsolatot.");
      return;
    }
    setMembers(list => list.filter(m => m.id !== id));
  };

  if (auth === null) return <Login />;

  if (auth === undefined || loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Betöltés...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="size-full flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">Nem sikerült betölteni az adatokat. Ellenőrizd az internetkapcsolatot.</p>
        <div className="flex gap-2">
          <button onClick={() => location.reload()} className="px-4 py-2 bg-[#14b8a6] text-white rounded-lg">
            Újrapróbálom
          </button>
          <button onClick={logout} className="px-4 py-2 border border-border rounded-lg">
            Kijelentkezés
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full bg-background overflow-hidden flex flex-col">
      {saveFailed && (
        <div role="alert" className="flex items-center gap-3 bg-[#fef3c7] text-[#92400e] px-4 py-2 text-sm">
          <CloudOff className="w-4 h-4 shrink-0" />
          <span className="flex-1">Az utolsó módosítás nincs elmentve (nincs internet?).</span>
          <button onClick={() => void retrySave()} disabled={saving} className="font-medium underline disabled:opacity-60">
            {saving ? "Mentés…" : "Újra"}
          </button>
        </div>
      )}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          <Tabs.Content value="session" className="h-full">
            <SessionTab
              members={members}
              setMembers={updateMembers}
              sessions={sessions}
              setSessions={updateSessions}
            />
          </Tabs.Content>
          <Tabs.Content value="passes" className="h-full">
            <PassesTab members={members} setMembers={updateMembers} sessions={sessions} onDeleteMember={deleteMember} />
          </Tabs.Content>
          <Tabs.Content value="reports" className="h-full">
            <ReportsTab members={members} sessions={sessions} onLogout={logout} />
          </Tabs.Content>
        </div>

        {/* Tab Bar - Sticky at bottom */}
        <Tabs.List className="flex border-t border-border bg-card sticky bottom-0 z-10">
          <Tabs.Trigger
            value="session"
            className="flex-1 flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:text-[#14b8a6] data-[state=inactive]:text-muted-foreground transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Edzés</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="passes"
            className="flex-1 flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:text-[#14b8a6] data-[state=inactive]:text-muted-foreground transition-colors"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Bérletek</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="reports"
            className="flex-1 flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:text-[#14b8a6] data-[state=inactive]:text-muted-foreground transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Statisztika</span>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}
