import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Member, Session } from "../App";

interface ReportsTabProps {
  members: Member[];
  sessions: Session[];
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["V", "H", "K", "Sze", "Cs", "P", "Szo"];
  const months = ["jan.", "feb.", "már.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szep.", "okt.", "nov.", "dec."];
  return `${months[date.getMonth()]} ${date.getDate()}. (${days[date.getDay()]})`;
}

function getSessionTotal(session: Session): number {
  const passHolders = session.attendance.filter(a => a.checked).length;
  return session.totalOverride ?? passHolders + session.dropIns.length;
}

export default function ReportsTab({ members, sessions }: ReportsTabProps) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const handlePrevMonth = () => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const monthSessions = useMemo(() => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();

    return sessions
      .filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate.getMonth() === month && sessionDate.getFullYear() === year;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions, viewDate]);

  const stats = useMemo(() => {
    let total = 0;
    let passHolders = 0;
    let maxAttendance = 1;

    for (const s of monthSessions) {
      const sessionTotal = getSessionTotal(s);
      const sessionPassHolders = s.attendance.filter(a => a.checked).length;
      total += sessionTotal;
      passHolders += sessionPassHolders;
      maxAttendance = Math.max(maxAttendance, sessionTotal);
    }

    return {
      total,
      passHolders,
      guests: Math.max(0, total - passHolders),
      sessionCount: monthSessions.length,
      maxAttendance,
    };
  }, [monthSessions]);

  const monthName = viewDate.toLocaleString("hu-HU", { year: "numeric", month: "long" });

  return (
    <div className="h-full overflow-auto pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="mb-6">Statisztika</h2>

        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h3 className="text-center capitalize">{monthName}</h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Stat Tiles */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-4xl text-[#14b8a6] mb-2">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Összesen</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-4xl text-[#14b8a6] mb-2">{stats.passHolders}</div>
            <div className="text-sm text-muted-foreground">Bérletesek</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-4xl text-[#14b8a6] mb-2">{stats.guests}</div>
            <div className="text-sm text-muted-foreground">Vendégek</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-4xl text-[#14b8a6] mb-2">{stats.sessionCount}</div>
            <div className="text-sm text-muted-foreground">Edzések</div>
          </div>
        </div>

        {/* Monthly Session List */}
        <div>
          <h3 className="text-sm text-muted-foreground px-1 mb-3 capitalize">
            {monthName} edzései
          </h3>

          {monthSessions.length > 0 ? (
            <div className="space-y-3">
              {monthSessions.map(session => {
                const passHolders = session.attendance.filter(a => a.checked).length;
                const total = getSessionTotal(session);
                const guests = Math.max(0, total - passHolders);
                const barWidth = (total / stats.maxAttendance) * 100;

                return (
                  <div
                    key={session.date}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{formatSessionDate(session.date)}</div>
                      <div className="text-sm text-muted-foreground">{total} résztvevő</div>
                    </div>

                    {/* Bar Chart */}
                    <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-[#14b8a6] transition-all duration-300 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Breakdown */}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{passHolders} bérletes</span>
                      <span>•</span>
                      <span>{guests} vendég</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8 capitalize">
              Nincs rögzített edzés {monthName} hónapban
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
