import { useState } from "react";
import { supabase } from "../lib/supabase";
import { CONFIG } from "../config";

export default function AuthPage({ navigate, setUser }) {
    const [isLogin, setIsLogin] = useState(false);
    const [role, setRole] = useState("engineer");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Step 1
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    // Step 2
    const [country, setCountry] = useState("Bangladesh");
    const [domains, setDomains] = useState([]);
    const [department, setDepartment] = useState("EEE");
    const [status, setStatus] = useState("student");
    const [semester, setSemester] = useState("1st");
    const [experience, setExperience] = useState("");
    const [university, setUniversity] = useState("");

    const toggleDomain = (d) => {
        setDomains(prev =>
            prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
        );
    };

    const handleLogin = async () => {
        setError(""); setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) { setError(error.message); return; }
        setUser(data.user);
        navigate("dashboard");
    };

    const handleStep1 = () => {
        if (!email || !password || !fullName) { setError("Please fill all fields."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        setError("");
        setStep(2);
    };

    const handleRegister = async () => {
        if (role === "engineer" && domains.length === 0) {
            setError("Please select at least one domain."); return;
        }
        setError(""); setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email, password,
            options: {
                data: {
                    full_name: fullName,
                    role,
                    country,
                }
            }
        });

        if (signUpError) { setLoading(false); setError(signUpError.message); return; }

        if (data.user) {
            const profileData = {
                id: data.user.id,
                full_name: fullName,
                role,
                country,
                verified: false,
                open_to_collaboration: true,
                anonymous_mode: false,
            };

            if (role === "engineer") {
                profileData.domains = domains;
                profileData.department = department;
                profileData.status = status;
                if (status === "student") profileData.semester = semester;
                if (status === "professional") profileData.experience_years = parseInt(experience) || 0;
                profileData.university = university;
            }

            const { error: profileError } = await supabase.from("profiles").upsert(profileData);
            if (profileError) { setLoading(false); setError(profileError.message); return; }
        }

        setLoading(false);
        setSuccess("Account created! Now verify your identity.");
        setTimeout(() => navigate("verify"), 1500);
    };

    if (isLogin) return (
        <div className="page">
            <div className="form-card">
                <div className="form-title">Welcome back</div>
                <div className="form-sub">Log in to your AeroHydroRobo account.</div>
                {error && <div className="error-box">{error}</div>}
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="you@example.com"
                        value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleLogin()} />
                </div>
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                    onClick={handleLogin} disabled={loading}>
                    {loading ? "Logging in..." : "Log in"}
                </button>
                <div className="form-footer">No account? <button onClick={() => { setIsLogin(false); setError(""); }}>Register</button></div>
            </div>
        </div>
    );

    return (
        <div className="page">
            <div className="form-card">
                {step === 1 && <>
                    <div className="form-title">Create your account</div>
                    <div className="form-sub">Join the world's most verified robotics talent network.</div>
                    {error && <div className="error-box">{error}</div>}
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>I am a —</div>
                    <div className="role-select">
                        <div className={`role-card ${role === "engineer" ? "selected" : ""}`} onClick={() => setRole("engineer")}>
                            <div className="role-card-icon">🛠️</div>
                            <div className="role-card-title">Engineer</div>
                            <div className="role-card-sub">Showcase skills, get hired</div>
                        </div>
                        <div className={`role-card ${role === "company" ? "selected" : ""}`} onClick={() => setRole("company")}>
                            <div className="role-card-icon">🏢</div>
                            <div className="role-card-title">Company</div>
                            <div className="role-card-sub">Post gigs, hire talent</div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Full name</label>
                        <input className="form-input" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={handleStep1}>
                        Continue →
                    </button>
                    <div className="form-footer">Already have an account? <button onClick={() => { setIsLogin(true); setError(""); }}>Log in</button></div>
                </>}

                {step === 2 && role === "engineer" && <>
                    <div className="form-title">Your profile</div>
                    <div className="form-sub">No CV needed — your projects will speak.</div>
                    {error && <div className="error-box">{error}</div>}
                    {success && <div className="success-box">{success}</div>}

                    <div className="form-group">
                        <label className="form-label">Domain (select all that apply)</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                            {CONFIG.domains.map(d => (
                                <button key={d.id} type="button"
                                    className={`filter-chip ${domains.includes(d.id) ? "active" : ""}`}
                                    onClick={() => toggleDomain(d.id)}>
                                    {d.icon} {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Country</label>
                        <input className="form-input" placeholder="Your country" value={country} onChange={e => setCountry(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">University</label>
                        <input className="form-input" placeholder="e.g. BUET, MIT, NUST" value={university} onChange={e => setUniversity(e.target.value)} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)}>
                                {CONFIG.departments.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                                {CONFIG.statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {status === "student" && (
                        <div className="form-group">
                            <label className="form-label">Semester</label>
                            <select className="form-select" value={semester} onChange={e => setSemester(e.target.value)}>
                                {CONFIG.semesters.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    )}

                    {status === "professional" && (
                        <div className="form-group">
                            <label className="form-label">Years of experience</label>
                            <input className="form-input" type="number" placeholder="e.g. 3" value={experience} onChange={e => setExperience(e.target.value)} />
                        </div>
                    )}

                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                        onClick={handleRegister} disabled={loading}>
                        {loading ? "Creating account..." : "Next: Verify identity →"}
                    </button>
                </>}

                {step === 2 && role === "company" && <>
                    <div className="form-title">Company details</div>
                    <div className="form-sub">Verification required before posting gigs.</div>
                    {error && <div className="error-box">{error}</div>}
                    {success && <div className="success-box">{success}</div>}
                    <div className="form-group">
                        <label className="form-label">Company name</label>
                        <input className="form-input" placeholder="e.g. Boston Dynamics" value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Country / HQ</label>
                        <input className="form-input" placeholder="Your country" value={country} onChange={e => setCountry(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                        onClick={handleRegister} disabled={loading}>
                        {loading ? "Creating account..." : "Next: Verify company →"}
                    </button>
                </>}
            </div>
        </div>
    );
}