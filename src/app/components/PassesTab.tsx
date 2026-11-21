import { useState } from "react";
import { Plus, X, Mail, Loader2, History, Pencil } from "lucide-react";
import emailjs from "@emailjs/browser";
import * as Progress from "@radix-ui/react-progress";
import * as Dialog from "@radix-ui/react-dialog";
import { Member, Session } from "../App";
import { fromYmd } from "../../lib/dates";

const RECIPIENT_EMAIL = "szekely.zoltan92@gmail.com";

interface PassesTabProps {
  members: Member[];
  setMembers: (members: Member[]) => void;
  sessions: Session[];
  onDeleteMember: (id: string) => Promise<void>;
}

const inputCls =
  "w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/50";
const dialogCls =
  "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-lg p-6 w-[90vw] max-w-md z-50 shadow-lg";

function formatEmailDate(dateStr: string): string {
  const date = fromYmd(dateStr);
  const days = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}. ${days[date.getDay()]}`;
}

export default function PassesTab({ members, setMembers, sessions, onDeleteMember }: PassesTabProps) {
  const [renewId, setRenewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const renewMember = members.find(m => m.id === renewId) || null;
  const editMember = members.find(m => m.id === editId) || null;

  const openEdit = (m: Member) => {
    setEditId(m.id);
    setEditName(m.name);
    setEditEmail(m.email);
    setConfirmDelete(false);
  };

  const saveEdit = () => {
    if (!editMember || !editName.trim()) return;
    setMembers(members.map(m => (m.id === editMember.id ? { ...m, name: editName.trim(), email: editEmail.trim() } : m)));
    setEditId(null);
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [historyMemberId, setHistoryMemberId] = useState<string | null>(null);

  const getCurrentPassDates = (memberId: string, count: number): string[] => {
    return sessions
      .filter(session => session.attendance.find(a => a.memberId === memberId && a.checked))
      .map(session => session.date)
      .sort()
      .slice(-count)
      .reverse();
  };

  const getTotalAttendedCount = (memberId: string): number => {
    return sessions.filter(session => session.attendance.find(a => a.memberId === memberId && a.checked)).length;
  };

  const historyMember = members.find(m => m.id === historyMemberId) || null;
  const historyDates = historyMember
    ? getCurrentPassDates(historyMember.id, historyMember.totalPasses - historyMember.passesRemaining)
    : [];
  const historyTotalCount = historyMember ? getTotalAttendedCount(historyMember.id) : 0;

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
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(session => formatEmailDate(session.date));

    let sessionsList = "Még nincs rögzített edzés.";
    if (attendedSessions.length > 0) {
      const groups: string[] = [];
      for (let i = 0; i < attendedSessions.length; i += 10) {
        const chunk = attendedSessions.slice(i, i + 10).reverse();
        const passNum = Math.floor(i / 10) + 1;
        groups.push(`${passNum}. bérlet:\n${chunk.join("\n")}`);
      }
      sessionsList = groups.reverse().join("\n\n");
    }

    setSendingEmail(memberId);
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: member.email || RECIPIENT_EMAIL,
          member_name: member.name,
          passes_remaining: member.passesRemaining,
          sessions_list: sessionsList,
          debt_line: member.debt > 0 ? `<p style="margin: 4px 0; font-size: 15px; color: #ef4444;">⚠️ Rendezetlen alkalmak: <strong>${member.debt}</strong></p>` : "",
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
      email: "",
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
          {members.map(member => {
            const progressPercent = ((member.totalPasses - member.passesRemaining) / member.totalPasses) * 100;
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
                    <button
                      onClick={() => openEdit(member)}
                      className="flex max-w-full items-center gap-1.5 text-left font-medium"
                      aria-label={`${member.name} adatainak szerkesztése`}
                    >
                      <span className="truncate">{member.name}</span>
                      <Pencil className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    </button>
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
                      aria-label="Bérletösszesítő küldése e-mailben"
                      title="Bérletösszesítő küldése e-mailben"
                      className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingEmail === member.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Mail className="w-4 h-4" />
                      }
                    </button>
                    <button
                      onClick={() => setHistoryMemberId(member.id)}
                      aria-label="Alkalmak a jelenlegi bérletben"
                      title="Alkalmak a jelenlegi bérletben"
                      className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRenewId(member.id)}
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

        {/* Megújítás megerősítése */}
        <Dialog.Root open={!!renewMember} onOpenChange={open => !open && setRenewId(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className={dialogCls}>
              <Dialog.Title className="text-lg font-medium">Bérlet megújítása</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-2 mb-5">
                {renewMember && (
                  <>
                    <strong className="text-foreground">{renewMember.name}</strong> új, 10 alkalmas bérletet kap
                    {renewMember.debt > 0
                      ? `. A ${renewMember.debt} fizetetlen alkalmat levonom belőle, így ${Math.max(0, 10 - renewMember.debt)} alkalom marad.`
                      : "."}
                  </>
                )}
              </Dialog.Description>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRenewId(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors">
                  Mégse
                </button>
                <button
                  onClick={() => {
                    if (renewMember) handleRenew(renewMember.id);
                    setRenewId(null);
                  }}
                  className="px-4 py-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] transition-colors"
                >
                  Megújítom
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Tag szerkesztése / törlése */}
        <Dialog.Root open={!!editMember} onOpenChange={open => !open && setEditId(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className={dialogCls}>
              <div className="flex items-start justify-between mb-4">
                <Dialog.Title className="text-lg font-medium">Tag adatai</Dialog.Title>
                <Dialog.Close className="p-1 hover:bg-accent rounded" aria-label="Bezárás">
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">A tag nevének és e-mail-címének módosítása.</Dialog.Description>
              <label className="block text-sm mb-1">Név</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className={`${inputCls} mb-3`} />
              <label className="block text-sm mb-1">E-mail (a bérletösszesítőhöz)</label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="nem kötelező"
                className={`${inputCls} mb-5`}
              />
              {confirmDelete ? (
                <div className="rounded-lg border border-[#f87171] p-3 text-sm">
                  <p>Biztosan törlöd? A korábbi jelenlétei a statisztikában megmaradnak, de a tag eltűnik a listákból.</p>
                  <div className="mt-3 flex gap-2 justify-end">
                    <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 border border-border rounded-lg">
                      Mégse
                    </button>
                    <button
                      onClick={async () => {
                        if (editMember) await onDeleteMember(editMember.id);
                        setEditId(null);
                      }}
                      className="px-3 py-1.5 bg-[#ef4444] text-white rounded-lg"
                    >
                      Törlés
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setConfirmDelete(true)} className="mr-auto text-sm text-[#ef4444] hover:underline">
                    Tag törlése
                  </button>
                  <button onClick={() => setEditId(null)} className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors">
                    Mégse
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={!editName.trim()}
                    className="px-4 py-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] transition-colors disabled:opacity-50"
                  >
                    Mentés
                  </button>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

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

        {/* Current Pass History Modal */}
        <Dialog.Root open={!!historyMemberId} onOpenChange={open => !open && setHistoryMemberId(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-lg p-6 w-[90vw] max-w-md z-50 shadow-lg max-h-[80vh] overflow-auto">
              <div className="flex items-start justify-between mb-4">
                <Dialog.Title className="text-lg font-medium">
                  {historyMember?.name} – jelenlegi bérlet alkalmai
                </Dialog.Title>
                <Dialog.Close className="p-1 hover:bg-accent rounded">
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </div>

              <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-3 mb-4">
                <span className="text-sm text-muted-foreground">Összes edzés</span>
                <span className="text-lg font-medium text-[#14b8a6]">{historyTotalCount}</span>
              </div>

              {historyDates.length > 0 ? (
                <ul className="space-y-2">
                  {historyDates.map(date => (
                    <li
                      key={date}
                      className="px-3 py-2 bg-muted rounded-lg text-sm"
                    >
                      {formatEmailDate(date)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Még nincs rögzített alkalom ebben a bérletben.
                </p>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
