import { useState, useEffect } from "react";
import { Calendar, Users, BarChart3 } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import SessionTab from "./components/SessionTab";
import PassesTab from "./components/PassesTab";
import ReportsTab from "./components/ReportsTab";
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
}

const initialMembers: Member[] = [
  { id: "1", name: "Zoli", email: "bagdi.zoltan1@hotmail.com", passesRemaining: 9, totalPasses: 10, renewals: 5, sessionsUsed: 6, debt: 0 },
  { id: "2", name: "Kornél", email: "", passesRemaining: 0, totalPasses: 10, renewals: 0, sessionsUsed: 10, debt: 1 },
  { id: "3", name: "Szandra", email: "fintoralexandra@gmail.com", passesRemaining: 7, totalPasses: 10, renewals: 2, sessionsUsed: 10, debt: 0 },
  { id: "4", name: "Ercsi", email: "", passesRemaining: 4, totalPasses: 10, renewals: 0, sessionsUsed: 9, debt: 0 },
  { id: "5", name: "Timi", email: "", passesRemaining: 7, totalPasses: 10, renewals: 0, sessionsUsed: 7, debt: 0 },
  { id: "6", name: "Kuffart Gábor", email: "", passesRemaining: 5, totalPasses: 10, renewals: 0, sessionsUsed: 3, debt: 0 },
  { id: "7", name: "K. Timi", email: "", passesRemaining: 8, totalPasses: 10, renewals: 0, sessionsUsed: 0, debt: 0 },
  { id: "8", name: "Ági", email: "", passesRemaining: 0, totalPasses: 10, renewals: 0, sessionsUsed: 0, debt: 0 },
  { id: "9", name: "Évi", email: "", passesRemaining: 9, totalPasses: 10, renewals: 0, sessionsUsed: 0, debt: 0 },
  { id: "10", name: "Zsófi", email: "", passesRemaining: 6, totalPasses: 10, renewals: 0, sessionsUsed: 0, debt: 0 },
  { id: "11", name: "Réka", email: "", passesRemaining: 8, totalPasses: 10, renewals: 0, sessionsUsed: 0, debt: 0 },
];

const Z = "1"; // Zoli
const K = "2"; // Kornél
const S = "3"; // Szandra
const E = "4"; // Ercsi
const T = "5"; // Timi
const G = "6"; // Kuffart Gábor
const KT = "7"; // K. Timi
const A = "8"; // Ági
const AV = "9"; // Ávi
const ZS = "10"; // Zsófi
const R = "11"; // Réka
const att = (...ids: string[]) => ids.map(id => ({ memberId: id, checked: true }));

