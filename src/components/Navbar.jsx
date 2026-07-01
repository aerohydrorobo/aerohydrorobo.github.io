import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { isAdminUser } from "./RouteGuards";

/**
 * Top navigation bar.
 * To add a new nav link in the future: just add one more <NavItem> below
 * inside the appropriate visibility condition (everyone / logged-in / admin).
 */
function NavItem({ to, label, active, onClick }) {
    return (
        <Link to={to} className={`nav-link ${active ? "active" : ""}`} onClick={onClick}>
            {label}
        </Link>
    );
}

export default function Navbar({ user, profile }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;
    const isAdmin = isAdminUser(user);
    const closeMenu = () => setMenuOpen(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        closeMenu();
        navigate("/");
    };

    return (
        <div className="nav">
            <Link to="/" className="nav-logo" onClick={closeMenu}>
                Aero<span>Hydro</span>Robo
            </Link>

            <button
                className="nav-menu-toggle"
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {menuOpen
                        ? <path d="M18 6 6 18M6 6l12 12" />
                        : <path d="M3 6h18M3 12h18M3 18h18" />}
                </svg>
            </button>

            <div className={`nav-links ${menuOpen ? "open" : ""}`}>
                <NavItem to="/feed" label="Feed" active={isActive("/feed")} onClick={closeMenu} />
                <NavItem to="/engineers" label="Engineers" active={isActive("/engineers")} onClick={closeMenu} />
                <NavItem to="/gigs" label="Gigs" active={isActive("/gigs")} onClick={closeMenu} />
                <NavItem to="/leaderboard" label="Leaderboard" active={isActive("/leaderboard")} onClick={closeMenu} />

                {user && (
                    <NavItem to="/messages" label="Messages" active={isActive("/messages")} onClick={closeMenu} />
                )}
                {user && (
                    <NavItem to="/dashboard" label="Dashboard" active={isActive("/dashboard")} onClick={closeMenu} />
                )}
                {isAdmin && (
                    <NavItem to="/admin" label="Admin" active={isActive("/admin")} onClick={closeMenu} />
                )}

                {user && profile && (
                    <Link to="/dashboard" onClick={closeMenu} className="nav-avatar" title={profile.full_name || "Profile"}>
                        {profile.avatar_url
                            ? <img src={profile.avatar_url} alt="" className="nav-avatar-img" />
                            : <span className="nav-avatar-fallback">{(profile.full_name || "U")[0].toUpperCase()}</span>}
                    </Link>
                )}

                {user
                    ? <button className="btn btn-outline btn-sm" onClick={handleLogout}>Log out</button>
                    : <button className="btn btn-primary btn-sm" onClick={() => { closeMenu(); navigate("/register"); }}>Get started</button>
                }
            </div>
        </div>
    );
}
