import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useProfile } from "../hooks/useProfile";
import { AvatarEl, VerifiedBadge, DomainBadge, getInitials, getColor } from "../components/Badges";
import { CONFIG } from "../config";

function Loading() {
    return <div className="loading"><div className="spinner" />Loading...</div>;
}

function VaultTab() {
    const [note, setNote] = useState(() => localStorage.getItem("vault_note") || "");
    const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem("vault_tasks") || "[]"));
    const [newTask, setNewTask] = useState("");
    const [taskPriority, setTaskPriority] = useState("medium");

    const saveNote = (v) => { setNote(v); localStorage.setItem("vault_note", v); };

    const addTask = () => {
        if (!newTask.trim()) return;
        const task = { id: Date.now(), title: newTask, status: "open", priority: taskPriority, created: new Date().toLocaleDateString() };
        const updated = [...tasks, task];
        setTasks(updated);
        localStorage.setItem("vault_tasks", JSON.stringify(updated));
        setNewTask("");
    };

    const updateTaskStatus = (id, status) => {
        const updated = tasks.map(t => t.id === id ? { ...t, status } : t);
        setTasks(updated);
        localStorage.setItem("vault_tasks", JSON.stringify(updated));
    };

    const deleteTask = (id) => {
        const updated = tasks.filter(t => t.id !== id);
        setTasks(updated);
        localStorage.setItem("vault_tasks", JSON.stringify(updated));
    };

    return (
        <div>
            <div style={{ background: "var(--green-light)", border: "0.5px solid var(--green)", borderRadius: "var(--radius-lg)", padding: "12px 16px", marginBottom: "1.5rem", fontSize: 13, color: "var(--green-dark)" }}>
                🔒 Your vault is 100% private. Stored only in your browser — never on our servers.
            </div>

            <div className="vault-grid">
                <div className="vault-card" style={{ gridColumn: "1 / -1" }}>
                    <div className="vault-card-title">📋 Task manager</div>
                    <div className="vault-card-sub">Private tasks — GitHub issue style</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <input className="form-input" placeholder="New task..." value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addTask()} />
                        <select className="form-select" style={{ width: "auto" }} value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                            <option value="high">🔴 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🟢 Low</option>
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={addTask}>Add</button>
                    </div>
                    {tasks.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No tasks yet.</div>}
                    {tasks.map(t => (
                        <div key={t.id} className="vault-item" style={{ alignItems: "flex-start", gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, textDecoration: t.status === "done" ? "line-through" : "none", color: t.status === "done" ? "var(--text-muted)" : "var(--text)" }}>{t.title}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                    {t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢"} {t.priority} · {t.created}
                                </div>
                            </div>
                            <select className="form-select" style={{ width: "auto", fontSize: 12, padding: "3px 8px" }}
                                value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value)}>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                            <button onClick={() => deleteTask(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}>×</button>
                        </div>
                    ))}
                </div>

                <div className="vault-card">
                    <div className="vault-card-title">🎯 Dream goals</div>
                    <div className="vault-card-sub">Private targets</div>
                    {["Boston Dynamics — Humanoid team", "Learn Nav2 + LIDAR by August", "Get 50 endorsements"].map((g, i) => (
                        <div key={i} className="vault-item"><span>{g}</span></div>
                    ))}
                </div>

                <div className="vault-card">
                    <div className="vault-card-title">🔗 Private links</div>
                    <div className="vault-card-sub">Not visible to anyone</div>
                    {["github.com/my-private-repo", "drive.google.com/my-cad-files"].map((l, i) => (
                        <div key={i} className="vault-item"><span style={{ fontSize: 12, fontFamily: "monospace" }}>{l}</span></div>
                    ))}
                </div>

                <div className="vault-card" style={{ gridColumn: "1 / -1" }}>
                    <div className="vault-card-title">📔 Personal notes</div>
                    <div className="vault-card-sub">Stored locally only.</div>
                    <textarea className="note-input" value={note} onChange={e => saveNote(e.target.value)} placeholder="Write your thoughts, plans, ideas..." />
                </div>
            </div>
        </div>
    );
}

