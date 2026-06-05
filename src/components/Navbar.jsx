import { supabase } from "../lib/supabase";

export default function Navbar({ page, navigate, user }) {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("home");
    };

    return (
        <div className="nav">
            <div className="nav-logo" onClick={() => navigate("home")}>
                Aero<span>Hydro</span>Robo
            </div>
            <div className="nav-links">
                <button className={`nav-link ${page === "engineers" ? "active" : ""}`} onClick={() => navigate("engineers")}>Engineers</button>
                <button className={`nav-link ${page === "gigs" ? "active" : ""}`} onClick={() => navigate("gigs")}>Gigs</button>
                <button className={`nav-link ${page === "feed" ? "active" : ""}`} onClick={() => navigate("feed")}>Feed</button>
                <button className={`nav-link ${page === "leaderboard" ? "active" : ""}`} onClick={() => navigate("leaderboard")}>Leaderboard</button>
                {user && <button className={`nav-link ${page === "messages" ? "active" : ""}`} onClick={() => navigate("messages")}>Messages</button>}
                {user && <button className={`nav-link ${page === "dashboard" ? "active" : ""}`} onClick={() => navigate("dashboard")}>Dashboard</button>}
                <button className="nav-link" onClick={() => navigate("admin")}>Admin</button>
                {user
                    ? <button className="btn btn-outline btn-sm" onClick={handleLogout}>Log out</button>
                    : <button className="btn btn-primary btn-sm" onClick={() => navigate("register")}>Get started</button>
                }
            </div>
        </div>
    );
}