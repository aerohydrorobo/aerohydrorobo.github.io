import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AvatarEl, VerifiedBadge, DomainBadge, getInitials, getColor } from "../components/Badges";
import { CONFIG } from "../config";

export default function HomePage({ navigate, user }) {
    const [engineers, setEngineers] = useState([]);
    const [gigs, setGigs] = useState([]);
    const [stats, setStats] = useState({ engineers: 0, companies: 0, gigs: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const [{ data: eng }, { data: g }, { count: engCount }, { count: compCount }, { count: gigCount }] = await Promise.all([
                supabase.from("profiles").select("*").eq("role", "engineer").eq("verified", true).order("endorsements", { ascending: false }).limit(4),
                supabase.from("gigs").select("*, profiles(full_name, verified)").eq("active", true).order("created_at", { ascending: false }).limit(3),
                supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "engineer").eq("verified", true),
                supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "company").eq("verified", true),
                supabase.from("gigs").select("*", { count: "exact", head: true }).eq("active", true),
            ]);
            setEngineers(eng || []);
            setGigs(g || []);
            setStats({ engineers: engCount || 0, companies: compCount || 0, gigs: gigCount || 0 });
            setLoading(false);
        };
        fetch();
    }, []);

    return (
        <div className="page">
            <div className="hero">
                <div className="badge-pill">⚡ Zero-fluff. Pure skill. Fully verified.</div>
                <h1>Where <em>real engineers</em><br />meet serious opportunity</h1>
                <p>The world's only verified talent platform for Land Robotics, Aerial Drones, and Marine Systems engineers.</p>
                <div className="hero-actions">
                    {user
                        ? <button className="btn btn-primary" onClick={() => navigate("dashboard")}>Go to dashboard</button>
                        : <>
                            <button className="btn btn-primary" onClick={() => navigate("register")}>Join as engineer</button>
                            <button className="btn btn-outline" onClick={() => navigate("register")}>Hire talent</button>
                        </>
                    }
                </div>
            </div>

            <div className="stats-bar">
                {[
                    [stats.engineers, "Verified engineers"],
                    [stats.companies, "Verified companies"],
                    [stats.gigs, "Active gigs"],
                ].map(([n, l]) => (
                    <div className="stat-item" key={l}>
                        <div className="stat-num">{n}</div>
                        <div className="stat-label">{l}</div>
                    </div>
                ))}
            </div>

            <div style={{ padding: "2.5rem 0" }}>
                <div style={{ textAlign: "center", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "1.25rem" }}>
                    Choose your domain
                </div>
                <div className="domain-grid">
                    {CONFIG.domains.map(d => (
                        <div key={d.id} className="domain-card" onClick={() => navigate("engineers")}>
                            <div className="domain-icon">{d.icon}</div>
                            <h3>{d.label}</h3>
                            <div className="domain-count" style={{ marginTop: 8 }}>Verified engineers available</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="divider" />

            <div className="container section">
                <div className="sec-header">
                    <div className="sec-title">Top verified engineers</div>
                    <button className="sec-link" onClick={() => navigate("engineers")}>View all →</button>
                </div>
                {loading
                    ? <div className="loading"><div className="spinner" />Loading...</div>
                    : engineers.length === 0
                        ? <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No verified engineers yet. Be the first!</div>
                        : (
                            <div className="grid-2">
                                {engineers.map(eng => {
                                    const initials = getInitials(eng.anonymous_mode ? "AN" : eng.full_name);
                                    const color = getColor(initials);
                                    return (
                                        <div key={eng.id} className="engineer-card">
                                            <div className="eng-top">
                                                <AvatarEl initials={initials} color={color} />
                                                <div>
                                                    <div className="eng-name">{eng.anonymous_mode ? "Anonymous Engineer" : eng.full_name}</div>
                                                    <div className="eng-meta">{eng.university || "—"} · {eng.country}</div>
                                                </div>
                                            </div>
                                            <div className="badge-row">
                                                <VerifiedBadge />
                                                {eng.open_to_collaboration && <span className="badge badge-open">Open to work</span>}
                                                {(eng.domains || []).map(d => <DomainBadge key={d} domain={d} />)}
                                            </div>
                                            <div className="skill-row">
                                                {(eng.skills || []).slice(0, 4).map(s => (
                                                    <span key={s.name} className="skill-chip">{s.name}{s.verified ? " ✅" : ""}</span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                }
            </div>

            <div className="divider" />

            <div className="container section">
                <div className="sec-header">
                    <div className="sec-title">Active gigs</div>
                    <button className="sec-link" onClick={() => navigate("gigs")}>View all →</button>
                </div>
                {loading
                    ? <div className="loading"><div className="spinner" />Loading...</div>
                    : gigs.length === 0
                        ? <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No gigs yet.</div>
                        : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {gigs.map(g => (
                                    <div key={g.id} className="gig-card" onClick={() => navigate("gigs")}>
                                        <div className="gig-left">
                                            <div className="gig-company">
                                                {g.profiles?.full_name || "Company"}
                                                {g.profiles?.verified && <VerifiedBadge />}
                                            </div>
                                            <div className="gig-title">{g.title}</div>
                                            <div className="tag-row">
                                                {(g.skills || []).map(s => (
                                                    <span key={s} className="tag tag-purple">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="gig-right">
                                            <div className="gig-budget">${g.budget_min}–${g.budget_max}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                }
            </div>

            <div className="footer">
                AeroHydroRobo — Built for engineers who build the future. Zero spam. Zero compromise.
            </div>
        </div>
    );
}