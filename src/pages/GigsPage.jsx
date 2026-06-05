import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { VerifiedBadge, UrgencyBadge } from "../components/Badges";
import { CONFIG } from "../config";

export default function GigsPage({ navigate, user }) {
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [domain, setDomain] = useState("all");
    const [workType, setWorkType] = useState("all");
    const [applying, setApplying] = useState(null);
    const [applySuccess, setApplySuccess] = useState("");
    const [applyError, setApplyError] = useState("");

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            let query = supabase.from("gigs")
                .select("*, profiles(full_name, verified)")
                .eq("active", true)
                .order("created_at", { ascending: false });
            const { data } = await query;
            let filtered = data || [];
            if (domain !== "all") filtered = filtered.filter(g => (g.domain || []).includes(domain));
            if (workType !== "all") filtered = filtered.filter(g => g.work_type?.toLowerCase() === workType);
            setGigs(filtered);
            setLoading(false);
        };
        fetch();
    }, [domain, workType]);

    const handleApply = async (gig) => {
        if (!user) { navigate("register"); return; }
        setApplyError(""); setApplySuccess("");
        const { error } = await supabase.from("applications").insert({
            engineer_id: user.id,
            gig_id: gig.id,
            status: "pending",
        });
        if (error) {
            if (error.code === "23505") setApplyError("You already applied to this gig.");
            else setApplyError(error.message);
        } else {
            setApplySuccess(`Applied to: ${gig.title}`);
            // Notify company
            await supabase.from("notifications").insert({
                user_id: gig.company_id,
                type: "new_application",
                message: `New application for: ${gig.title}`,
            });
        }
        setApplying(null);
        setTimeout(() => { setApplySuccess(""); setApplyError(""); }, 4000);
    };

    return (
        <div className="page">
            <div className="container section">
                <div className="page-title">Active gigs</div>
                <div className="page-sub">Only verified companies can post. No fake jobs.</div>

                {applySuccess && <div className="success-box">{applySuccess}</div>}
                {applyError && <div className="error-box">{applyError}</div>}

                <div className="filter-bar">
                    <span className="filter-label">Domain:</span>
                    <button className={`filter-chip ${domain === "all" ? "active" : ""}`} onClick={() => setDomain("all")}>All</button>
                    {CONFIG.domains.map(d => (
                        <button key={d.id} className={`filter-chip ${domain === d.id ? "active" : ""}`} onClick={() => setDomain(d.id)}>
                            {d.icon} {d.label}
                        </button>
                    ))}
                    <span className="filter-label" style={{ marginLeft: 8 }}>Work type:</span>
                    <button className={`filter-chip ${workType === "all" ? "active" : ""}`} onClick={() => setWorkType("all")}>All</button>
                    {CONFIG.workTypes.map(w => (
                        <button key={w} className={`filter-chip ${workType === w.toLowerCase() ? "active" : ""}`} onClick={() => setWorkType(w.toLowerCase())}>
                            {w}
                        </button>
                    ))}
                </div>

                {loading
                    ? <div className="loading"><div className="spinner" />Loading...</div>
                    : gigs.length === 0
                        ? <div style={{ fontSize: 14, color: "var(--text-muted)", padding: "2rem 0" }}>No gigs posted yet.</div>
                        : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {gigs.map(g => (
                                    <div key={g.id} className="gig-card">
                                        <div className="gig-left">
                                            <div className="gig-company">
                                                {g.profiles?.full_name || "Company"}
                                                {g.profiles?.verified && <VerifiedBadge />}
                                                <span style={{ marginLeft: 4, fontSize: 11, color: "var(--text-muted)" }}>{g.work_type}</span>
                                            </div>
                                            <div className="gig-title">{g.title}</div>
                                            {g.description && <div style={{ fontSize: 13, color: "var(--text-muted)", margin: "6px 0" }}>{g.description}</div>}
                                            <div className="tag-row">
                                                {(g.skills || []).map(s => (
                                                    <span key={s} className={`tag tag-${(g.domain || [])[0] === "land" ? "purple" : (g.domain || [])[0] === "aerial" ? "blue" : "green"}`}>{s}</span>
                                                ))}
                                            </div>
                                            {g.deadline && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>⏰ Deadline: {new Date(g.deadline).toLocaleDateString()}</div>}
                                        </div>
                                        <div className="gig-right">
                                            <div className="gig-budget">${g.budget_min}–${g.budget_max}</div>
                                            <UrgencyBadge urgency={g.urgency} />
                                            <div style={{ marginTop: 8 }}>
                                                <button className="btn btn-primary btn-sm" onClick={() => setApplying(g)}>
                                                    {user ? "Apply" : "Login to Apply"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                }

                {applying && (
                    <div className="apply-modal" onClick={() => setApplying(null)}>
                        <div className="apply-box" onClick={e => e.stopPropagation()}>
                            <div className="modal-title">Apply to this gig?</div>
                            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{applying.title}</div>
                            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                                Your profile will be sent to the company.
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-outline btn-sm" onClick={() => setApplying(null)}>Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={() => handleApply(applying)}>Confirm Apply</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}