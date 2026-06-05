import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function VerifyPage({ navigate, user }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setError("");
        setUploading(true);
        const path = `${user.id}/${f.name}`;
        const { error } = await supabase.storage
            .from("verification-docs")
            .upload(path, f, { upsert: true });
        setUploading(false);
        if (error) { setError(error.message); return; }
        setFile(f.name);
        setUploaded(true);
    };

    const handleSubmit = async () => {
        await supabase.from("notifications").insert({
            user_id: user.id,
            type: "verification_submitted",
            message: "Your verification is under review.",
        });
        setSubmitted(true);
    };

    if (!user) return (
        <div className="page">
            <div className="form-card" style={{ textAlign: "center" }}>
                <div className="form-title">Please log in first</div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("register")}>Log in</button>
            </div>
        </div>
    );

    if (submitted) return (
        <div className="page">
            <div className="form-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                <div className="form-title">Verification submitted</div>
                <div className="form-sub">Your document is under admin review. It will be permanently deleted after review. Usually within 24 hours.</div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("dashboard")}>Go to dashboard</button>
            </div>
        </div>
    );

    return (
        <div className="page">
            <div style={{ maxWidth: 560, margin: "2rem auto", padding: "0 2rem" }}>
                <div className="page-title">Identity verification</div>
                <div className="page-sub">One-time process. Document permanently deleted after review.</div>

                <div className="verify-step">
                    <div className="step-num done">✓</div>
                    <div>
                        <div className="step-title">Account created</div>
                        <div className="step-sub">Basic info saved.</div>
                    </div>
                </div>

                <div className="verify-step">
                    <div className={`step-num ${uploaded ? "done" : ""}`}>{uploaded ? "✓" : "2"}</div>
                    <div style={{ flex: 1 }}>
                        <div className="step-title">Upload ID document</div>
                        <div className="step-sub">NID, Passport, or Student ID. JPG, PNG, PDF — max 5MB.</div>
                        {error && <div className="error-box" style={{ marginTop: 8 }}>{error}</div>}
                        {!uploaded && (
                            <label className="upload-area" style={{ display: "block", cursor: "pointer" }}>
                                <input type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }} onChange={handleUpload} />
                                <div style={{ fontSize: 28 }}>📄</div>
                                <div className="upload-text">{uploading ? "Uploading..." : "Click to upload"}</div>
                            </label>
                        )}
                        {uploaded && (
                            <div style={{ marginTop: 10, fontSize: 13, color: "var(--green-dark)", fontWeight: 500 }}>
                                ✓ {file} uploaded
                            </div>
                        )}
                        <div className="purge-note">
                            🔒 Permanently deleted after admin review. We never store personal ID data.
                        </div>
                    </div>
                </div>

                <div className="verify-step" style={{ opacity: uploaded ? 1 : 0.5 }}>
                    <div className="step-num">3</div>
                    <div>
                        <div className="step-title">Admin review</div>
                        <div className="step-sub">Usually within 24 hours.</div>
                    </div>
                </div>

                <button className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
                    disabled={!uploaded} onClick={handleSubmit}>
                    Submit for review
                </button>
            </div>
        </div>
    );
}