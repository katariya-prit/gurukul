export const STATIC_DATA = {
    section1: {
        menuOptions: [
            { id: 1, label: "Amrut Nu Aachaman", path: "/amrut-nu-aachaman" },
            { id: 2, label: "Daily Darshan", path: "/daily-darshan" },
        ],
    },
    section2: {
        title: "Revolutionizing Education with AI",
        description:
            "An AI-Powered LMS bridging the digital divide in schools, colleges, coaching centres, and rural institutions — even offline.",
    },
    section3: {
        tagline: "AI-POWERED LEARNING",
        title: "Smart & Offline Infrastructure",
        description:
            "Offline content management powered by cutting-edge technology, which delivers the best education to students even without the internet.",
    },
    footer: {
        brandName: "RuralSpark",
        brandDescription:
            "Empowering rural education through cutting-edge AI technology, bringing digital content where it matters most.",
        contactEmail: "support@ruralspark.com",
        links: [
            { label: "About Us", href: "    #about" },
            { label: "Features", href: "#features" },
            { label: "Contact", href: "#contact" },
        ],
    },
};

// 🚀 Backend base URL - .env ma VITE_API_URL set karo, nahi to localhost fallback thashe
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";
