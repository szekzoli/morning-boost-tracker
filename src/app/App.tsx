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

// Initialize with some sample data
const initialMembers: Member[] = [
  { id: "1", name: "Sarah Chen", passesRemaining: 3, totalPasses: 10, renewals: 2, sessionsUsed: 7, debt: 0 },
  { id: "2", name: "Mike Torres", passesRemaining: 8, totalPasses: 10, renewals: 1, sessionsUsed: 2, debt: 0 },
  { id: "3", name: "Emma Wilson", passesRemaining: 0, totalPasses: 10, renewals: 3, sessionsUsed: 10, debt: 2 },
  { id: "4", name: "James Park", passesRemaining: 5, totalPasses: 10, renewals: 0, sessionsUsed: 5, debt: 0 },
  { id: "5", name: "Lisa Kumar", passesRemaining: 1, totalPasses: 10, renewals: 4, sessionsUsed: 9, debt: 0 },
];

const initialSessions: Session[] = [
  {
    date: "2026-05-19", // Monday
    attendance: [
      { memberId: "1", checked: true },
      { memberId: "2", checked: true },
      { memberId: "4", checked: false },
    ],
    dropIns: ["Alex Martinez"],
  },
  {
    date: "2026-05-21", // Wednesday
    attendance: [
      { memberId: "1", checked: true },
      { memberId: "5", checked: true },
    ],
    dropIns: [],
  },
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
            <span className="text-xs">Session</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="passes"
            className="flex-1 flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:text-[#14b8a6] data-[state=inactive]:text-muted-foreground transition-colors"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Passes</span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="reports"
            className="flex-1 flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:text-[#14b8a6] data-[state=inactive]:text-muted-foreground transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Reports</span>
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}
