"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import {
    Send,
    User,
    Bot,
    Briefcase,
    Code2,
    FileText,
    ExternalLink,
    Sparkles,
    Copy,
    Check,
    Trash2,
    MapPin,
    ChevronRight,
    BrainCircuit,
    Database,
    Terminal,
    Sun,
    Moon,
    Mail,
    Menu,
    X,
    Plus,
    MessageSquare,
    Download
} from "lucide-react";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() ?? "").replace(/\/$/, "");
const RESUME_URL = "/resume/Kusal_Dey_Resume.pdf";

type Message = {
    role: "user" | "ai";
    content: string;
};

type ChatSession = {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
};

type QuickAction = {
    label: string;
    icon: React.ReactNode;
    actionType: "fill" | "send";
    query: string;
    mode?: "job_fit";
};

const quickActions: QuickAction[] = [
    {
        label: "Analyze JD",
        icon: <FileText size={14} />,
        actionType: "fill",
        mode: "job_fit",
        query: "Analyze my fit for this role:\n\n[PASTE JOB DESCRIPTION HERE]",
    },
    {
        label: "30-Second Summary",
        icon: <User size={14} />,
        actionType: "send",
        query: "Give me a 30-second summary of Kusal's professional profile and career targets.",
    },
    {
        label: "Technical Skills",
        icon: <Code2 size={14} />,
        actionType: "send",
        query: "What are Kusal's strongest technical skills?",
    },
    {
        label: "StockEasy",
        icon: <Briefcase size={14} />,
        actionType: "send",
        query: "Tell me about Kusal's StockEasy project.",
    },
    {
        label: "VectorDB",
        icon: <Database size={14} />,
        actionType: "send",
        query: "Tell me about Kusal's VectorDB Engine project.",
    },
];

const suggestedQuestions = [
    "Tell me about Kusal.",
    "What are his strongest AI/ML skills?",
    "Explain StockEasy.",
    "Explain the VectorDB Engine.",
    "What is Kusal's GitHub?",
];