function ApplicationsTab({ userId }) {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from("applications")
                .select("*, gigs(title, budget_min, budget_max, urgency)")
                .eq("engineer_id", userId);
            setApplications(data || []);
            setLoading(false);
        };
        fetch();
    }, [userId]);

    if (loading) return <Loading />;
    if (applications.length === 0) return (
        <div style={{ fontSize: 14, color: "var(--text-muted)", padding: "2rem 0" }}>No applications yet.</div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {applications.map((a, i) => (
                <div key={i} className="company-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 500 }}>{a.gigs?.title || "Gig"}</div>
                            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
                                Applied {new Date(a.applied_at).toLocaleDateString()}
                            </div>
                        </div>
                        <span className="badge" style={
                            a.status === "accepted" ? { background: "var(--green-light)", color: "var(--green-dark)" } :
                                a.status === "rejected" ? { background: "var(--red-light)", color: "var(--red)" } :
                                    { background: "var(--amber-light)", color: "var(--amber)" }
                        }>
                            {a.status === "pending" ? "⏳ Pending" : a.status === "accepted" ? "✓ Accepted" : "✕ Rejected"}
                        </span>
                    </div>
                    {a.status === "rejected" && a.rejection_reason && (
                        <div className="rejection-reason">Feedback: <strong>{a.rejection_reason}</strong></div>
                    )}
                </div>
            ))}
        </div>
    );
}

