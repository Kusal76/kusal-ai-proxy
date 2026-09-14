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
} from "lucide-react";

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL?.trim() ?? ""
).replace(/\/$/, "");

const RESUME_URL = "/resume/Kusal_Dey_Resume.pdf";

type Message = {
    role: "user" | "ai";
    content: string;
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
        query:
            "Analyze my fit for this role:\n\n[PASTE JOB DESCRIPTION HERE]",
    },
    {
        label: "30-Second Summary",
        icon: <User size={14} />,
        actionType: "send",
        query:
            "Give me a 30-second summary of Kusal's professional profile and career targets.",
    },
    {
        label: "Technical Skills",
        icon: <Code2 size={14} />,
        actionType: "send",
        query:
            "What are Kusal's strongest technical skills?",
    },
    {
        label: "StockEasy",
        icon: <Briefcase size={14} />,
        actionType: "send",
        query:
            "Tell me about Kusal's StockEasy project.",
    },
    {
        label: "VectorDB",
        icon: <Database size={14} />,
        actionType: "send",
        query:
            "Tell me about Kusal's VectorDB Engine project.",
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
            content:
                "Hello! I’m the AI representative for Kusal Dey. Ask me about his skills, projects, education, technical decisions, coding profiles, or career direction.",
        },
    ]);

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] =
        useState<number | null>(null);

    const [isDark, setIsDark] = useState(false);
    const [themeReady, setThemeReady] = useState(false);

    const [inputMode, setInputMode] = useState<
        "normal" | "job_fit"
    >("normal");

    const messagesEndRef =
        useRef<HTMLDivElement>(null);

    const inputRef =
        useRef<HTMLTextAreaElement>(null);


    // =========================================================
    // THEME
    // =========================================================

    useEffect(() => {
        const savedTheme =
            localStorage.getItem("kusal-theme");

        if (savedTheme === "dark") {
            setIsDark(true);
        } else if (savedTheme === "light") {
            setIsDark(false);
        } else {
            setIsDark(
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches
            );
        }

        setThemeReady(true);
    }, []);

    useEffect(() => {
        if (!themeReady) return;

        localStorage.setItem(
            "kusal-theme",
            isDark ? "dark" : "light"
        );
    }, [isDark, themeReady]);


    // =========================================================
    // AUTO SCROLL
    // =========================================================

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages]);


    // =========================================================
    // SEND
    // =========================================================

    const handleSend = async (
        query: string,
        mode: "normal" | "job_fit" = inputMode
    ) => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery || isLoading) return;

        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: trimmedQuery,
            },
            {
                role: "ai",
                content: "",
            },
        ]);

        setInput("");
        setIsLoading(true);

        try {
            if (!API_BASE_URL) {
                throw new Error(
                    "NEXT_PUBLIC_API_URL is not configured."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        query: trimmedQuery,
                        mode:
                            mode === "job_fit"
                                ? "job_fit"
                                : null,
                    }),
                }
            );

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error("RATE_LIMITED");
                }

                if (response.status >= 500) {
                    throw new Error("BACKEND_UNAVAILABLE");
                }

                throw new Error("REQUEST_FAILED");
            }

            if (!response.body) {
                throw new Error("No response body");
            }

            const reader =
                response.body.getReader();

            const decoder =
                new TextDecoder("utf-8");

            let done = false;
            let accumulated = "";

            while (!done) {
                const {
                    value,
                    done: readerDone,
                } = await reader.read();

                done = readerDone;

                if (value) {
                    const chunk =
                        decoder.decode(value, {
                            stream: true,
                        });

                    accumulated += chunk;

                    setMessages((prev) => {
                        const updated = [...prev];

                        const lastIndex =
                            updated.length - 1;

                        updated[lastIndex] = {
                            ...updated[lastIndex],
                            content: accumulated,
                        };

                        return updated;
                    });
                }
            }
        } catch (error) {
            console.error(
                "Chat request failed:",
                error instanceof Error ? error.message : "unknown error"
            );

            const errorCode =
                error instanceof Error ? error.message : "UNKNOWN_ERROR";

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

                updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: errorMessage,
                };

                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };


    // =========================================================
    // QUICK ACTION
    // =========================================================

    const handleQuickAction = (
        action: QuickAction
    ) => {
        if (action.actionType === "send") {
            handleSend(
                action.query,
                "normal"
            );

            return;
        }

        // JD mode
        setInputMode("job_fit");
        setInput(action.query);

        requestAnimationFrame(() => {
            inputRef.current?.focus();

            const placeholder =
                "[PASTE JOB DESCRIPTION HERE]";

            const start =
                action.query.indexOf(
                    placeholder
                );

            if (start !== -1) {
                inputRef.current?.setSelectionRange(
                    start,
                    start + placeholder.length
                );
            }
        });
    };


    // =========================================================
    // CLEAR CHAT
    // =========================================================

    const clearChat = () => {
        setMessages([
            {
                role: "ai",
                content:
                    "Hello! I’m the AI representative for Kusal Dey. Ask me about his skills, projects, education, technical decisions, coding profiles, or career direction.",
            },
        ]);

        setInput("");
        setInputMode("normal");
    };


    // =========================================================
    // COPY
    // =========================================================

    const copyMessage = async (
        content: string,
        index: number
    ) => {
        try {
            await navigator.clipboard.writeText(
                content
            );

            setCopiedIndex(index);

            setTimeout(() => {
                setCopiedIndex(null);
            }, 1500);
        } catch (error) {
            console.error(
                "Copy failed:",
                error
            );
        }
    };


    // =========================================================
    // KEYBOARD
    // =========================================================

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            handleSend(
                input,
                inputMode
            );
        }
    };


    // =========================================================
    // THEME COLORS
    // =========================================================

    const bg = isDark
        ? "bg-[#0b1120]"
        : "bg-[#f8fafc]";

    const surface = isDark
        ? "bg-[#111827]"
        : "bg-white";

    const border = isDark
        ? "border-gray-800"
        : "border-gray-200";

    const primaryText = isDark
        ? "text-gray-100"
        : "text-gray-900";

    const muted = isDark
        ? "text-gray-400"
        : "text-gray-500";

    const faint = isDark
        ? "text-gray-500"
        : "text-gray-400";


    return (
        <div
            className={`flex h-screen overflow-hidden transition-colors duration-300 ${bg} ${primaryText}`}
        >

            {/* =====================================================
          SIDEBAR
      ===================================================== */}

            <aside
                className={`hidden w-[275px] shrink-0 flex-col border-r lg:flex ${surface} ${border}`}
            >

                {/* Profile */}
                <div
                    className={`border-b px-5 py-5 ${border}`}
                >
                    <div className="flex items-center gap-3.5">
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
                            <h1 className="truncate text-[17px] font-bold">
                                Kusal Dey
                            </h1>

                            <p
                                className={`mt-0.5 truncate text-[11px] ${muted}`}
                            >
                                AI / ML & Full-Stack Engineer
                            </p>
                        </div>
                    </div>

                    <div
                        className={`mt-3 flex items-center gap-1.5 text-[11px] ${muted}`}
                    >
                        <MapPin size={12} />
                        Barrackpore, Kolkata
                    </div>

                    <div
                        className={`mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] ${isDark
                            ? "border-blue-900/50 bg-blue-950/30 text-blue-300"
                            : "border-blue-100 bg-blue-50 text-blue-700"
                            }`}
                    >
                        <Sparkles size={13} />
                        Open to AI / ML opportunities
                    </div>
                </div>


                {/* Career Focus */}
                <section
                    className={`border-b px-5 py-4 ${border}`}
                >
                    <p
                        className={`mb-2.5 text-[10px] font-semibold uppercase tracking-wider ${faint}`}
                    >
                        Career Focus
                    </p>

                    <div className="grid grid-cols-2 gap-y-2">
                        {[
                            "AI Engineer",
                            "ML Engineer",
                            "GenAI",
                            "Software Dev",
                        ].map((item) => (
                            <div
                                key={item}
                                className={`flex items-center gap-1.5 text-xs ${muted}`}
                            >
                                <ChevronRight
                                    size={11}
                                    className="text-blue-500"
                                />
                                {item}
                            </div>
                        ))}
                    </div>
                </section>


                {/* Core Areas */}
                <section
                    className={`border-b px-5 py-4 ${border}`}
                >
                    <p
                        className={`mb-2.5 text-[10px] font-semibold uppercase tracking-wider ${faint}`}
                    >
                        Core Areas
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                        {[
                            {
                                label: "Python",
                                icon: <Terminal size={11} />,
                            },
                            {
                                label: "AI / ML",
                                icon: (
                                    <BrainCircuit size={11} />
                                ),
                            },
                            {
                                label: "FastAPI",
                                icon: (
                                    <Code2 size={11} />
                                ),
                            },
                            {
                                label: "PostgreSQL",
                                icon: (
                                    <Database size={11} />
                                ),
                            },
                            {
                                label: "Next.js",
                                icon: (
                                    <Code2 size={11} />
                                ),
                            },
                            {
                                label: "RAG",
                                icon: (
                                    <BrainCircuit size={11} />
                                ),
                            },
                        ].map((skill) => (
                            <span
                                key={skill.label}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${isDark
                                    ? "bg-gray-800 text-gray-300"
                                    : "bg-gray-100 text-gray-600"
                                    }`}
                            >
                                {skill.icon}
                                {skill.label}
                            </span>
                        ))}
                    </div>
                </section>


                {/* Featured Projects */}
                <section className="px-5 py-4">
                    <div className="mb-2.5 flex items-center justify-between">
                        <p
                            className={`text-[10px] font-semibold uppercase tracking-wider ${faint}`}
                        >
                            Featured Projects
                        </p>

                        <span
                            className={`text-[10px] ${faint}`}
                        >
                            2
                        </span>
                    </div>

                    <div className="space-y-2">

                        {/* StockEasy */}
                        <button
                            type="button"
                            onClick={() =>
                                handleSend(
                                    "Tell me about Kusal's StockEasy project."
                                )
                            }
                            className={`group w-full rounded-lg border p-3 text-left transition ${isDark
                                ? "border-gray-800 bg-gray-900 hover:border-blue-800 hover:bg-blue-950/20"
                                : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-md ${isDark
                                            ? "bg-blue-950/50 text-blue-300"
                                            : "bg-blue-100 text-blue-600"
                                            }`}
                                    >
                                        <Briefcase size={13} />
                                    </div>

                                    <span className="text-xs font-semibold">
                                        StockEasy
                                    </span>
                                </div>

                                <ChevronRight
                                    size={13}
                                    className={`${faint} transition-transform group-hover:translate-x-0.5`}
                                />
                            </div>

                            <p
                                className={`mt-2 text-[10px] leading-relaxed ${muted}`}
                            >
                                Multi-tenant pharmacy management &
                                POS SaaS
                            </p>
                        </button>


                        {/* VectorDB */}
                        <button
                            type="button"
                            onClick={() =>
                                handleSend(
                                    "Tell me about Kusal's VectorDB Engine project."
                                )
                            }
                            className={`group w-full rounded-lg border p-3 text-left transition ${isDark
                                ? "border-gray-800 bg-gray-900 hover:border-blue-800 hover:bg-blue-950/20"
                                : "border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-md ${isDark
                                            ? "bg-indigo-950/50 text-indigo-300"
                                            : "bg-indigo-100 text-indigo-600"
                                            }`}
                                    >
                                        <Database size={13} />
                                    </div>

                                    <span className="text-xs font-semibold">
                                        VectorDB Engine
                                    </span>
                                </div>

                                <ChevronRight
                                    size={13}
                                    className={`${faint} transition-transform group-hover:translate-x-0.5`}
                                />
                            </div>

                            <p
                                className={`mt-2 text-[10px] leading-relaxed ${muted}`}
                            >
                                Custom vector search & local RAG
                            </p>
                        </button>

                    </div>
                </section>


                {/* Bottom Links */}
                <div
                    className={`mt-auto border-t px-5 py-4 ${border}`}
                >
                    <div className="grid grid-cols-3 gap-2">

                        <a
                            href="https://github.com/Kusal76"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] transition ${isDark
                                ? "border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                                : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                }`}
                        >
                            <Code2 size={14} />
                            GitHub
                        </a>

                        <a
                            href="https://www.linkedin.com/in/kusal-dey-b938a0241"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] transition ${isDark
                                ? "border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                                : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                }`}
                        >
                            <ExternalLink size={14} />
                            LinkedIn
                        </a>

                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=kusaldey2004@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[10px] transition ${isDark
                                ? "border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                                : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                }`}
                            title="Email Kusal"
                        >
                            <Mail size={14} />
                            Email
                        </a>

                    </div>
                </div>
            </aside>


            {/* =====================================================
          MAIN
      ===================================================== */}

            <div className="flex min-w-0 flex-1 flex-col">

                {/* Header */}
                <header
                    className={`flex h-[72px] shrink-0 items-center justify-between border-b px-5 sm:px-7 ${surface} ${border}`}
                >
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[17px] font-semibold tracking-tight">
                                Kusal&apos;s AI Proxy
                            </h2>

                            <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${isDark
                                    ? "bg-green-950/60 text-green-400"
                                    : "bg-green-50 text-green-700"
                                    }`}
                            >
                                LIVE
                            </span>
                        </div>

                        <p
                            className={`mt-1 text-[11px] ${muted}`}
                        >
                            Explore Kusal&apos;s verified professional profile
                        </p>
                    </div>

                    <div className="flex items-center gap-2">

                        {/* Resume */}
                        <a
                            href={RESUME_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition sm:px-3 ${isDark
                                ? "border-blue-800 bg-blue-950/40 text-blue-300 hover:bg-blue-900/50"
                                : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                }`}
                            title="View Kusal's resume"
                        >
                            <FileText size={14} />
                            <span className="hidden sm:inline">View Resume</span>
                        </a>

                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=kusaldey2004@gmail.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`rounded-lg p-2 transition ${isDark
                                ? "text-gray-500 hover:bg-gray-800 hover:text-gray-200"
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"
                                }`}
                            title="Email Kusal"
                        >
                            <Mail size={17} />
                        </a>

                        <a
                            href="https://github.com/Kusal76"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`rounded-lg p-2 transition ${isDark
                                ? "text-gray-500 hover:bg-gray-800 hover:text-gray-200"
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"
                                }`}
                            title="GitHub"
                        >
                            <Code2 size={17} />
                        </a>

                        <button
                            type="button"
                            onClick={() =>
                                setIsDark(
                                    (prev) => !prev
                                )
                            }
                            className={`rounded-lg p-2 transition ${isDark
                                ? "text-yellow-400 hover:bg-gray-800"
                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                }`}
                            title={
                                isDark
                                    ? "Switch to light mode"
                                    : "Switch to dark mode"
                            }
                        >
                            {isDark ? (
                                <Sun size={18} />
                            ) : (
                                <Moon size={18} />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={clearChat}
                            disabled={isLoading}
                            className={`rounded-lg p-2 transition disabled:opacity-40 ${isDark
                                ? "text-gray-500 hover:bg-gray-800 hover:text-gray-200"
                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-800"
                                }`}
                            title="Clear conversation"
                        >
                            <Trash2 size={17} />
                        </button>

                    </div>
                </header>


                {/* =====================================================
            CHAT
        ===================================================== */}

                <main className="min-h-0 flex-1 overflow-y-auto">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-7 sm:px-8 sm:py-8">

                        {messages.map(
                            (msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                        }`}
                                >

                                    <div
                                        className={`flex max-w-[96%] gap-3 sm:max-w-[90%] ${msg.role === "user"
                                            ? "flex-row-reverse"
                                            : "flex-row"
                                            }`}
                                    >

                                        {/* Avatar */}
                                        <div
                                            className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${msg.role === "user"
                                                ? "bg-blue-600"
                                                : isDark
                                                    ? "border border-gray-800 bg-gray-900"
                                                    : "border border-gray-200 bg-white shadow-sm"
                                                }`}
                                        >
                                            {msg.role ===
                                                "user" ? (
                                                <User
                                                    size={14}
                                                    className="text-white"
                                                />
                                            ) : (
                                                <Bot
                                                    size={14}
                                                    className="text-blue-500"
                                                />
                                            )}
                                        </div>


                                        {/* Message */}
                                        <div
                                            className={`rounded-2xl ${msg.role === "user"
                                                ? "bg-blue-600 px-4 py-3 text-white shadow-sm"
                                                : `border px-6 py-5 shadow-sm ${isDark
                                                    ? "border-gray-800 bg-[#111827]"
                                                    : "border-gray-200 bg-white"
                                                }`
                                                }`}
                                        >

                                            {msg.role ===
                                                "user" ? (
                                                <p className="whitespace-pre-wrap text-sm leading-6">
                                                    {msg.content}
                                                </p>
                                            ) : msg.content ? (
                                                <>
                                                    <div
                                                        className={`prose prose-sm max-w-none leading-relaxed ${isDark
                                                            ? "prose-invert"
                                                            : ""
                                                            }`}
                                                    >
                                                        <ReactMarkdown>
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    </div>

                                                    <div
                                                        className={`mt-4 border-t pt-2 ${isDark
                                                            ? "border-gray-800"
                                                            : "border-gray-100"
                                                            }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                copyMessage(
                                                                    msg.content,
                                                                    idx
                                                                )
                                                            }
                                                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] transition ${isDark
                                                                ? "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                                                                : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                                                                }`}
                                                        >
                                                            {copiedIndex ===
                                                                idx ? (
                                                                <>
                                                                    <Check size={11} />
                                                                    Copied
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy size={11} />
                                                                    Copy
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div
                                                    className={`flex items-center gap-2 text-xs ${muted}`}
                                                >
                                                    <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />

                                                    <span>
                                                        {inputMode ===
                                                            "job_fit"
                                                            ? "Analyzing role fit..."
                                                            : "Analyzing verified data..."}
                                                    </span>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        <div ref={messagesEndRef} />

                    </div>
                </main>


                {/* =====================================================
            COMPOSER
        ===================================================== */}

                <footer
                    className={`shrink-0 border-t ${surface} ${border}`}
                >
                    <div className="mx-auto w-full max-w-6xl px-5 py-4 sm:px-8">

                        {/* Quick Actions */}
                        <div className="mb-3 overflow-x-auto">
                            <div className="flex w-max min-w-full items-center justify-center gap-2">

                                {quickActions.map(
                                    (action) => (
                                        <button
                                            key={action.label}
                                            type="button"
                                            onClick={() =>
                                                handleQuickAction(
                                                    action
                                                )
                                            }
                                            disabled={
                                                isLoading
                                            }
                                            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition ${action.actionType ===
                                                "fill"
                                                ? isDark
                                                    ? "border-blue-800 bg-blue-950/40 text-blue-300 hover:bg-blue-900/40"
                                                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                : isDark
                                                    ? "border-gray-800 bg-gray-900 text-gray-400 hover:bg-gray-800"
                                                    : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                                                } disabled:opacity-40`}
                                        >
                                            {action.icon}
                                            {action.label}
                                        </button>
                                    )
                                )}

                            </div>
                        </div>


                        {/* JD mode indicator */}
                        {inputMode ===
                            "job_fit" && (
                                <div
                                    className={`mb-2 flex items-center justify-between rounded-lg border px-3 py-2 text-[11px] ${isDark
                                        ? "border-blue-900/60 bg-blue-950/30 text-blue-300"
                                        : "border-blue-100 bg-blue-50 text-blue-700"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText size={13} />
                                        <span className="font-medium">
                                            Job Description Analysis Mode
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setInputMode(
                                                "normal"
                                            )
                                        }
                                        className="rounded px-1.5 py-0.5 text-[10px] hover:bg-black/5 dark:hover:bg-white/10"
                                    >
                                        Exit
                                    </button>
                                </div>
                            )}


                        {/* Suggested Questions */}
                        {messages.length ===
                            1 && (
                                <div className="mb-3">
                                    <div
                                        className={`mb-2 flex items-center gap-1.5 text-[10px] font-medium ${muted}`}
                                    >
                                        <Sparkles size={11} />
                                        Suggested questions
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-1">

                                        {suggestedQuestions.map(
                                            (question) => (
                                                <button
                                                    key={question}
                                                    type="button"
                                                    onClick={() =>
                                                        handleSend(
                                                            question,
                                                            "normal"
                                                        )
                                                    }
                                                    disabled={
                                                        isLoading
                                                    }
                                                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-[10px] transition ${isDark
                                                        ? "border-gray-800 bg-gray-900 text-gray-400 hover:border-blue-800 hover:text-blue-300"
                                                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700"
                                                        } disabled:opacity-40`}
                                                >
                                                    {question}
                                                </button>
                                            )
                                        )}

                                    </div>
                                </div>
                            )}


                        {/* Composer */}
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();

                                handleSend(
                                    input,
                                    inputMode
                                );
                            }}
                            className={`relative rounded-xl border p-2 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 ${isDark
                                ? "border-gray-700 bg-gray-900"
                                : "border-gray-300 bg-gray-50"
                                }`}
                        >

                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(event) =>
                                    setInput(
                                        event.target.value
                                    )
                                }
                                onKeyDown={
                                    handleKeyDown
                                }
                                disabled={
                                    isLoading
                                }
                                rows={
                                    inputMode ===
                                        "job_fit"
                                        ? 6
                                        : 3
                                }
                                placeholder={
                                    inputMode ===
                                        "job_fit"
                                        ? "Paste the complete Job Description here..."
                                        : "Ask about Kusal, or paste a Job Description..."
                                }
                                className={`w-full resize-none border-0 bg-transparent px-3 py-2 pr-14 text-sm outline-none placeholder:text-gray-400 disabled:opacity-50 ${isDark
                                    ? "text-gray-100"
                                    : "text-gray-900"
                                    }`}
                            />


                            <div className="flex items-center justify-between px-2 pb-1">

                                <div
                                    className={`flex items-center gap-1.5 text-[10px] ${muted}`}
                                >
                                    <FileText size={11} />

                                    <span>
                                        {inputMode ===
                                            "job_fit"
                                            ? "Compare this role against Kusal's verified profile"
                                            : "Ask a question or paste a full Job Description"}
                                    </span>
                                </div>

                                <span
                                    className={`hidden text-[10px] ${faint} sm:block`}
                                >
                                    Enter to send · Shift + Enter for new line
                                </span>

                            </div>


                            <button
                                type="submit"
                                disabled={
                                    !input.trim() ||
                                    isLoading
                                }
                                className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-500"
                            >
                                <Send size={16} />
                            </button>

                        </form>


                        <div
                            className={`mt-2.5 flex items-center justify-center gap-1.5 text-[9px] ${faint}`}
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                            Answers are grounded in Kusal&apos;s verified professional profile.
                        </div>

                    </div>
                </footer>

            </div>
        </div>
    );
}