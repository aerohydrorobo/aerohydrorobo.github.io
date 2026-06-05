export function VerifiedBadge() {
    return <span className="badge badge-verified">✓ Verified</span>;
}

export function DomainBadge({ domain }) {
    const map = {
        land: ["badge-domain-purple", "🤖 Land"],
        aerial: ["badge-domain-blue", "🚁 Aerial"],
        marine: ["badge-domain-green", "⚓ Marine"],
    };
    const [cls, label] = map[domain] || ["badge-domain-green", domain];
    return <span className={`badge ${cls}`}>{label}</span>;
}

export function UrgencyBadge({ urgency }) {
    if (urgency === "immediate") return <span className="urgency-high">🔴 Immediate</span>;
    if (urgency === "1month") return <span className="urgency-mid">🟡 1 Month</span>;
    return <span className="urgency-low">🟢 Long Term</span>;
}

export function AvatarEl({ initials, color, size = "md" }) {
    const cls = size === "lg" ? "avatar-lg" : "avatar";
    return <div className={`${cls} avatar-${color}`}>{initials || "?"}</div>;
}

export function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function getColor(initials) {
    const colors = ["green", "blue", "purple", "amber"];
    return colors[(initials?.charCodeAt(0) || 0) % colors.length];
}