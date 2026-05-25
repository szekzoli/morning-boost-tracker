import { useState, useMemo } from "react";
import { Calendar, Users, BarChart3 } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import SessionTab from "./components/SessionTab";
import PassesTab from "./components/PassesTab";
import ReportsTab from "./components/ReportsTab";

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
  { id: "1", name: "Zoli", email: "bagdi.zoltan1@hotmail.com", passesRemaining: 4, totalPasses: 10, renewals: 5, sessionsUsed: 6, debt: 0 },
  { id: "2", name: "Kornél", email: "", passesRemaining: 0, totalPasses: 10, renewals: 0, sessionsUsed: 10, debt: 2 },
  { id: "3", name: "Szandra", email: "fintoralexandra@gmail.com", passesRemaining: 0, totalPasses: 10, renewals: 2, sessionsUsed: 10, debt: 1 },
  { id: "4", name: "Ercsi", email: "", passesRemaining: 1, totalPasses: 10, renewals: 0, sessionsUsed: 9, debt: 0 },
  { id: "5", name: "Timi", email: "", passesRemaining: 3, totalPasses: 10, renewals: 0, sessionsUsed: 7, debt: 0 },
  { id: "6", name: "Kuffart Gábor", email: "", passesRemaining: 7, totalPasses: 10, renewals: 0, sessionsUsed: 3, debt: 0 },
];

const Z = "1";
const S = "3";
const att = (...ids: string[]) => ids.map(id => ({ memberId: id, checked: true }));

const initialSessions: Session[] = [
  { date: "2026-01-10", attendance: att(Z), dropIns: [] },
  { date: "2026-01-12", attendance: att(Z), dropIns: [] },
  { date: "2026-01-14", attendance: att(Z), dropIns: [] },
  { date: "2026-01-17", attendance: att(Z), dropIns: [] },
  { date: "2026-01-19", attendance: att(Z), dropIns: [] },
  { date: "2026-01-21", attendance: att(Z), dropIns: [] },
  { date: "2026-01-24", attendance: att(Z), dropIns: [] },
  { date: "2026-01-26", attendance: att(Z), dropIns: [] },
  { date: "2026-01-28", attendance: att(Z), dropIns: [] },
  { date: "2026-01-31", attendance: att(Z), dropIns: [] },
  { date: "2026-02-02", attendance: att(Z), dropIns: [] },
  { date: "2026-02-04", attendance: att(Z), dropIns: [] },
  { date: "2026-02-07", attendance: att(Z), dropIns: [] },
  { date: "2026-02-09", attendance: att(Z), dropIns: [] },
  { date: "2026-02-11", attendance: att(Z), dropIns: [] },
  { date: "2026-02-14", attendance: att(Z), dropIns: [] },
  { date: "2026-02-18", attendance: att(Z), dropIns: [] },
  { date: "2026-02-21", attendance: att(Z), dropIns: [] },
  { date: "2026-02-23", attendance: att(Z), dropIns: [] },
  { date: "2026-02-25", attendance: att(Z, S), dropIns: [] },
  { date: "2026-02-28", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-02", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-04", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-07", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-09", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-11", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-14", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-16", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-23", attendance: att(Z), dropIns: [] },
  { date: "2026-03-25", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-28", attendance: att(Z, S), dropIns: [] },
  { date: "2026-03-30", attendance: att(Z), dropIns: [] },
  { date: "2026-04-01", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-04", attendance: att(Z), dropIns: [] },
  { date: "2026-04-06", attendance: att(Z), dropIns: [] },
  { date: "2026-04-08", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-11", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-13", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-15", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-18", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-20", attendance: att(Z), dropIns: [] },
  { date: "2026-04-22", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-25", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-27", attendance: att(Z, S), dropIns: [] },
  { date: "2026-04-29", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-02", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-04", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-06", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-09", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-11", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-13", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-16", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-18", attendance: att(Z), dropIns: [] },
  { date: "2026-05-20", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-23", attendance: att(Z, S), dropIns: [] },
  { date: "2026-05-25", attendance: att(Z, S), dropIns: [] },
];

export default function App() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [activeTab, setActiveTab] = useState("session");

  return (
    <div className="size-full bg-background overflow-hidden flex flex-col">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          <Tabs.Content value="session" className="h-full">
            <SessionTab
              members={members}
              setMembers={setMembers}
              sessions={sessions}
              setSessions={setSessions}
            />
          </Tabs.Content>
          <Tabs.Content value="passes" className="h-full">
            <PassesTab members={members} setMembers={setMembers} sessions={sessions} />
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
