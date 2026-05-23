import { useState, useMemo } from "react";
import { Calendar, Users, BarChart3 } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import SessionTab from "./components/SessionTab";
import PassesTab from "./components/PassesTab";
import ReportsTab from "./components/ReportsTab";

export interface Member {
  id: string;
  name: string;
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
  { id: "1", name: "Zoli", passesRemaining: 6, totalPasses: 10, renewals: 0, sessionsUsed: 4, debt: 0 },
  { id: "2", name: "Kornél", passesRemaining: 0, totalPasses: 10, renewals: 0, sessionsUsed: 10, debt: 2 },
  { id: "3", name: "Szandra", passesRemaining: 1, totalPasses: 10, renewals: 0, sessionsUsed: 9, debt: 0 },
  { id: "4", name: "Ercsi", passesRemaining: 1, totalPasses: 10, renewals: 0, sessionsUsed: 9, debt: 0 },
  { id: "5", name: "Timi", passesRemaining: 3, totalPasses: 10, renewals: 0, sessionsUsed: 7, debt: 0 },
  { id: "6", name: "Kuffart Gábor", passesRemaining: 7, totalPasses: 10, renewals: 0, sessionsUsed: 3, debt: 0 },
];

const initialSessions: Session[] = [];

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