function EditProfileTab({ profile, updateProfile }) {
    const [skills, setSkills] = useState(profile?.skills || []);
    const [newSkill, setNewSkill] = useState("");
    const [github, setGithub] = useState(profile?.github_url || "");
    const [linkedin, setLinkedin] = useState(profile?.linkedin_url || "");
    const [budget, setBudget] = useState(profile?.expected_budget || "");
    const [workType, setWorkType] = useState(profile?.work_type || "remote");
    const [languages, setLanguages] = useState(profile?.languages || []);
    const [collaboration, setCollaboration] = useState(profile?.open_to_collaboration ?? true);
    const [anonymous, setAnonymous] = useState(profile?.anonymous_mode ?? false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const addSkill = () => {
        if (!newSkill.trim()) return;
        const skill = { name: newSkill.trim(), verified: false, endorsements: 0 };
        setSkills(prev => [...prev, skill]);
        setNewSkill("");
    };

    const removeSkill = (name) => setSkills(prev => prev.filter(s => s.name !== name));

    const toggleLanguage = (lang) => {
        setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
    };

    const handleSave = async () => {
        setSaving(true);
        await updateProfile({
            skills,
            github_url: github,
            linkedin_url: linkedin,
            expected_budget: budget,
            work_type: workType,
            languages,
            open_to_collaboration: collaboration,
            anonymous_mode: anonymous,
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div>
            {saved && <div className="success-box">✓ Profile saved!</div>}

            <div className="company-card">
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Skills</div>
                <div className="skill-row" style={{ marginBottom: 12 }}>
                    {skills.map(s => (
                        <span key={s.name} className="skill-chip" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {s.name}
                            {s.verified && <span style={{ color: "var(--green-dark)" }}>✅</span>}
                            <button onClick={() => removeSkill(s.name)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12, padding: 0 }}>×</button>
                        </span>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <input className="form-input" placeholder="Add skill (e.g. ROS2)" value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addSkill()} />
                    <button className="btn btn-primary btn-sm" onClick={addSkill}>Add</button>
                </div>
            </div>

            <div className="company-card">
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Links</div>
                <div className="form-group">
                    <label className="form-label">GitHub profile URL</label>
                    <input className="form-input" placeholder="https://github.com/username" value={github} onChange={e => setGithub(e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label">LinkedIn (optional)</label>
                    <input className="form-input" placeholder="https://linkedin.com/in/username" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
                </div>
            </div>

            <div className="company-card">
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Preferences</div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Expected budget</label>
                        <input className="form-input" placeholder="e.g. $500-$1000" value={budget} onChange={e => setBudget(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Work type</label>
                        <select className="form-select" value={workType} onChange={e => setWorkType(e.target.value)}>
                            {CONFIG.workTypes.map(w => <option key={w} value={w.toLowerCase()}>{w}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Languages</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                        {CONFIG.languages.map(l => (
                            <button key={l} type="button"
                                className={`filter-chip ${languages.includes(l) ? "active" : ""}`}
                                onClick={() => toggleLanguage(l)}>
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="company-card">
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Settings</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>Open to collaboration</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Show others you're available to collaborate</div>
                    </div>
                    <button onClick={() => setCollaboration(!collaboration)}
                        style={{ background: collaboration ? "var(--green)" : "var(--bg-secondary)", border: "none", borderRadius: 20, width: 44, height: 24, cursor: "pointer", transition: "all 0.2s" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", margin: collaboration ? "3px 3px 3px 23px" : "3px", transition: "all 0.2s" }} />
                    </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>Anonymous mode</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Hide your name, show only skills</div>
                    </div>
                    <button onClick={() => setAnonymous(!anonymous)}
                        style={{ background: anonymous ? "var(--green)" : "var(--bg-secondary)", border: "none", borderRadius: 20, width: 44, height: 24, cursor: "pointer", transition: "all 0.2s" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", margin: anonymous ? "3px 3px 3px 23px" : "3px", transition: "all 0.2s" }} />
                    </button>
                </div>
            </div>

            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
            </button>
        </div>
    );
}

export default function DashboardPage({ navigate, user }) {
    const { profile, loading, updateProfile } = useProfile(user?.id);
    const [tab, setTab] = useState("overview");
    const [gigs, setGigs] = useState([]);
    const [gigsLoading, setGigsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from("gigs").select("*").eq("active", true).limit(5);
            setGigs(data || []);
            setGigsLoading(false);
        };
        fetch();
    }, []);

    if (loading) return <Loading />;

    const initials = getInitials(profile?.full_name);
    const color = getColor(initials);

    return (
        <div className="page">
            <div className="container section">
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2rem" }}>
                    <AvatarEl initials={initials} color={color} size="lg" />
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.3px" }}>
                            {profile?.anonymous_mode ? "Anonymous Engineer" : profile?.full_name || user?.email}
                        </div>
                        <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
                            {profile?.university && `${profile.university} · `}{profile?.country}
                        </div>
                        <div className="badge-row" style={{ marginTop: 10 }}>
                            {profile?.verified
                                ? <VerifiedBadge />
                                : <span className="badge" style={{ background: "var(--amber-light)", color: "var(--amber)" }}>⏳ Pending verification</span>
                            }
                            {profile?.open_to_collaboration && <span className="badge badge-open">Open to work</span>}
                            {(profile?.domains || []).map(d => <DomainBadge key={d} domain={d} />)}
                        </div>
                    </div>
                </div>

                <div className="tabs">
                    {["overview", "applications", "edit profile", "vault"].map(t => (
                        <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {tab === "overview" && <>
                    <div className="dash-grid">
                        <div className="metric-card"><div className="metric-label">Profile views</div><div className="metric-value">{profile?.profile_views || 0}</div></div>
                        <div className="metric-card"><div className="metric-label">Endorsements</div><div className="metric-value">{profile?.endorsements || 0}</div></div>
                        <div className="metric-card"><div className="metric-label">Skills</div><div className="metric-value">{(profile?.skills || []).length}</div></div>
                    </div>
                    <div className="sec-header">
                        <div className="sec-title">Recommended gigs</div>
                        <button className="sec-link" onClick={() => navigate("gigs")}>View all →</button>
                    </div>
                    {gigsLoading ? <Loading /> : gigs.length === 0
                        ? <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No gigs yet.</div>
                        : gigs.map(g => (
                            <div key={g.id} className="gig-card" style={{ marginBottom: 10 }} onClick={() => navigate("gigs")}>
                                <div className="gig-left">
                                    <div className="gig-title">{g.title}</div>
                                    <div className="tag-row">{(g.skills || []).map(s => <span key={s} className="tag tag-purple">{s}</span>)}</div>
                                </div>
                                <div className="gig-right">
                                    <div className="gig-budget">${g.budget_min}–${g.budget_max}</div>
                                </div>
                            </div>
                        ))
                    }
                </>}

                {tab === "applications" && <ApplicationsTab userId={user.id} />}
                {tab === "edit profile" && <EditProfileTab profile={profile} updateProfile={updateProfile} />}
                {tab === "vault" && <VaultTab />}
            </div>
        </div>
    );
}