import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { AvatarEl, getInitials, getColor } from "../components/Badges";

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function Composer({ user, profile, onPosted }) {
    const [text, setText] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState("");

    const pickImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
        setError("");
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handlePost = async () => {
        if (!text.trim() && !imageFile) return;
        setPosting(true);
        setError("");

        let imageUrl = null;
        if (imageFile) {
            const path = `${user.id}/${Date.now()}-${imageFile.name}`;
            const { error: upErr } = await supabase.storage.from("post-images").upload(path, imageFile);
            if (upErr) { setPosting(false); setError(upErr.message); return; }
            imageUrl = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
        }

        const { data, error: postErr } = await supabase
            .from("posts")
            .insert({ author_id: user.id, content: text.trim(), image_url: imageUrl })
            .select()
            .single();

        setPosting(false);
        if (postErr) { setError(postErr.message); return; }

        setText(""); setImageFile(null); setImagePreview(null);
        onPosted({ ...data, profiles: profile, like_count: 0, liked_by_me: false });
    };

    if (!user) return null;

    return (
        <div className="feed-composer">
            <textarea
                placeholder={`What are you building, ${profile?.full_name?.split(" ")[0] || "engineer"}?`}
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={1000}
            />
            {imagePreview && (
                <img src={imagePreview} alt="" className="post-image" style={{ maxHeight: 220 }} />
            )}
            {error && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 6 }}>{error}</div>}
            <div className="feed-composer-actions">
                <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                    📷 Photo
                    <input type="file" accept="image/*" hidden onChange={pickImage} />
                </label>
                <button className="btn btn-primary btn-sm" onClick={handlePost} disabled={posting || (!text.trim() && !imageFile)}>
                    {posting ? "Posting..." : "Post"}
                </button>
            </div>
        </div>
    );
}

function PostCard({ post, user, onToggleLike }) {
    const author = post.profiles;
    const initials = getInitials(author?.full_name);
    return (
        <div className="post-card">
            <div className="post-head">
                {author?.avatar_url
                    ? <img src={author.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    : <AvatarEl initials={initials} color={getColor(initials)} />}
                <div>
                    <div className="post-author">{author?.full_name || "Unknown"}</div>
                    <div className="post-time">{timeAgo(post.created_at)}</div>
                </div>
            </div>
            {post.content && <div className="post-body">{post.content}</div>}
            {post.image_url && <img src={post.image_url} alt="" className="post-image" />}
            <div className="post-actions">
                <button
                    className={`post-like-btn ${post.liked_by_me ? "liked" : ""}`}
                    onClick={() => onToggleLike(post)}
                    disabled={!user}
                    title={user ? "Like" : "Log in to like posts"}
                >
                    {post.liked_by_me ? "❤️" : "🤍"} {post.like_count || 0}
                </button>
            </div>
        </div>
    );
}

export default function FeedPage({ user, profile }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadPosts = useCallback(async () => {
        setLoading(true);
        const { data: rawPosts } = await supabase
            .from("posts")
            .select("*, profiles!posts_author_id_fkey(full_name, avatar_url)")
            .order("created_at", { ascending: false })
            .limit(50);

        if (!rawPosts) { setPosts([]); setLoading(false); return; }

        const { data: likes } = await supabase.from("post_likes").select("post_id, user_id");

        const enriched = rawPosts.map(p => {
            const postLikes = (likes || []).filter(l => l.post_id === p.id);
            return {
                ...p,
                like_count: postLikes.length,
                liked_by_me: user ? postLikes.some(l => l.user_id === user.id) : false,
            };
        });

        setPosts(enriched);
        setLoading(false);
    }, [user]);

    useEffect(() => { loadPosts(); }, [loadPosts]);

    const handleToggleLike = async (post) => {
        if (!user) return;
        // optimistic update
        setPosts(prev => prev.map(p => p.id === post.id
            ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.like_count + (p.liked_by_me ? -1 : 1) }
            : p));

        if (post.liked_by_me) {
            await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
        } else {
            await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
        }
    };

    const handlePosted = (newPost) => setPosts(prev => [newPost, ...prev]);

    return (
        <div className="page container" style={{ maxWidth: 600, paddingTop: "2rem", paddingBottom: "3rem" }}>
            <div className="sec-header">
                <div className="sec-title">Feed</div>
            </div>

            <Composer user={user} profile={profile} onPosted={handlePosted} />

            {loading ? (
                <div className="loading"><div className="spinner" />Loading feed...</div>
            ) : posts.length === 0 ? (
                <div className="loading">No posts yet — be the first to share something!</div>
            ) : (
                posts.map(p => <PostCard key={p.id} post={p} user={user} onToggleLike={handleToggleLike} />)
            )}
        </div>
    );
}
