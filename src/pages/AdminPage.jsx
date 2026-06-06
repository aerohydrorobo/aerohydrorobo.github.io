import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AvatarEl, VerifiedBadge, getInitials, getColor } from "../components/Badges";

export default function AdminPage() {
    const [section, setSection] = useState("queue");
    const [queue, setQueue] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [gigs, setGigs] = useState([]);
    const [docUrls, setDocUrls] = useState({});
    const [stats, setStats] = useState({ users: 0, gigs: 0, applications: 0 });

    useEffect(() => {
        const fetchAll = async () => {
            const [{ data: eng }, { data: comp }, { data: g }, { data: apps }] = await Promise.all([
                supabase.from("profiles").select("*").eq("role", "engineer"),
                supabase.from("profiles").select("*").eq("role", "company"),
                supabase.from("gigs").select("*, profiles(full_name)"),
                supabase.from("applications").select("id"),
            ]);

            setEngineers(eng || []);
            setCompanies(comp || []);
            setGigs(g || []);
            setQueue((eng || []).filter(e => !e.verified));
            setStats({
                users: ((eng || []).length + (comp || []).length),
                gigs: (g || []).length,
                applications: (apps || []).length,
            });

            for (const e of (eng || []).filter(x => !x.verified)) {
                const { data: files } = await supabase.storage
                    .from("verification-docs")
                    .list(e.id);
                if (files && files.length > 0) {
                    const { data: urlData } = await supabase.storage
                        .from("verification-docs")
                        .createSignedUrl(`${e.id}/${files[0].name}`, 3600);
                    if (urlData) {
                        setDocUrls(prev => ({ ...prev, [e.id]: { url: urlData.signedUrl, name: files[0].name } }));
                    }
                }
            }
        };
        fetchAll();
    }, []);

    const deleteDoc = async (userId) => {
        const doc = docUrls[userId];
        if (doc) {
            await supabase.storage.from("verification-docs").remove([`${userId}/${doc.name}`]);
            setDocUrls(prev => { const n = { ...prev }; delete n[userId]; return n; });
        }
    };

    const approve = async (id) => {
        await supabase.from("profiles").update({ verified: true }).eq("id", id);
        await supabase.from("notifications").insert({
            user_id: id,
            type: "verified",
            message: "🎉 Your account has been verified! You now have full access.",
        });
        await deleteDoc(id);
        setQueue(prev => prev.filter(e => e.id !== id));
        setEngineers(prev => prev.map(e => e.id === id ? { ...e, verified: true } : e));
    };

    const reject = async (id) => {
        await supabase.from("notifications").insert({
            user_id: id,
            type: "rejected",
            message: "Your verification was rejected. Please resubmit with a valid document.",
        });
        await deleteDoc(id);
        setQueue(prev => prev.filter(e => e.id !== id));
    };

    const banUser = async (id) => {
        if (!confirm("Ban this user?")) return;
        await supabase.from("profiles").update({ verified: false }).eq("id", id);
        setEngineers(prev => prev.map(e => e.id === id ? { ...e, verified: false } : e));
    };

    const toggleGig = async (id, active) => {
        await supabase.from("gigs").update({ active: !active }).eq("id", id);
        setGigs(prev => prev.map(g => g.id === id ? { ...g, active: !active } : g));
    };

    return (
        <div className="page admin-layout">
            <div className="admin-sidebar">
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, padding: "0 10px" }}>ADMIN</div>
                {[
                    ["queue", "⏳", "Verify queue"],
                    ["analytics", "📊", "Analytics"],
                    ["engineers", "🛠️", "Engineers"],
                    ["companies", "🏢", "Companies"],
                    ["gigs", "📋", "Gigs"],
                ].map(([id, icon, label]) => (
                    <button key={id} className={`sidebar-item ${section === id ? "active" : ""}`} onClick={() => setSection(id)}>
                        <span>{icon}</span>{label}
                        {id === "queue" && queue.length > 0 && (
                            <span style={{ marginLeft: "auto", background: "var(--red)", color: "#fff", borderRadius: "20px", padding: "1px 7px", fontSize: 11 }}>
                                {queue.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="admin-main">

                {section === "analytics" && <>
                    <div className="page-title">Analytics</div>
                    <div className="dash-grid">
                        <div className="metric-card"><div className="metric-label">Total users</div><div className="metric-value">{stats.users}</div></div>
                        <div className="metric-card"><div className="metric-label">Total gigs</div><div className="metric-value">{stats.gigs}</div></div>
                        <div className="metric-card"><div className="metric-label">Total applications</div><div className="metric-value">{stats.applications}</div></div>
                        <div className="metric-card"><div className="metric-label">Engineers</div><div className="metric-value">{engineers.length}</div></div>
                        <div className="metric-card"><div className="metric-label">Companies</div><div className="metric-value">{companies.length}</div></div>
                        <div className="metric-card"><div className="metric-label">Verified engineers</div><div className="metric-value">{engineers.filter(e => e.verified).length}</div></div>
                    </div>
                </>}

                {section === "queue" && <>
                    <div className="page-title">Verification queue</div>
                    <div className="page-sub">Review documents. Permanently deleted after decision.</div>
                    {queue.length === 0 && <div style={{ fontSize: 15, color: "var(--text-muted)", padding: "2rem 0" }}>✓ Queue is empty.</div>}
                    {queue.map(eng => {
                        const initials = getInitials(eng.full_name);
                        const color = getColor(initials);
                        const doc = docUrls[eng.id];
                        return (
                            <div key={eng.id} className="queue-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                                    <AvatarEl initials={initials} color={color} />
                                    <div className="queue-info">
                                        <div className="queue-name">{eng.full_name}</div>
                                        <div className="queue-sub">{eng.country} · {eng.university} · {(eng.domains || []).join(", ")}</div>
                                    </div>
                                    <div className="queue-actions">
                                        <button className="btn-approve" onClick={() => approve(eng.id)}>✓ Approve → Delete ID</button>
                                        <button className="btn-reject" onClick={() => reject(eng.id)}>✕ Reject → Delete ID</button>
                                    </div>
                                </div>
                                {doc
                                    ? <a href={doc.url} target="_blank" rel="noreferrer"
                                        style={{ fontSize: 13, color: "var(--blue)", textDecoration: "underline", marginLeft: 52 }}>
                                        📄 View document: {doc.name}
                                    </a>
                                    : <div style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 52 }}>No document uploaded yet.</div>
                                }
                            </div>
                        );
                    })}
                </>}

                {section === "engineers" && <>
                    <div className="page-title">All engineers ({engineers.length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {engineers.map(eng => {
                            const initials = getInitials(eng.full_name);
                            const color = getColor(initials);
                            return (
                                <div key={eng.id} className="queue-item">
                                    <AvatarEl initials={initials} color={color} />
                                    <div className="queue-info">
                                        <div className="queue-name">{eng.full_name}</div>
                                        <div className="queue-sub">{eng.university} · {(eng.domains || []).join(", ")} · {eng.country}</div>
                                    </div>
                                    {eng.verified
                                        ? <VerifiedBadge />
                                        : <span className="badge" style={{ background: "var(--amber-light)", color: "var(--amber)" }}>⏳ Pending</span>
                                    }
                                    <button className="btn btn-sm btn-danger" style={{ marginLeft: 8 }} onClick={() => banUser(eng.id)}>Ban</button>
                                </div>
                            );
                        })}
                    </div>
                </>}

                {section === "companies" && <>
                    <div className="page-title">All companies ({companies.length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {companies.map(comp => {
                            const initials = getInitials(comp.full_name);
                            const color = getColor(initials);
                            return (
                                <div key={comp.id} className="queue-item">
                                    <AvatarEl initials={initials} color={color} />
                                    <div className="queue-info">
                                        <div className="queue-name">{comp.full_name}</div>
                                        <div className="queue-sub">{comp.country}</div>
                                    </div>
                                    {comp.verified
                                        ? <VerifiedBadge />
                                        : <span className="badge" style={{ background: "var(--amber-light)", color: "var(--amber)" }}>⏳ Pending</span>
                                    }
                                    <button className="btn-approve" style={{ marginLeft: 8 }} onClick={() => approve(comp.id)}>Approve</button>
                                    <button className="btn btn-sm btn-danger" style={{ marginLeft: 8 }} onClick={() => banUser(comp.id)}>Ban</button>
                                </div>
                            );
                        })}
                    </div>
                </>}

                {section === "gigs" && <>
                    <div className="page-title">All gigs ({gigs.length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {gigs.map(g => (
                            <div key={g.id} className="queue-item">
                                <div className="queue-info">
                                    <div className="queue-name">{g.title}</div>
                                    <div className="queue-sub">{g.profiles?.full_name} · ${g.budget_min}–${g.budget_max} · {(g.domain || []).join(", ")}</div>
                                </div>
                                <span className={`badge ${g.active ? "badge-open" : ""}`}
                                    style={!g.active ? { background: "var(--red-light)", color: "var(--red)" } : {}}>
                                    {g.active ? "Active" : "Closed"}
                                </span>
                                <button className="btn btn-sm btn-outline" style={{ marginLeft: 8 }} onClick={() => toggleGig(g.id, g.active)}>
                                    {g.active ? "Close" : "Reopen"}
                                </button>
                            </div>
                        ))}
                        {gigs.length === 0 && <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No gigs yet.</div>}
                    </div>
                </>}

            </div>
        </div>
    );
}