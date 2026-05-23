import { useState } from "react";
import { Plus, X, Mail, Loader2 } from "lucide-react";
import emailjs from "@emailjs/browser";
import * as Progress from "@radix-ui/react-progress";
import * as Dialog from "@radix-ui/react-dialog";
import { Member, Session } from "../App";

const RECIPIENT_EMAIL = "szekely.zoltan92@gmail.com";

interface PassesTabProps {
  members: Member[];
  setMembers: (members: Member[]) => void;
  sessions: Session[];
}

function formatEmailDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}. ${days[date.getDay()]}`;
}

export default function PassesTab({ members, setMembers, sessions }: PassesTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // Sort members by passes remaining (lowest first)
  const sortedMembers = [...members].sort((a, b) => a.passesRemaining - b.passesRemaining);

  const handleRenew = (memberId: string) => {
    setMembers(
      members.map(m => {
        if (m.id === memberId) {
          const newPassCount = Math.max(0, 10 - m.debt);
          return {
            ...m,
            passesRemaining: newPassCount,
            totalPasses: 10,
            renewals: m.renewals + 1,
            sessionsUsed: 0,
            debt: 0,
          };
        }
        return m;
      })
    );
  };

  const handleSendEmail = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const attendedSessions = sessions
      .filter(session => {
        const attendance = session.attendance.find(a => a.memberId === memberId);
        return attendance?.checked;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(session => formatEmailDate(session.date));

    const sessionsList = attendedSessions.length > 0
      ? attendedSessions.join("\n")
      : "Még nincs rögzített edzés.";

    setSendingEmail(memberId);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: RECIPIENT_EMAIL,
          member_name: member.name,
          passes_remaining: member.passesRemaining,
          sessions_list: sessionsList,
          debt_line: member.debt > 0 ? `Fizetetlen alkalmak: ${member.debt}` : "",
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
      alert(`Email elküldve ${member.name} adataival!`);
    } catch (err) {
      console.error("Email küldési hiba:", err);
      alert("Hiba történt az email küldésekor. Ellenőrizd az EmailJS beállításokat.");
    } finally {
      setSendingEmail(null);
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;

    const newMember: Member = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      passesRemaining: 10,
      totalPasses: 10,
      renewals: 0,
      sessionsUsed: 0,
      debt: 0,
    };

    setMembers([...members, newMember]);
    setNewMemberName("");
    setIsAddModalOpen(false);
  };

  return (
    <div className="h-full overflow-auto pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="mb-6">Tagok Bérletei</h2>

        {/* Members List */}
        <div className="space-y-4 mb-6">
          {sortedMembers.map(member => {
            const progressPercent = (member.sessionsUsed / member.totalPasses) * 100;
            const isLow = member.passesRemaining <= 2;
            const isEmpty = member.passesRemaining === 0;

            return (
              <div
                key={member.id}
                className="bg-card border border-border rounded-lg p-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{member.name}</div>
                    <div
                      className={`text-sm mt-1 ${
                        isEmpty
                          ? "text-[#f87171]"
                          : isLow
                          ? "text-[#fb923c]"
                          : "text-muted-foreground"
                      }`}
                    >
                      {member.passesRemaining} / {member.totalPasses} alkalom maradt
                    </div>
                    {member.debt > 0 && (
                      <div className="flex items-center gap-1 text-xs text-[#f59e0b] mt-1">
                        <span>⚠</span>
                        <span>{member.debt} fizetetlen alkalom</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => handleSendEmail(member.id)}
                      disabled={sendingEmail === member.id}
                      className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingEmail === member.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Mail className="w-4 h-4" />
                      }
                    </button>
                    <button
                      onClick={() => handleRenew(member.id)}
                      className="px-3 py-1.5 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm whitespace-nowrap"
                    >
                      Megújít
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <Progress.Root
                  value={progressPercent}
                  max={100}
                  className="relative h-2 w-full overflow-hidden rounded-full bg-muted mb-3"
                >
                  <Progress.Indicator
                    className={`h-full transition-all duration-300 ${
                      isEmpty
                        ? "bg-[#f87171]"
                        : isLow
                        ? "bg-[#fb923c]"
                        : "bg-[#14b8a6]"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </Progress.Root>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{member.sessionsUsed} alkalom felhasználva</span>
                  <span>•</span>
                  <span>{member.renewals} megújítás</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Member Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full py-4 border-2 border-dashed border-muted-foreground/30 rounded-lg text-muted-foreground hover:border-[#14b8a6] hover:text-[#14b8a6] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Új tag hozzáadása
        </button>

        {/* Add Member Modal */}
        <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-lg p-6 w-[90vw] max-w-md z-50 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <Dialog.Title className="text-lg font-medium">Új Tag Hozzáadása</Dialog.Title>
                <Dialog.Close className="p-1 hover:bg-accent rounded">
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>

              <Dialog.Description className="text-sm text-muted-foreground mb-4">
                Add meg az új tag nevét. 10 alkalmas bérletet kap.
              </Dialog.Description>

              <input
                type="text"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddMember()}
                placeholder="Tag neve"
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50 mb-4"
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewMemberName("");
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Mégse
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="px-4 py-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hozzáadás
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
