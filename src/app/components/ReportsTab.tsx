import { useMemo } from "react";
import { Member, Session } from "../App";

interface ReportsTabProps {
  members: Member[];
  sessions: Session[];
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
}

export default function ReportsTab({ members, sessions }: ReportsTabProps) {
  // Calculate current month sessions
  const currentMonthSessions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return sessions
      .filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions]);

  // Calculate stats
  const stats = useMemo(() => {
    const currentMonthTotal = currentMonthSessions.reduce((sum, s) => {
      const passHolders = s.attendance.filter(a => a.checked).length;
      const dropIns = s.dropIns.length;
      return sum + passHolders + dropIns;
    }, 0);

    const allTimeTotal = sessions.reduce((sum, s) => {
      const passHolders = s.attendance.filter(a => a.checked).length;
      const dropIns = s.dropIns.length;
      return sum + passHolders + dropIns;
    }, 0);

    const maxAttendance = Math.max(
      ...currentMonthSessions.map(s => {
        const passHolders = s.attendance.filter(a => a.checked).length;
        const dropIns = s.dropIns.length;
        return passHolders + dropIns;
      }),
      1
    );

    return {
      currentMonthTotal,
      allTimeTotal,
      maxAttendance,
    };
  }, [sessions, currentMonthSessions]);

  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="h-full overflow-auto pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="mb-6">Reports</h2>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-4xl text-[#14b8a6] mb-2">{stats.currentMonthTotal}</div>
            <div className="text-sm text-muted-foreground">{currentMonthName} Attendees</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-4xl text-[#14b8a6] mb-2">{stats.allTimeTotal}</div>
            <div className="text-sm text-muted-foreground">All-Time Total</div>
          </div>
        </div>

        {/* Monthly Session List */}
        <div>
          <h3 className="text-sm text-muted-foreground px-1 mb-3">
            {currentMonthName} Sessions
          </h3>

          {currentMonthSessions.length > 0 ? (
            <div className="space-y-3">
              {currentMonthSessions.map(session => {
                const passHolders = session.attendance.filter(a => a.checked).length;
                const dropIns = session.dropIns.length;
                const total = passHolders + dropIns;
                const barWidth = (total / stats.maxAttendance) * 100;

                return (
                  <div
                    key={session.date}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{formatSessionDate(session.date)}</div>
                      <div className="text-sm text-muted-foreground">{total} attendees</div>
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
                      <span>{passHolders} pass holders</span>
                      <span>•</span>
                      <span>{dropIns} drop-ins</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">
              No sessions recorded for {currentMonthName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