export default function PortfolioChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: "Hello! I’m the AI representative for Kusal Dey. Ask me about his skills, projects, education, technical decisions, coding profiles, or career direction.",
        },
    ]);

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const [isDark, setIsDark] = useState(false);
    const [themeReady, setThemeReady] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [inputMode, setInputMode] = useState<"normal" | "job_fit">("normal");

    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);


    // =========================================================
    // INITIALIZATION & THEME
    // =========================================================

    useEffect(() => {
        const savedTheme = localStorage.getItem("kusal-theme");
        if (savedTheme === "dark") {
            setIsDark(true);
        } else if (savedTheme === "light") {
            setIsDark(false);
        } else {
            setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
        setThemeReady(true);

        const loadedSessions = localStorage.getItem("kusal-chat-sessions");
        if (loadedSessions) {
            try {
                setSessions(JSON.parse(loadedSessions));
            } catch (e) {
                console.error("Failed to parse chat history");
            }
        }
        setCurrentSessionId(crypto.randomUUID());
    }, []);

    useEffect(() => {
        if (!themeReady) return;
        localStorage.setItem("kusal-theme", isDark ? "dark" : "light");
    }, [isDark, themeReady]);


    // =========================================================
    // CHAT HISTORY MANAGEMENT
    // =========================================================

    useEffect(() => {
        if (isLoading || messages.length <= 1 || !currentSessionId) return;

        setSessions((prev) => {
            const titleRaw = messages.find(m => m.role === "user")?.content || "New Conversation";
            const title = titleRaw.length > 35 ? titleRaw.substring(0, 35) + "..." : titleRaw;

            const newSession: ChatSession = {
                id: currentSessionId,
                title,
                messages,
                updatedAt: Date.now()
            };

            const existingIdx = prev.findIndex(s => s.id === currentSessionId);
            let updated;

            if (existingIdx >= 0) {
                updated = [...prev];
                updated[existingIdx] = newSession;
            } else {
                updated = [newSession, ...prev];
            }

            updated.sort((a, b) => b.updatedAt - a.updatedAt);
            const limited = updated.slice(0, 15);

            localStorage.setItem("kusal-chat-sessions", JSON.stringify(limited));
            return limited;
        });
    }, [isLoading, messages, currentSessionId]);

    const startNewChat = () => {
        setMessages([
            {
                role: "ai",
                content: "Hello! I’m the AI representative for Kusal Dey. Ask me about his skills, projects, education, technical decisions, coding profiles, or career direction.",
            },
        ]);
        setCurrentSessionId(crypto.randomUUID());
        setInput("");
        setInputMode("normal");
        if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
    };

    const loadChat = (id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            setMessages(session.messages);
            setCurrentSessionId(session.id);
            if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
        }
    };

    const deleteChat = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSessions(prev => {
            const updated = prev.filter(s => s.id !== id);
            localStorage.setItem("kusal-chat-sessions", JSON.stringify(updated));
            return updated;
        });
        if (currentSessionId === id) {
            startNewChat();
        }
    };


    // =========================================================
    // AUTO SCROLL
    // =========================================================

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);


    // =========================================================
    // SEND
    // =========================================================

    const handleSend = async (query: string, mode: "normal" | "job_fit" = inputMode) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || isLoading) return;

        setIsMobileMenuOpen(false);

        setMessages((prev) => [
            ...prev,
            { role: "user", content: trimmedQuery },
            { role: "ai", content: "" },
        ]);

        setInput("");
        setIsLoading(true);

        try {
            if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured.");

            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: trimmedQuery,
                    mode: mode === "job_fit" ? "job_fit" : null,
                }),
            });

            if (!response.ok) {
                if (response.status === 429) throw new Error("RATE_LIMITED");
                if (response.status >= 500) throw new Error("BACKEND_UNAVAILABLE");
                throw new Error("REQUEST_FAILED");
            }

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;
            let accumulated = "";

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    accumulated += chunk;

                    setMessages((prev) => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        updated[lastIndex] = { ...updated[lastIndex], content: accumulated };
                        return updated;
                    });
                }
            }
        } catch (error) {
            console.error("Chat request failed:", error instanceof Error ? error.message : "unknown error");
            const errorCode = error instanceof Error ? error.message : "UNKNOWN_ERROR";
            const errorMessage =
                errorCode === "RATE_LIMITED"
                    ? "The AI service is temporarily busy. Please try again in a moment."
                    : errorCode === "BACKEND_UNAVAILABLE"
                        ? "The AI service is temporarily unavailable. Please try again shortly."
                        : errorCode === "REQUEST_FAILED"
                            ? "The request could not be completed. Please try again."
                            : errorCode === "NEXT_PUBLIC_API_URL is not configured."
                                ? "The AI service is not configured for this environment."
                                : "The AI service could not complete the request.";

            setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                updated[lastIndex] = { ...updated[lastIndex], content: errorMessage };
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };


    // =========================================================
    // QUICK ACTION
    // =========================================================

    const handleQuickAction = (action: QuickAction) => {
        if (action.actionType === "send") {
            handleSend(action.query, "normal");
            return;
        }

        setInputMode("job_fit");
        setInput(action.query);

        requestAnimationFrame(() => {
            inputRef.current?.focus();
            const placeholder = "[PASTE JOB DESCRIPTION HERE]";
            const start = action.query.indexOf(placeholder);

            if (start !== -1) {
                inputRef.current?.setSelectionRange(start, start + placeholder.length);
            }
        });
    };


    // =========================================================
    // CLEAR CHAT & EXPORT PDF
    // =========================================================

    const clearChat = () => {
        setMessages([
            {
                role: "ai",
                content: "Hello! I’m the AI representative for Kusal Dey. Ask me about his skills, projects, education, technical decisions, coding profiles, or career direction.",
            },
        ]);
        setInput("");
        setInputMode("normal");
    };

    const handleExportPDF = () => {
        window.print();
    };


    // =========================================================
    // COPY
    // =========================================================

    const copyMessage = async (content: string, index: number) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1500);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    };


    // =========================================================
    // KEYBOARD
    // =========================================================

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend(input, inputMode);
        }
    };


    // =========================================================
    // THEME COLORS
    // =========================================================

    const bg = isDark ? "bg-[#0b1120]" : "bg-[#f8fafc]";
    const surface = isDark ? "bg-[#111827]" : "bg-white";
    const border = isDark ? "border-gray-800" : "border-gray-200";
    const primaryText = isDark ? "text-gray-100" : "text-gray-900";
    const muted = isDark ? "text-gray-400" : "text-gray-500";
    const faint = isDark ? "text-gray-500" : "text-gray-400";


    return (
        <div className={`flex h-[100dvh] min-h-0 overflow-hidden overscroll-none transition-colors duration-300 ${bg} ${primaryText} print:h-auto print:overflow-visible print:bg-white print:text-black`}>

            {/* =====================================================
                MOBILE BACKDROP
            ===================================================== */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity print:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* =====================================================
                SIDEBAR
            ===================================================== */}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[calc(100vw-1rem)] shrink-0 flex-col border-r transform transition-transform duration-300 lg:static lg:w-[275px] lg:max-w-none lg:translate-x-0 ${surface} ${border} ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} print:hidden`}
            >
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden">

                    {/* Profile */}
                    <div className={`relative border-b px-5 py-5 ${border}`}>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-label="Close menu"
                            className={`absolute right-4 top-4 rounded-full p-1.5 lg:hidden touch-manipulation transition ${isDark ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"}`}
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3.5 pr-6">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-md shadow-blue-500/20 ring-1 ring-gray-200 dark:ring-gray-700">
                                <Image
                                    src="/profile/Kusal_Dey.png"
                                    alt="Kusal Dey"
                                    width={48}
                                    height={48}
                                    className="h-full w-full object-cover"
                                    priority
                                />
                            </div>

                            <div className="min-w-0">
                                <h1 className="truncate text-[17px] font-bold">Kusal Dey</h1>
                                <p className={`mt-0.5 truncate text-[11px] ${muted}`}>AI / ML & Full-Stack Engineer</p>
                            </div>
                        </div>

                        <div className={`mt-3 flex items-center gap-1.5 text-[11px] ${muted}`}>
                            <MapPin size={12} />
                            Barrackpore, Kolkata
                        </div>
                    </div>

                    {/* New Chat Button */}
                    <div className={`border-b px-4 py-3 ${border}`}>
                        <button
                            onClick={startNewChat}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-sm"
                        >
                            <Plus size={15} /> New Chat
                        </button>
                    </div>

                    {/* Recent Conversations */}
                    {sessions.length > 0 && (
                        <section className={`border-b px-3 py-3 ${border}`}>
                            <p className={`mb-2 ml-2 text-[10px] font-semibold uppercase tracking-wider ${faint}`}>
                                Recent Chats
                            </p>
                            <div className="space-y-0.5">
                                {sessions.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => loadChat(s.id)}
                                        className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition ${s.id === currentSessionId ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700') : (isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate pr-2">
                                            <MessageSquare size={13} className="shrink-0 opacity-70" />
                                            <span className="truncate">{s.title}</span>
                                        </div>
                                        <button
                                            onClick={(e) => deleteChat(e, s.id)}
                                            className={`opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400`}
                                            title="Delete chat"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Career Focus */}
                    <section className={`border-b px-5 py-4 ${border}`}>
                        <p className={`mb-2.5 text-[10px] font-semibold uppercase tracking-wider ${faint}`}>
                            Career Focus
                        </p>
                        <div className="grid grid-cols-2 gap-y-2">
                            {["AI Engineer", "ML Engineer", "GenAI", "Software Dev"].map((item) => (
                                <div key={item} className={`flex items-center gap-1.5 text-xs ${muted}`}>
                                    <ChevronRight size={11} className="text-blue-500" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </section>


                    {/* Core Areas */}
                    <section className={`border-b px-5 py-4 ${border}`}>
                        <p className={`mb-2.5 text-[10px] font-semibold uppercase tracking-wider ${faint}`}>
                            Core Areas
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: "Python", icon: <Terminal size={11} /> },
                                { label: "AI / ML", icon: <BrainCircuit size={11} /> },
                                { label: "FastAPI", icon: <Code2 size={11} /> },
                                { label: "PostgreSQL", icon: <Database size={11} /> },
                                { label: "Next.js", icon: <Code2 size={11} /> },
                                { label: "RAG", icon: <BrainCircuit size={11} /> },
                            ].map((skill) => (
                                <span
                                    key={skill.label}
                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}
                                >
                                    {skill.icon}
                                    {skill.label}
                                </span>
                            ))}
                        </div>
                    </section>


                    {/* Featured Projects */}
                    <section className="px-5 py-4 flex-1">
                        <div className="mb-2.5 flex items-center justify-between">
                            <p className={`text-[10px] font-semibold uppercase tracking-wider ${faint}`}>
                                Featured Projects
                            </p>
                            <span className={`text-[10px] ${faint}`}>2</span>
                        </div>

                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => handleSend("Tell me about Kusal's StockEasy project.")}
                                className={`group w-full rounded-lg border p-3 text-left transition ${isDark ? "border-gray-800 bg-gray-900 hover:border-blue-800 hover:bg-blue-950/20" : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${isDark ? "bg-blue-950/50 text-blue-300" : "bg-blue-100 text-blue-600"}`}>
                                            <Briefcase size={13} />
                                        </div>
                                        <span className="text-xs font-semibold">StockEasy</span>
                                    </div>
                                    <ChevronRight size={13} className={`${faint} transition-transform group-hover:translate-x-0.5`} />
                                </div>
                                <p className={`mt-2 text-[10px] leading-relaxed ${muted}`}>
                                    Multi-tenant pharmacy management & POS SaaS
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSend("Tell me about Kusal's VectorDB Engine project.")}
                                className={`group w-full rounded-lg border p-3 text-left transition ${isDark ? "border-gray-800 bg-gray-900 hover:border-blue-800 hover:bg-blue-950/20" : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50"}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${isDark ? "bg-indigo-950/50 text-indigo-300" : "bg-indigo-100 text-indigo-600"}`}>
                                            <Database size={13} />
                                        </div>
                                        <span className="text-xs font-semibold">VectorDB Engine</span>
                                    </div>
                                    <ChevronRight size={13} className={`${faint} transition-transform group-hover:translate-x-0.5`} />
                                </div>
                                <p className={`mt-2 text-[10px] leading-relaxed ${muted}`}>
                                    Custom vector search & local RAG
                                </p>
                            </button>
                        </div>
                    </section>
                </div>

                {/* Bottom Links */}
                <div className={`mt-auto shrink-0 border-t px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] ${border} bg-inherit`}>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        <a
                            href="https://github.com/Kusal76"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] transition ${isDark ? "border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                        >
                            <Code2 size={14} />
                            GitHub
                        </a>
                        <a
                            href="https://www.linkedin.com/in/kusal-dey-b938a0241"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] transition ${isDark ? "border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                        >
                            <ExternalLink size={14} />
                            LinkedIn
                        </a>
                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=kusaldey2004@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] transition ${isDark ? "border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200" : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                            title="Email Kusal"
                        >
                            <Mail size={14} />
                            Email
                        </a>
                    </div>
                </div>
            </aside>


            {/* =====================================================
                MAIN AREA
            ===================================================== */}

            <div className="flex min-w-0 flex-1 flex-col print:h-auto print:overflow-visible">

                {/* Header */}
                <header
                    className={`flex min-h-[68px] shrink-0 items-center justify-between gap-3 border-b px-3 sm:px-5 lg:px-7 ${surface} ${border} print:hidden`}
                >
                    <div className="min-w-0 flex-1 flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open menu"
                            className="lg:hidden p-1.5 -ml-1 rounded-md touch-manipulation transition hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                                <h2 className="text-[16px] sm:text-[17px] font-semibold tracking-tight truncate">
                                    Kusal&apos;s AI Proxy
                                </h2>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold hidden sm:inline-block ${isDark ? "bg-green-950/60 text-green-400" : "bg-green-50 text-green-700"}`}>
                                    LIVE
                                </span>
                            </div>
                            <p className={`mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] truncate ${muted}`}>
                                Explore Kusal&apos;s verified professional profile
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 sm:gap-2">

                        {/* Resume (Restored) */}
                        <a
                            href={RESUME_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] sm:text-[11px] font-semibold transition sm:px-3 ${isDark ? "border-blue-800 bg-blue-950/40 text-blue-300 hover:bg-blue-900/50" : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
                            title="View Kusal's resume"
                        >
                            <FileText size={14} />
                            <span className="hidden sm:inline">View Resume</span>
                            <span className="sm:hidden">Resume</span>
                        </a>

                        {/* Download PDF Button */}
                        <button
                            type="button"
                            onClick={handleExportPDF}
                            className={`hidden sm:inline-flex rounded-lg p-2 transition ${isDark ? "text-gray-500 hover:bg-gray-800 hover:text-gray-200" : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"}`}
                            title="Export Chat as PDF"
                        >
                            <Download size={18} />
                        </button>

                        {/* Theme Toggle */}
                        <button
                            type="button"
                            onClick={() => setIsDark((prev) => !prev)}
                            className={`rounded-lg p-2 transition inline-flex ${isDark ? "text-yellow-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Clear Chat (Restored) */}
                        <button
                            type="button"
                            onClick={clearChat}
                            disabled={isLoading}
                            className={`hidden sm:inline-flex rounded-lg p-2 transition disabled:opacity-40 ${isDark ? "text-gray-500 hover:bg-gray-800 hover:text-gray-200" : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"}`}
                            title="Clear conversation"
                        >
                            <Trash2 size={17} />
                        </button>
                    </div>
                </header>

                {/* Print Title (Only visible in PDF) */}
                <div className="hidden print:block text-center py-6 border-b border-gray-200 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Kusal Dey - AI Proxy Transcript</h1>
                    <p className="text-gray-500 text-sm mt-1">Exported Conversation History</p>
                </div>


                {/* =====================================================
                    CHAT AREA
                ===================================================== */}

                <main className="min-h-0 flex-1 overflow-y-auto print:overflow-visible print:h-auto">
                    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 px-3 py-5 sm:gap-5 sm:px-8 sm:py-8 print:py-0">

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end print:justify-end" : "justify-start print:justify-start"}`}>
                                <div className={`flex min-w-0 max-w-[95%] sm:max-w-[90%] gap-2.5 sm:gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                                    {/* Avatar */}
                                    <div className={`mt-1 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg print:border print:border-gray-300 print:bg-white ${msg.role === "user" ? "bg-blue-600 print:bg-gray-100" : isDark ? "border border-gray-800 bg-gray-900" : "border border-gray-200 bg-white shadow-sm"}`}>
                                        {msg.role === "user" ? (
                                            <User size={14} className="text-white print:text-black" />
                                        ) : (
                                            <Bot size={14} className="text-blue-500 print:text-black" />
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div className={`min-w-0 max-w-full overflow-hidden rounded-2xl print:shadow-none print:border-gray-200 ${msg.role === "user" ? "bg-blue-600 px-3.5 py-2.5 text-white shadow-sm sm:px-4 sm:py-3 print:bg-gray-100 print:text-black" : `border px-4 py-4 shadow-sm sm:px-6 sm:py-5 ${isDark ? "border-gray-800 bg-[#111827]" : "border-gray-200 bg-white"}`}`}>
                                        {msg.role === "user" ? (
                                            <p className="whitespace-pre-wrap break-words text-[13px] sm:text-sm leading-6">
                                                {msg.content}
                                            </p>
                                        ) : msg.content ? (
                                            <>
                                                <div className={`prose prose-sm max-w-none break-words overflow-x-auto leading-relaxed [overflow-wrap:anywhere] print:text-black ${isDark ? "prose-invert print:prose-p:text-black print:prose-headings:text-black print:prose-strong:text-black" : ""}`}>
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>

                                                <div className={`mt-4 border-t pt-2 flex justify-end print:hidden ${isDark ? "border-gray-800" : "border-gray-100"}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyMessage(msg.content, idx)}
                                                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] transition ${isDark ? "text-gray-500 hover:bg-gray-800 hover:text-gray-300" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
                                                    >
                                                        {copiedIndex === idx ? (
                                                            <><Check size={11} /> Copied</>
                                                        ) : (
                                                            <><Copy size={11} /> Copy</>
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={`flex items-center gap-3 text-[11px] sm:text-xs print:hidden ${muted} py-1`}>
                                                {/* Elegant 3-dot bouncing animation */}
                                                <div className="flex space-x-1.5 items-center">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                                </div>
                                                <span className="font-medium tracking-wide">
                                                    {inputMode === "job_fit" ? "Analyzing role fit..." : "Retrieving verified data..."}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div ref={messagesEndRef} className="print:hidden" />
                    </div>
                </main>


                {/* =====================================================
                    COMPOSER
                ===================================================== */}

                <footer className={`shrink-0 border-t ${surface} ${border} print:hidden`}>
                    <div className="mx-auto w-full max-w-6xl px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-4">

                        {/* Quick Actions / Suggestions */}
                        <div className="mb-3 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                            <div className="flex w-max items-center justify-start gap-2 px-1 sm:w-full sm:justify-center">
                                {messages.length === 1 ? (
                                    suggestedQuestions.map((question) => (
                                        <button
                                            key={question}
                                            type="button"
                                            onClick={() => handleSend(question, "normal")}
                                            disabled={isLoading}
                                            className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] sm:text-[11px] font-medium transition ${isDark ? "border-gray-800 bg-gray-900 text-gray-400 hover:border-blue-800 hover:text-blue-300" : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700"} disabled:opacity-40`}
                                        >
                                            {question}
                                        </button>
                                    ))
                                ) : (
                                    quickActions.map((action) => (
                                        <button
                                            key={action.label}
                                            type="button"
                                            onClick={() => handleQuickAction(action)}
                                            disabled={isLoading}
                                            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 sm:px-3.5 py-1.5 text-[10px] sm:text-[11px] font-medium transition ${action.actionType === "fill" ? isDark ? "border-blue-800 bg-blue-950/40 text-blue-300 hover:bg-blue-900/40" : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : isDark ? "border-gray-800 bg-gray-900 text-gray-400 hover:bg-gray-800" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"} disabled:opacity-40`}
                                        >
                                            {action.icon}
                                            {action.label}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* JD mode indicator */}
                        {inputMode === "job_fit" && (
                            <div className={`mb-2 flex items-center justify-between rounded-lg border px-3 py-2 text-[10px] sm:text-[11px] ${isDark ? "border-blue-900/60 bg-blue-950/30 text-blue-300" : "border-blue-100 bg-blue-50 text-blue-700"}`}>
                                <div className="flex items-center gap-2">
                                    <FileText size={13} />
                                    <span className="font-medium">Job Description Analysis Mode</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setInputMode("normal")}
                                    className="rounded px-1.5 py-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition"
                                >
                                    Exit
                                </button>
                            </div>
                        )}

                        {/* Composer Form */}
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleSend(input, inputMode);
                            }}
                            className={`relative min-w-0 flex items-end rounded-xl border p-1 sm:p-2 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-300 bg-gray-50"}`}
                        >
                            <div className="flex-1 min-w-0">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                    rows={inputMode === "job_fit" ? 5 : 2}
                                    placeholder={inputMode === "job_fit" ? "Paste Job Description here..." : "Ask about Kusal..."}
                                    className={`w-full max-h-40 sm:max-h-60 resize-none overflow-y-auto border-0 bg-transparent px-2 sm:px-3 pt-2.5 pb-2 text-[13px] sm:text-sm leading-6 outline-none placeholder:text-gray-400 disabled:opacity-50 ${isDark ? "text-gray-100" : "text-gray-900"}`}
                                />
                                <div className="flex min-w-0 items-center justify-between gap-2 px-2 pb-1">
                                    <div className={`min-w-0 max-w-[78%] flex items-center gap-1.5 truncate text-[9px] sm:text-[10px] ${muted}`}>
                                        <FileText size={11} />
                                        <span>{inputMode === "job_fit" ? "Compare this role against Kusal's verified profile" : "Ask a question or paste a full Job Description"}</span>
                                    </div>
                                    <span className={`hidden min-w-0 flex-1 truncate pr-2 text-right text-[10px] ${faint} sm:block`}>
                                        Enter to send · Shift + Enter for new line
                                    </span>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                aria-label="Send message"
                                className="mb-1.5 mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition touch-manipulation hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-500 sm:h-9 sm:w-9"
                            >
                                <Send size={15} className="ml-0.5" />
                            </button>
                        </form>

                        <div className={`mt-2.5 flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] ${faint}`}>
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                            <span className="text-center">Answers are grounded in Kusal&apos;s verified professional profile.</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}