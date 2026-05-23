import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, Plus } from "lucide-react";
import { Member, Session, SessionAttendance } from "../App";

interface SessionTabProps {
  members: Member[];
  setMembers: (members: Member[]) => void;
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
}

// Get next Mon/Wed/Sat from a date
function getNextSessionDate(fromDate: Date): Date {
  const day = fromDate.getDay();
  const daysUntilNext = [1, 3, 6] // Mon, Wed, Sat
    .map(targetDay => {
      let diff = targetDay - day;
      if (diff <= 0) diff += 7;
      return diff;
    })
    .sort((a, b) => a - b)[0];

  const next = new Date(fromDate);
  next.setDate(next.getDate() + daysUntilNext);
  return next;
}

function getPrevSessionDate(fromDate: Date): Date {
  const day = fromDate.getDay();
  const daysSincePrev = [1, 3, 6] // Mon, Wed, Sat
    .map(targetDay => {
      let diff = day - targetDay;
      if (diff <= 0) diff += 7;
      return diff;
    })
    .sort((a, b) => a - b)[0];

  const prev = new Date(fromDate);
  prev.setDate(prev.getDate() - daysSincePrev);
  return prev;
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["V", "H", "K", "Sze", "Cs", "P", "Szo"];
  const months = ["jan.", "feb.", "már.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szep.", "okt.", "nov.", "dec."];
  return `${date.getFullYear()}. ${months[date.getMonth()]} ${date.getDate()}. (${days[date.getDay()]})`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SessionTab({ members, setMembers, sessions, setSessions }: SessionTabProps) {
  // Find today or next session date
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todayDay = today.getDay();

  const initialSessionDate = useMemo(() => {
    // If today is Mon/Wed/Sat, use today
    if ([1, 3, 6].includes(todayDay)) {
      return todayStr;
    }
    // Otherwise get next session date
    return getNextSessionDate(today).toISOString().split("T")[0];
  }, []);

  const [currentSessionDate, setCurrentSessionDate] = useState(initialSessionDate);
  const [dropInInput, setDropInInput] = useState("");

  // Get or create current session
  const currentSession = useMemo(() => {
    return sessions.find(s => s.date === currentSessionDate) || {
      date: currentSessionDate,
      attendance: [],
      dropIns: [],
    };
  }, [sessions, currentSessionDate]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const passHolders = currentSession.attendance.filter(a => a.checked).length;
    const dropIns = currentSession.dropIns.length;
    return {
      total: passHolders + dropIns,
      passHolders,
      dropIns,
    };
  }, [currentSession]);

  const handlePrevSession = () => {
    const prev = getPrevSessionDate(new Date(currentSessionDate));
    setCurrentSessionDate(prev.toISOString().split("T")[0]);
  };

  const handleNextSession = () => {
    const next = getNextSessionDate(new Date(currentSessionDate));
    setCurrentSessionDate(next.toISOString().split("T")[0]);
  };

  const handleToggleAttendance = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const attendanceRecord = currentSession.attendance.find(a => a.memberId === memberId);
    const isCurrentlyChecked = attendanceRecord?.checked || false;

    // Update session attendance
    const updatedSessions = sessions.map(s => {
      if (s.date === currentSessionDate) {
        const otherAttendance = s.attendance.filter(a => a.memberId !== memberId);
        return {
          ...s,
          attendance: [...otherAttendance, { memberId, checked: !isCurrentlyChecked }],
        };
      }
      return s;
    });

    // If session doesn't exist yet, create it
    if (!sessions.find(s => s.date === currentSessionDate)) {
      updatedSessions.push({
        date: currentSessionDate,
        attendance: [{ memberId, checked: true }],
        dropIns: [],
      });
    }

    setSessions(updatedSessions);

    // Update member passes, debt, and sessions used
    setMembers(members.map(m => {
      if (m.id === memberId) {
        if (isCurrentlyChecked) {
          // Unchecking - restore pass or reduce debt
          if (m.debt > 0) {
            return {
              ...m,
              debt: m.debt - 1,
              sessionsUsed: Math.max(0, m.sessionsUsed - 1),
            };
          } else {
            return {
              ...m,
              passesRemaining: m.passesRemaining + 1,
              sessionsUsed: Math.max(0, m.sessionsUsed - 1),
            };
          }
        } else {
          // Checking - deduct pass or add debt
          if (m.passesRemaining > 0) {
            return {
              ...m,
              passesRemaining: m.passesRemaining - 1,
              sessionsUsed: m.sessionsUsed + 1,
            };
          } else {
            return {
              ...m,
              debt: m.debt + 1,
              sessionsUsed: m.sessionsUsed + 1,
            };
          }
        }
      }
      return m;
    }));
  };

  const handleAddDropIn = () => {
    if (!dropInInput.trim()) return;

    const updatedSessions = sessions.map(s => {
      if (s.date === currentSessionDate) {
        return {
          ...s,
          dropIns: [...s.dropIns, dropInInput.trim()],
        };
      }
      return s;
    });

    // If session doesn't exist yet, create it
    if (!sessions.find(s => s.date === currentSessionDate)) {
      updatedSessions.push({
        date: currentSessionDate,
        attendance: [],
        dropIns: [dropInInput.trim()],
      });
    }

    setSessions(updatedSessions);
    setDropInInput("");
  };

  return (
    <div className="h-full overflow-auto pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Session Navigator */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevSession}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-center">{formatSessionDate(currentSessionDate)}</h2>
          <button
            onClick={handleNextSession}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Summary Chips */}
        <div className="flex gap-3 mb-6 overflow-x-auto">
          <div className="flex-1 min-w-[100px] bg-card border border-border rounded-lg px-4 py-3 text-center">
            <div className="text-2xl text-[#14b8a6]">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">Összesen</div>
          </div>
          <div className="flex-1 min-w-[100px] bg-card border border-border rounded-lg px-4 py-3 text-center">
            <div className="text-2xl text-[#14b8a6]">{stats.passHolders}</div>
            <div className="text-xs text-muted-foreground mt-1">Bérletesek</div>
          </div>
          <div className="flex-1 min-w-[100px] bg-card border border-border rounded-lg px-4 py-3 text-center">
            <div className="text-2xl text-[#14b8a6]">{stats.dropIns}</div>
            <div className="text-xs text-muted-foreground mt-1">Vendégek</div>
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm text-muted-foreground px-1">Tagok</h3>
          {members.map(member => {
            const attendanceRecord = currentSession.attendance.find(a => a.memberId === member.id);
            const isChecked = attendanceRecord?.checked || false;

            return (
              <div
                key={member.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#14b8a6] text-white flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">{getInitials(member.name)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{member.name}</div>
                  <div
                    className={`text-sm ${
                      member.passesRemaining === 0
                        ? "text-[#f87171]"
                        : member.passesRemaining <= 2
                        ? "text-[#fb923c]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {member.passesRemaining} alkalom maradt
                  </div>
                  {member.debt > 0 && (
                    <div className="flex items-center gap-1 text-xs text-[#f59e0b] mt-1">
                      <span>⚠</span>
                      <span>{member.debt} fizetetlen alkalom</span>
                    </div>
                  )}
                </div>

                {/* Check Button */}
                <button
                  onClick={() => handleToggleAttendance(member.id)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    isChecked
                      ? "bg-[#14b8a6] border-[#14b8a6] text-white"
                      : "border-muted-foreground hover:border-[#14b8a6] hover:bg-[#14b8a6]/10"
                  }`}
                >
                  {isChecked && <Check className="w-5 h-5" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Drop-ins Section */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm text-muted-foreground px-1">Vendégek</h3>
          {currentSession.dropIns.length > 0 ? (
            <div className="space-y-2">
              {currentSession.dropIns.map((name, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{getInitials(name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-sm text-muted-foreground">Vendég</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-4">
              Még nincs vendég
            </div>
          )}
        </div>

        {/* Add Drop-in Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={dropInInput}
            onChange={e => setDropInInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddDropIn()}
            placeholder="Vendég neve"
            className="flex-1 px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50"
          />
          <button
            onClick={handleAddDropIn}
            disabled={!dropInInput.trim()}
            className="px-4 py-3 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
