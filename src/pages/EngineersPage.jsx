import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AvatarEl, VerifiedBadge, DomainBadge, getInitials, getColor } from "../components/Badges";
import { CONFIG } from "../config";

export default function EngineersPage({ navigate, user }) {
    const [engineers, setEngineers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [domain, setDomain] = useState("all");
    const [country, setCountry] = useState("");
    const [skill, setSkill] = useState("");
    const [availability, setAvailability] = useState("all");

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            let query = supabase.from("profiles")
                .select("*")
                .eq("role", "engineer")
                .eq("verified", true)
                .order("endorsements", { ascending: false });
            const { data } = await query;
            let filtered = data || [];
            if (domain !== "all") filtered = filtered.filter(e => (e.domains || []).includes(domain));
            if (country.trim()) filtered = filtered.filter(e => e.country?.toLowerCase().includes(country.toLowerCase()));
            if (skill.trim()) filtered = filtered.filter(e => (e.skills || []).some(s => s.name?.toLowerCase().includes(skill.toLowerCase())));
            if (availability === "open") filtered = filtered.filter(e => e.open_to_collaboration);
            setEngineers(filtered);
            setLoading(false);
        };
        fetch();
    }, [domain, country, skill, availability]);

    return (
        <div className="page">
            <div className="container section">
                <div className="page-title">Verified engineers</div>
                <div className="page-sub">All engineers are identity-verified. No fake profiles.</div>

                <div className="filter-bar">
                    <span className="filter-label">Domain:</span>
                    <button className={`filter-chip ${domain === "all" ? "active" : ""}`} onClick={() => setDomain("all")}>All</button>
                    {CONFIG.domains.map(d => (
                        <button key={d.id} className={`filter-chip ${domain === d.id ? "active" : ""}`} onClick={() => setDomain(d.id)}>
                            {d.icon} {d.label}
                        </button>
                    ))}
                    <span className="filter-label" style={{ marginLeft: 8 }}>Availability:</span>
                    <button className={`filter-chip ${availability === "all" ? "active" : ""}`} onClick={() => setAvailability("all")}>All</button>
                    <button className={`filter-chip ${availability === "open" ? "active" : ""}`} onClick={() => setAvailability("open")}>Open to work</button>
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <input className="form-input" placeholder="Search by skill (e.g. ROS2)"
                        value={skill} onChange={e => setSkill(e.target.value)}
                        style={{ maxWidth: 240 }} />
                    <input className="form-input" placeholder="Filter by country"
                        value={country} onChange={e => setCountry(e.target.value)}
                        style={{ maxWidth: 200 }} />
                </div>

                {loading
                    ? <div className="loading"><div className="spinner" />Loading...</div>
                    : engineers.length === 0
                        ? <div style={{ fontSize: 14, color: "var(--text-muted)", padding: "2rem 0" }}>No verified engineers found.</div>
                        : (
                            <div className="grid-3">
                                {engineers.map(eng => {
                                    const initials = getInitials(eng.anonymous_mode ? "Anonymous" : eng.full_name);
                                    const color = getColor(initials);
                                    return (
                                        <div key={eng.id} className="engineer-card" onClick={() => navigate(`profile-${eng.id}`)}>
                                            <div className="eng-top">
                                                {eng.avatar_url && !eng.anonymous_mode
                                                    ? <img src={eng.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                                    : <AvatarEl initials={initials} color={color} />}
                                                <div>
                                                    <div className="eng-name">
                                                        {eng.anonymous_mode ? "Anonymous Engineer" : eng.full_name}
                                                    </div>
                                                    <div className="eng-meta">{eng.university || "—"} · {eng.country}</div>
                                                </div>
                                            </div>
                                            <div className="badge-row">
                                                <VerifiedBadge />
                                                {eng.open_to_collaboration && <span className="badge badge-open">Open</span>}
                                                {(eng.domains || []).map(d => <DomainBadge key={d} domain={d} />)}
                                            </div>
                                            <div className="skill-row">
                                                {(eng.skills || []).slice(0, 4).map(s => (
                                                    <span key={s.name} className="skill-chip">
                                                        {s.name}{s.verified ? " ✅" : ""}
                                                    </span>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                                                ⭐ {eng.endorsements} endorsements · 👁 {eng.profile_views} views
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                }
            </div>
        </div>
    );
}