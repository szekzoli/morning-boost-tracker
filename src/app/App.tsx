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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: membersData } = await supabase.from("members").select("*");
      if (membersData) setMembers(sortMembers(membersData.map(rowToMember)));
      const { data: sessionsData } = await supabase.from("sessions").select("*");
      if (sessionsData) setSessions(sessionsData.map(rowToSession));
      setLoading(false);
    }
    init();
  }, []);

  const updateMembers = (newMembers: Member[]) => {
    const sorted = sortMembers(newMembers);
    setMembers(sorted);
    supabase.from("members")
      .upsert(sorted.map(memberToRow), { onConflict: "id" })
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