const initialSessions: Session[] = [
  { date: "2025-11-03", attendance: att(K), dropIns: [] },
  { date: "2025-11-06", attendance: att(K), dropIns: [] },
  { date: "2025-11-10", attendance: att(K), dropIns: [] },
  { date: "2025-11-17", attendance: att(K), dropIns: [] },
  { date: "2025-11-19", attendance: att(K), dropIns: [] },
  { date: "2025-11-26", attendance: att(K), dropIns: [] },
  { date: "2025-12-01", attendance: att(K), dropIns: [] },
  { date: "2025-12-03", attendance: att(K), dropIns: [] },
  { date: "2025-12-10", attendance: att(K), dropIns: [] },
  { date: "2025-12-15", attendance: att(K), dropIns: [] },
  { date: "2026-01-05", attendance: att(K), dropIns: [] },
  { date: "2026-01-07", attendance: att(K), dropIns: [] },
  { date: "2026-01-10", attendance: att(Z), dropIns: [] },
  { date: "2026-01-12", attendance: att(Z), dropIns: [] },
  { date: "2026-01-14", attendance: att(Z), dropIns: [] },
  { date: "2026-01-17", attendance: att(Z, K), dropIns: [] },
  { date: "2026-01-19", attendance: att(Z), dropIns: [] },
  { date: "2026-01-21", attendance: att(Z), dropIns: [] },
  { date: "2026-01-24", attendance: att(Z), dropIns: [] },
  { date: "2026-01-26", attendance: att(Z, E), dropIns: [] },
  { date: "2026-01-28", attendance: att(Z), dropIns: [] },
  { date: "2026-01-31", attendance: att(Z, E), dropIns: [] },
  { date: "2026-02-02", attendance: att(Z, E), dropIns: [] },
  { date: "2026-02-04", attendance: att(Z, E), dropIns: [] },
  { date: "2026-02-07", attendance: att(Z, E), dropIns: [] },
  { date: "2026-02-09", attendance: att(Z, K, E, T), dropIns: [] },
  { date: "2026-02-11", attendance: att(Z, K, E, T), dropIns: [] },
  { date: "2026-02-14", attendance: att(Z, K, T), dropIns: [] },
  { date: "2026-02-16", attendance: att(E, T), dropIns: [] },
  { date: "2026-02-18", attendance: att(Z, K, T), dropIns: [] },
  { date: "2026-02-21", attendance: att(Z, E, T), dropIns: [] },
  { date: "2026-02-23", attendance: att(Z, K, T), dropIns: [] },
  { date: "2026-02-25", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-02-28", attendance: att(Z, S, K, E, T), dropIns: [] },
  { date: "2026-03-02", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-03-04", attendance: att(Z, S, T), dropIns: [] },
  { date: "2026-03-07", attendance: att(Z, S, T), dropIns: [] },
  { date: "2026-03-09", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-03-11", attendance: att(Z, S, K, E, T), dropIns: [] },
  { date: "2026-03-14", attendance: att(Z, S, K, E, T), dropIns: [] },
  { date: "2026-03-16", attendance: att(Z, S, K, E, T), dropIns: [] },
  { date: "2026-03-18", attendance: att(E, T), dropIns: [] },
  { date: "2026-03-21", attendance: att(E, T), dropIns: [] },
  { date: "2026-03-23", attendance: att(Z, K, E, T), dropIns: [] },
  { date: "2026-03-25", attendance: att(Z, S, K, T), dropIns: [] },
  { date: "2026-03-28", attendance: att(Z, S, K, E, T), dropIns: [] },
  { date: "2026-03-30", attendance: att(Z, K, E, T), dropIns: [] },
  { date: "2026-04-01", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-04-04", attendance: att(Z, E, T), dropIns: [] },
  { date: "2026-04-06", attendance: att(Z, K, E, T), dropIns: [] },
  { date: "2026-04-08", attendance: att(Z, S, K, E, T), dropIns: [] },
  { date: "2026-04-11", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-13", attendance: att(Z, S, E), dropIns: [] },
  { date: "2026-04-15", attendance: att(Z, S, E), dropIns: [] },
  { date: "2026-04-18", attendance: att(Z, S, K, E), dropIns: [] },
  { date: "2026-04-20", attendance: att(Z), dropIns: [] },
  { date: "2026-04-22", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-25", attendance: att(Z, S, K, E), dropIns: [] },
  { date: "2026-04-27", attendance: att(Z, S, T), dropIns: [] },
  { date: "2026-04-29", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-05-02", attendance: att(Z, S, K, E, T), dropIns: [] },
  { date: "2026-05-04", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-05-06", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-05-09", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-05-11", attendance: att(Z, S, E, T, G), dropIns: [] },
  { date: "2026-05-13", attendance: att(Z, S, E, T, G), dropIns: [] },
  { date: "2026-05-16", attendance: att(Z, S, E, T, G), dropIns: [] },
  { date: "2026-05-18", attendance: att(Z, E, T), dropIns: [] },
  { date: "2026-05-20", attendance: att(Z, S, T), dropIns: [] },
  { date: "2026-05-23", attendance: att(Z, S, K, T), dropIns: [] },
  { date: "2026-05-25", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-27", attendance: att(E, T), dropIns: [] },
  { date: "2026-05-30", attendance: att(Z, K, E, T), dropIns: [] },
  { date: "2026-06-01", attendance: att(Z, E, G, KT, A), dropIns: [] },
  { date: "2026-06-03", attendance: att(Z, S, E, G), dropIns: [] },
  { date: "2026-06-06", attendance: att(Z, S), dropIns: [] },
  { date: "2026-06-08", attendance: att(Z, S, T, KT, A), dropIns: [] },
  { date: "2026-06-10", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-06-13", attendance: att(Z, S, K, E), dropIns: [] },
  { date: "2026-06-17", attendance: att(Z, S, E, T, KT, A, AV), dropIns: [] },
  { date: "2026-06-20", attendance: att(Z, S, E), dropIns: [] },
  { date: "2026-06-22", attendance: att(Z, S, K, E, KT), dropIns: [] },
  { date: "2026-06-24", attendance: att(Z, E, T), dropIns: [] },
  { date: "2026-06-27", attendance: att(Z, S, K, T, G), dropIns: [] },
  { date: "2026-06-29", attendance: att(Z, S, K, T, G), dropIns: [] },
  { date: "2026-07-01", attendance: att(Z, G, KT, A), dropIns: [] },
  { date: "2026-07-04", attendance: att(Z, K, E, T, G, A), dropIns: [] },
  { date: "2026-07-06", attendance: att(Z, E, KT), dropIns: [] },
  { date: "2026-07-08", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-07-11", attendance: att(Z, S, K), dropIns: [] },
  { date: "2026-07-13", attendance: att(Z, S, E, T, G, A), dropIns: [] },
  { date: "2026-07-15", attendance: att(Z, S, E, T, G, A), dropIns: [] },
  { date: "2026-07-18", attendance: att(Z, S, K, E), dropIns: [] },
  { date: "2026-07-20", attendance: att(Z, S, E, KT), dropIns: [] },
  { date: "2026-07-22", attendance: att(Z, S, E, T, ZS), dropIns: [] },
  { date: "2026-07-25", attendance: att(Z, K, E, T, A), dropIns: [] },
  { date: "2026-07-27", attendance: att(Z, T, G, KT), dropIns: [] },
  { date: "2026-07-29", attendance: att(Z, S, T, G, ZS), dropIns: [] },
  { date: "2026-08-03", attendance: att(Z, S, E, T), dropIns: [] },
  { date: "2026-08-05", attendance: att(Z, S, E, T, KT, A), dropIns: [] },
  { date: "2026-08-08", attendance: att(Z, S, E, T, KT, A, R), dropIns: [] },
  { date: "2026-08-10", attendance: att(Z, E, T, G, KT), dropIns: [] },
  { date: "2026-08-12", attendance: att(Z, S, E, T, ZS), dropIns: [] },
  { date: "2026-08-15", attendance: att(Z, E, T, R), dropIns: [] },
  { date: "2026-08-17", attendance: att(Z, E, T, G, KT), dropIns: [] },
  { date: "2026-08-19", attendance: att(Z, E, T, ZS), dropIns: [] },
  { date: "2026-08-22", attendance: att(Z, T), dropIns: [] },
];

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
  return { date: s.date, attendance: s.attendance, drop_ins: s.dropIns };
}

function rowToSession(r: Record<string, unknown>): Session {
  return {
    date: r.date as string,
    attendance: r.attendance as SessionAttendance[],
    dropIns: r.drop_ins as string[],
  };
}

export default function App() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [activeTab, setActiveTab] = useState("session");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: membersData } = await supabase.from("members").select("*");

      if (!membersData || membersData.length === 0) {
        await supabase.from("members").insert(initialMembers.map(memberToRow));
        await supabase.from("sessions").insert(initialSessions.map(sessionToRow));
      } else {
        setMembers(membersData.map(rowToMember));
        const { data: sessionsData } = await supabase.from("sessions").select("*");
        if (sessionsData) setSessions(sessionsData.map(rowToSession));
      }
      setLoading(false);
    }
    init();
  }, []);

  const updateMembers = (newMembers: Member[]) => {
    setMembers(newMembers);
    supabase.from("members")
      .upsert(newMembers.map(memberToRow), { onConflict: "id" })
      .then(({ error }) => { if (error) console.error("Members mentési hiba:", error); });
  };

  const updateSessions = (newSessions: Session[]) => {
    setSessions(newSessions);
    supabase.from("sessions")
      .upsert(newSessions.map(sessionToRow), { onConflict: "date" })
      .then(({ error }) => { if (error) console.error("Sessions mentési hiba:", error); });
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="size-full bg-background overflow-hidden flex flex-col">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
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
            <PassesTab members={members} setMembers={updateMembers} sessions={sessions} />
          </Tabs.Content>
          <Tabs.Content value="reports" className="h-full">
            <ReportsTab members={members} sessions={sessions} />
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
