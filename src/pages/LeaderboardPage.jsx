import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AvatarEl, DomainBadge, getInitials, getColor } from "../components/Badges";

export default function LeaderboardPage() {
    const [engineers, setEngineers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("role", "engineer")
                .eq("verified", true)
                .order("endorsements", { ascending: false })
                .limit(20);
            setEngineers(data || []);
            setLoading(false);
        };
        fetch();
    }, []);

    return (
        <div className="page">
            <div className="container section">
                <div className="page-title">Leaderboard</div>
                <div className="page-sub">Most endorsed verified engineers.</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
                    <div>
                        {loading
                            ? <div className="loading"><div className="spinner" />Loading...</div>
                            : engineers.length === 0
                                ? <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No verified engineers yet.</div>
                                : engineers.map((eng, i) => {
                                    const initials = getInitials(eng.anonymous_mode ? "AN" : eng.full_name);
                                    const color = getColor(initials);
                                    return (
                                        <div key={eng.id} className="lb-item">
                                            <div className={`lb-rank ${i < 3 ? "top" : ""}`}>
                                                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                                            </div>
                                            <AvatarEl initials={initials} color={color} />
                                            <div className="lb-info">
                                                <div className="lb-name">
                                                    {eng.anonymous_mode ? "Anonymous Engineer" : eng.full_name}
                                                </div>
                                                <div className="lb-sub" style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                                                    {eng.country}
                                                    {(eng.domains || []).map(d => <DomainBadge key={d} domain={d} />)}
                                                </div>
                                            </div>
                                            <div className="lb-score">⭐ {eng.endorsements}</div>
                                        </div>
                                    );
                                })
                        }
                    </div>

                    <div>
                        <div className="trending-card">
                            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 12 }}>🔥 Trending skills</div>
                            {[["ROS2", 95], ["SLAM", 82], ["PX4", 74], ["Nav2", 61], ["Jetson", 55], ["BlueROV", 42]].map(([skill, pct], i) => (
                                <div key={skill} className="trend-item">
                                    <div className="trend-rank">#{i + 1}</div>
                                    <div className="trend-name">{skill}</div>
                                    <div className="trend-bar">
                                        <div className="trend-bar-fill" style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="trend-count">{pct}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}