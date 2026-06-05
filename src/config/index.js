export const CONFIG = {
    departments: [
        "EEE", "CSE", "SWE", "Mechanical",
        "Aerospace", "Naval Architecture", "Robotics"
    ],

    domains: [
        { id: "land", label: "Land Robotics", icon: "🤖" },
        { id: "aerial", label: "Aerial & Drones", icon: "🚁" },
        { id: "marine", label: "Marine & Submarines", icon: "⚓" },
    ],

    statuses: [
        { id: "student", label: "Student" },
        { id: "fresh_graduate", label: "Fresh Graduate" },
        { id: "professional", label: "Professional" },
    ],

    semesters: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],

    workTypes: ["Remote", "Onsite", "Hybrid"],

    urgencies: [
        { id: "immediate", label: "Immediate" },
        { id: "1month", label: "1 Month" },
        { id: "longterm", label: "Long Term" },
    ],

    reactions: [
        { id: "well_done", label: "✅ Well done" },
        { id: "improve", label: "🔧 Improve" },
        { id: "impressive", label: "🚀 Impressive" },
    ],

    languages: [
        "English", "Bengali", "Hindi", "Urdu", "Arabic",
        "French", "German", "Japanese", "Chinese", "Spanish",
        "Russian", "Portuguese", "Turkish", "Korean", "Other"
    ],

    skillVerifyThreshold: 3,
};