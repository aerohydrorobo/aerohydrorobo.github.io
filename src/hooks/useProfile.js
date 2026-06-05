import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useProfile(userId) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) { setLoading(false); return; }
        const fetch = async () => {
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();
            setProfile(data);
            setLoading(false);
        };
        fetch();
    }, [userId]);

    const updateProfile = async (updates) => {
        const { data, error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", userId)
            .select()
            .single();
        if (!error) setProfile(data);
        return { data, error };
    };

    return { profile, loading, setProfile, updateProfile };
}