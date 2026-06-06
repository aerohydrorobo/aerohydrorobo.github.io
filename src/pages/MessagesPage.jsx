import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AvatarEl, VerifiedBadge, getInitials, getColor } from "../components/Badges";

export default function MessagesPage({ user, profile }) {
    const [threads, setThreads] = useState([]);
    const [active, setActive] = useState(null);
    const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchThreads = async () => {
            const { data } = await supabase
                .from("messages")
                .select("*, sender:profiles!sender_id(id, full_name, verified, anonymous_mode), receiver:profiles!receiver_id(id, full_name, verified, anonymous_mode)")
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order("sent_at", { ascending: false });

            // Group by thread
            const seen = new Set();
            const unique = [];
            for (const m of (data || [])) {
                const other = m.sender_id === user.id ? m.receiver : m.sender;
                if (!seen.has(other.id)) {
                    seen.add(other.id);
                    unique.push({ other, lastMsg: m.content, lastTime: m.sent_at });
                }
            }
            setThreads(unique);
            setLoading(false);
        };
        fetchThreads();
    }, [user]);

    useEffect(() => {
        if (!active) return;
        const fetchMessages = async () => {
            const { data } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${active.other.id}),and(sender_id.eq.${active.other.id},receiver_id.eq.${user.id})`)
                .order("sent_at", { ascending: true });
            setMessages(data || []);
        };
        fetchMessages();

        // Realtime
        const channel = supabase
            .channel("messages")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
                const m = payload.new;
                if ((m.sender_id === user.id && m.receiver_id === active.other.id) ||
                    (m.sender_id === active.other.id && m.receiver_id === user.id)) {
                    setMessages(prev => [...prev, m]);
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [active]);

    const sendMessage = async () => {
        if (!msg.trim() || !active) return;
        await supabase.from("messages").insert({
            sender_id: user.id,
            receiver_id: active.other.id,
            content: msg.trim(),
        });
        setMsg("");
    };

    if (!user) return (
        <div className="page">
            <div style={{ textAlign: "center", padding: "4rem" }}>
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Please log in to access messages.</div>
            </div>
        </div>
    );

    if (!profile?.verified) return (
        <div className="page">
            <div style={{ textAlign: "center", padding: "4rem" }}>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Verification required</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Only verified users can send messages.</div>
            </div>
        </div>
    );

    return (
        <div className="msg-layout">
            <div className="msg-sidebar">
                <div className="msg-header">Messages</div>
                {loading
                    ? <div className="loading"><div className="spinner" /></div>
                    : threads.length === 0
                        ? <div style={{ padding: "1rem", fontSize: 13, color: "var(--text-muted)" }}>No messages yet.</div>
                        : threads.map((t, i) => {
                            const initials = getInitials(t.other.anonymous_mode ? "AN" : t.other.full_name);
                            const color = getColor(initials);
                            return (
                                <div key={i} className={`msg-thread-item ${active?.other.id === t.other.id ? "active" : ""}`}
                                    onClick={() => setActive(t)}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <AvatarEl initials={initials} color={color} />
                                        <div>
                                            <div className="msg-thread-name">
                                                {t.other.anonymous_mode ? "Anonymous" : t.other.full_name}
                                                {t.other.verified && <VerifiedBadge />}
                                            </div>
                                            <div className="msg-thread-preview">{t.lastMsg?.slice(0, 40)}...</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                }
            </div>

            <div className="msg-main">
                {!active
                    ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, fontSize: 14, color: "var(--text-muted)" }}>
                        Select a conversation
                    </div>
                    : <>
                        <div className="msg-top">
                            <AvatarEl initials={getInitials(active.other.full_name)} color={getColor(getInitials(active.other.full_name))} />
                            <div style={{ fontWeight: 500, fontSize: 15 }}>
                                {active.other.anonymous_mode ? "Anonymous" : active.other.full_name}
                            </div>
                            {active.other.verified && <VerifiedBadge />}
                        </div>
                        <div className="msg-body">
                            {messages.map((m, i) => (
                                <div key={i} className={`msg-bubble ${m.sender_id === user.id ? "sent" : "recv"}`}>
                                    {m.content}
                                </div>
                            ))}
                        </div>
                        <div className="msg-input-bar">
                            <input className="msg-input" value={msg} onChange={e => setMsg(e.target.value)}
                                placeholder="Type a message..."
                                onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <button className="btn btn-primary" onClick={sendMessage}>Send</button>
                        </div>
                    </>
                }
            </div>
        </div>
    );
}