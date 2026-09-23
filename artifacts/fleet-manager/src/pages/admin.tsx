import { useAuth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getAdminStats, getAdminTickets, updateAdminTicket, type AdminStats, type SupportTicket } from "@/lib/workspace";
import { AlertTriangle, BarChart3, CheckCircle2, ChevronRight, Filter, LifeBuoy, LogOut, MessageSquare, RefreshCw, Search, ShieldCheck, Users, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

const emptyStats: AdminStats = {
  totalUsers: 0, totalOwners: 0, totalDrivers: 0, activeSubscriptions: 0,
  expiredSubscriptions: 0, openSupportTickets: 0, highPriorityTickets: 0, totalTickets: 0,
};

const supportCategories = [
  "Report a Problem",
  "Payment/Subscription Issue",
  "Login/Account Issue",
  "Vehicle/Driver Issue",
  "Attendance Issue",
  "Work Log Issue",
  "Receipt/Report Issue",
  "Other",
];

export default function AdminDashboard() {
  const { user, session, signOut } = useAuth();
  const [stats, setStats] = useState(emptyStats);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeFocus, setActiveFocus] = useState("All support");

  const load = async () => {
    if (!session) return;
    try {
      const [summary, list] = await Promise.all([
        getAdminStats(session.access_token),
        getAdminTickets(session.access_token, { search, status, priority, category }),
      ]);
      setStats(summary.stats);
      setTickets(list.tickets);
      setSelected((current) => current ? list.tickets.find((ticket) => ticket.id === current.id) || current : list.tickets[0] || null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the admin dashboard");
    }
  };
  useEffect(() => { void load(); }, [session, status, priority, category]);

  if (!user || !session || !isAdminEmail(user.email)) {
    return <main className="fm-admin-shell flex items-center justify-center p-6"><div className="max-w-md rounded-3xl border border-border bg-card p-7 text-center"><ShieldCheck className="mx-auto text-primary" size={40} /><h1 className="mt-4 text-2xl font-black">Admin access only</h1><p className="mt-2 text-sm text-muted-foreground">This dashboard is restricted to authorized Fleetvix administrators.</p><button type="button" onClick={() => void signOut()} className="mt-5 rounded-xl bg-primary px-5 py-3 font-black text-primary-foreground">Back to sign in</button></div></main>;
  }

  const saveTicket = async (payload: { status?: SupportTicket["status"]; priority?: SupportTicket["priority"]; adminReply?: string }) => {
    if (!session || !selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await updateAdminTicket(session.access_token, selected.id, payload);
      setSelected(result.ticket);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this ticket");
    } finally {
      setBusy(false);
    }
  };
  const applyFocus = (label: string) => {
    setActiveFocus(label);
    setSearch("");
    setCategory("");
    if (label === "Open support") {
      setStatus("Open");
      setPriority("");
    } else if (label === "Urgent problems") {
      setStatus("");
      setPriority("High");
    } else if (label === "Resolved history") {
      setStatus("Resolved");
      setPriority("");
    } else {
      setStatus("");
      setPriority("");
    }
  };
  const applyCategory = (value: string) => {
    setActiveFocus(value || "All support");
    setStatus("");
    setPriority("");
    setCategory(value);
  };
  const statCards: Array<{ label: string; value: number; Icon: LucideIcon }> = [
    { label: "Total Users", value: stats.totalUsers, Icon: Users },
    { label: "Owners", value: stats.totalOwners, Icon: ShieldCheck },
    { label: "Drivers", value: stats.totalDrivers, Icon: Users },
    { label: "Open Tickets", value: stats.openSupportTickets, Icon: MessageSquare },
    { label: "High Priority", value: stats.highPriorityTickets, Icon: Filter },
    { label: "Active Subs", value: stats.activeSubscriptions, Icon: CheckCircle2 },
    { label: "Expired Subs", value: stats.expiredSubscriptions, Icon: X },
    { label: "All Tickets", value: stats.totalTickets, Icon: MessageSquare },
  ];

  return (
    <main className="fm-admin-shell">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-[#101b2a] px-5 py-4">
        <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Fleetvix control room</p><h1 className="text-2xl font-black">Admin Dashboard</h1><p className="text-xs text-muted-foreground">{user.email}</p></div>
        <div className="flex items-center gap-2"><Link href="/" className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground">Exit</Link><button type="button" onClick={() => void signOut()} className="rounded-xl border border-rose-400/30 p-2 text-rose-300" aria-label="Log out"><LogOut size={17} /></button></div>
      </header>
       <div className="min-h-0 flex-1 overflow-hidden p-4 md:p-5">
        <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,.9fr)]">
          <section className="flex min-h-0 flex-col gap-4">
             <div className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4">
               {statCards.map(({ label, value, Icon }) => (
                 <button key={label} type="button" onClick={() => applyFocus(label === "Open Tickets" ? "Open support" : label === "High Priority" ? "Urgent problems" : label === "All Tickets" ? "All support" : label)} className="rounded-2xl border border-border bg-card p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/5 active:scale-[.98]">
                   <Icon size={16} className="text-primary" /><strong className="mt-2 block text-2xl font-black">{value}</strong><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                 </button>
               ))}
            </div>
             <div className="shrink-0 rounded-2xl border border-border bg-card p-3">
               <div className="flex items-center justify-between gap-3">
                 <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Admin tools</p><h2 className="mt-1 text-sm font-black">Investigate problems and account activity</h2></div>
                 <button type="button" onClick={() => void load()} className="rounded-xl border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary" aria-label="Refresh admin data"><RefreshCw size={16} /></button>
               </div>
               <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                 <button type="button" onClick={() => applyFocus("All support")} className={`fm-admin-tool ${activeFocus === "All support" ? "is-active" : ""}`}><LifeBuoy size={15} />All support</button>
                 <button type="button" onClick={() => applyFocus("Open support")} className={`fm-admin-tool ${activeFocus === "Open support" ? "is-active" : ""}`}><MessageSquare size={15} />Open problems</button>
                 <button type="button" onClick={() => applyFocus("Urgent problems")} className={`fm-admin-tool ${activeFocus === "Urgent problems" ? "is-active" : ""}`}><AlertTriangle size={15} />Urgent</button>
                 <button type="button" onClick={() => applyCategory("Vehicle/Driver Issue")} className={`fm-admin-tool ${activeFocus === "Vehicle/Driver Issue" ? "is-active" : ""}`}><Users size={15} />Fleet issues</button>
                 <button type="button" onClick={() => applyCategory("Login/Account Issue")} className={`fm-admin-tool ${activeFocus === "Login/Account Issue" ? "is-active" : ""}`}><ShieldCheck size={15} />Access</button>
                 <button type="button" onClick={() => applyFocus("Resolved history")} className={`fm-admin-tool ${activeFocus === "Resolved history" ? "is-active" : ""}`}><CheckCircle2 size={15} />Resolved</button>
               </div>
             </div>
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card">
              <div className="flex shrink-0 flex-wrap gap-2 border-b border-border p-3">
                <div className="relative min-w-[180px] flex-1"><Search size={15} className="absolute left-3 top-3 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void load()} placeholder="Search ticket, email or subject" className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" /></div>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-border bg-background px-3 text-xs font-bold"><option value="">All statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option><option>Closed</option></select>
                <select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-xl border border-border bg-background px-3 text-xs font-bold"><option value="">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
                 <select value={category} onChange={(event) => applyCategory(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold md:flex-none"><option value="">All problem types</option>{supportCategories.map((item) => <option key={item}>{item}</option>)}</select>
              </div>
               <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><BarChart3 size={13} className="text-primary" />Showing {activeFocus} · {tickets.length} result{tickets.length === 1 ? "" : "s"}</div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <button
                      type="button"
                      key={ticket.id}
                      onClick={() => { setSelected(ticket); setReply(ticket.adminReply || ""); }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected?.id === ticket.id ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50"}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <strong className="truncate text-sm">{ticket.subject}</strong>
                          <span className={`fm-status ${ticket.priority === "High" ? "fm-status-maintenance" : "fm-status-idle"}`}>{ticket.priority}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{ticket.userName || ticket.userEmail} · {ticket.category}</p>
                      </div>
                      <span className="text-right text-[10px] font-bold text-muted-foreground">{ticket.status}<ChevronRight size={15} className="ml-auto" /></span>
                    </button>
                  ))}
                </div>
                {!tickets.length && <p className="py-10 text-center text-sm text-muted-foreground">No tickets match these filters.</p>}
              </div>
            </div>
          </section>
          <section className="min-h-0 overflow-y-auto rounded-2xl border border-border bg-card p-4">
            {selected ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-primary">{selected.id}</p><h2 className="mt-1 text-xl font-black">{selected.subject}</h2><p className="mt-1 text-xs text-muted-foreground">{selected.userName || "Fleetvix user"} · {selected.userEmail}</p></div>
                  <span className="fm-status fm-status-idle">{selected.status}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-background p-3"><span className="text-muted-foreground">Category</span><strong className="mt-1 block">{selected.category}</strong></div><div className="rounded-xl bg-background p-3"><span className="text-muted-foreground">Created</span><strong className="mt-1 block">{new Date(selected.createdAt).toLocaleString("en-IN")}</strong></div></div>
                <div className="mt-4 rounded-xl bg-background p-3"><p className="whitespace-pre-wrap text-sm">{selected.description}</p>{selected.attachmentUrl && <a href={selected.attachmentUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-primary">View attachment</a>}</div>
                <div className="mt-4 space-y-3">
                  <label className="fm-settings-label">Status<select value={selected.status} onChange={(event) => void saveTicket({ status: event.target.value as SupportTicket["status"] })}><option>Open</option><option>In Progress</option><option>Resolved</option><option>Closed</option></select></label>
                  <label className="fm-settings-label">Priority<select value={selected.priority} onChange={(event) => void saveTicket({ priority: event.target.value as SupportTicket["priority"] })}><option>High</option><option>Medium</option><option>Low</option></select></label>
                  <label className="fm-settings-label">Admin reply<textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply the user can see..." /></label>
                  <button type="button" disabled={busy} onClick={() => void saveTicket({ adminReply: reply })} className="fm-primary-button w-full">{busy ? "Saving..." : "Save reply"}</button>
                </div>
              </div>
            ) : <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">Select a support ticket to view details.</div>}
            {error && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}