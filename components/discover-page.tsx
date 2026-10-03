"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    SearchIcon,
    PlayIcon,
    UsersIcon,
    SparklesIcon,
    BookOpenIcon,
    ChevronRightIcon,
    Gamepad2,
    Trophy,
    ArrowLeftIcon,
    LayoutGridIcon
} from "lucide-react"
import { TOPICS_BY_GRADE_SUBJECT } from "@/lib/curriculum-data"

// Enhanced Grade configuration with premium gradients and shadows
const GRADES = [
    { grade: 7, label: "7th Grade", gradient: " ", shadow: "", emoji: "🌊" },
    { grade: 8, label: "8th Grade", gradient: " ", shadow: "", emoji: "🌌" },
    { grade: 9, label: "9th Grade", gradient: " ", shadow: "", emoji: "🔮" },
    { grade: 10, label: "10th Grade", gradient: " ", shadow: "", emoji: "🧬" },
    { grade: 11, label: "11th Grade", gradient: " ", shadow: "", emoji: "🔬" },
    { grade: 12, label: "12th Grade", gradient: " ", shadow: "", emoji: "🎓" },
]

// Subject configuration by grade
const SUBJECTS_BY_GRADE: { [key: number]: { name: string; emoji: string }[] } = {
    7: [
        { name: "Mathematics", emoji: "🔢" },
        { name: "English Language Arts", emoji: "📝" },
        { name: "Science", emoji: "🔬" },
        { name: "Social Studies", emoji: "🌍" },
    ],
    8: [
        { name: "Mathematics", emoji: "🔢" },
        { name: "English Language Arts", emoji: "📝" },
        { name: "Science", emoji: "🔬" },
        { name: "Social Studies", emoji: "🌍" },
    ],
    9: [
        { name: "Mathematics", emoji: "📐" },
        { name: "English Language Arts", emoji: "📚" },
        { name: "Science", emoji: "🧬" },
        { name: "Social Studies", emoji: "🌍" },
    ],
    10: [
        { name: "Mathematics", emoji: "📐" },
        { name: "English Language Arts", emoji: "📚" },
        { name: "Science", emoji: "⚛️" },
        { name: "Social Studies", emoji: "🌍" },
    ],
    11: [
        { name: "Mathematics", emoji: "📐" },
        { name: "English Language Arts", emoji: "📚" },
        { name: "Science", emoji: "⚛️" },
        { name: "Social Studies", emoji: "🌍" },
    ],
    12: [
        { name: "Mathematics", emoji: "📐" },
        { name: "English Language Arts", emoji: "📚" },
        { name: "Science", emoji: "🧬" },
        { name: "Social Studies", emoji: "🌍" },
    ],
}

interface DiscoverPageProps {
    currentUser: any
    onStartGame: (grade: number, subject: string, mode: "solo" | "host", questions?: any[]) => void
    onJoinGame: (pin: string) => void
    onCreateWithAI: () => void
    discoveredSets?: any[]
}

export default function DiscoverPage({
    currentUser,
    onStartGame,
    onJoinGame,
    onCreateWithAI,
    discoveredSets = [],
}: DiscoverPageProps) {
    const [selectedGrade, setSelectedGrade] = useState<number>(7)
    const [searchQuery, setSearchQuery] = useState("")
    const [showJoinModal, setShowJoinModal] = useState(false)
    const [gamePin, setGamePin] = useState("")
    const [hoveredSubject, setHoveredSubject] = useState<number | null>(null)

    // View state for hierarchical navigation (Subjects -> Topics)
    const [viewMode, setViewMode] = useState<"subjects" | "topics">("subjects")
    const [selectedSubject, setSelectedSubject] = useState<{ name: string; emoji: string } | null>(null)

    const gradeInfo = GRADES.find((g) => g.grade === selectedGrade)
    const subjects = SUBJECTS_BY_GRADE[selectedGrade] || []

    const filteredSubjects = subjects.filter((subject) =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Get topics for the selected subject and grade
    const getTopics = () => {
        if (!selectedSubject) return []
        const gradeTopics = TOPICS_BY_GRADE_SUBJECT[selectedGrade] || {}
        return gradeTopics[selectedSubject.name] || []
    }

    const filteredTopics = getTopics().filter((topic) =>
        topic.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSubjectClick = (subject: { name: string; emoji: string }) => {
        // Check if there are topics for this subject
        const gradeTopics = TOPICS_BY_GRADE_SUBJECT[selectedGrade] || {}
        const topics = gradeTopics[subject.name] || []

        if (topics.length > 0) {
            setSelectedSubject(subject)
            setViewMode("topics")
            setSearchQuery("") // Clear search when entering topics
        } else {
            // Fallback: Start game directly if no sub-topics defined
            onStartGame(selectedGrade, subject.name, "solo")
        }
    }

    const handleBackToSubjects = () => {
        setViewMode("subjects")
        setSelectedSubject(null)
        setSearchQuery("")
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">

            {/* Header Section */}
            <div className="relative">
                {/* Decorative glow behind header */}
                <div className="club-decoration absolute -top-20 -left-20 w-64 h-64 club-purple rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        {viewMode === "topics" && selectedSubject ? (
                            <div className="flex items-center gap-3 mb-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleBackToSubjects}
                                    className="club-action club-well club-well club-ink rounded-full mr-2"
                                >
                                    <ArrowLeftIcon className="w-6 h-6" />
                                </Button>
                                <span className="font-heading text-4xl animate-bounce">{selectedSubject.emoji}</span>
                                <h1 className="font-heading text-4xl font-black tracking-tighter club-accent ">
                                    {selectedSubject.name}
                                </h1>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 mb-2">
                                <span className="font-heading text-4xl animate-bounce">🧭</span>
                                <h1 className="font-heading text-4xl font-black tracking-tighter club-accent ">
                                    Discover
                                </h1>
                            </div>
                        )}

                        <p className="font-heading text-xl club-accent font-medium max-w-lg leading-relaxed">
                            {viewMode === "topics"
                                ? "Select a topic to start your adventure!"
                                : "Embark on an educational journey. Learn, play, and compete with next-gen games!"
                            }
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => setShowJoinModal(true)}
                            className="club-action h-12 px-6 club-purple club-purple club-ink font-bold rounded-xl border club-border transition-all hover:scale-105 active:scale-95"
                        >
                            <UsersIcon className="w-5 h-5 mr-2" />
                            Join Game
                        </Button>
                        <Button
                            onClick={onCreateWithAI}
                            className="club-action h-12 px-6 club-surface club-ink font-bold rounded-xl border club-border transition-all hover:scale-105 active:scale-95 group"
                        >
                            <SparklesIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                            Create with AI
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grade Selector - Hide in topics view to focus attention, or keep it? Keeping it for quick switching */}
            <div className={`club-well border club-border rounded-xl p-6 transition-all duration-500 ${viewMode === "topics" ? "opacity-50 hover:opacity-100 scale-95" : ""}`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 club-surface rounded-xl border club-border">
                        <BookOpenIcon className="w-6 h-6 club-accent" />
                    </div>
                    <h3 className="font-heading text-xl club-ink font-bold tracking-tight">Select Grade Level</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {GRADES.map((grade) => {
                        const isSelected = selectedGrade === grade.grade
                        return (
                            <button
                                key={grade.grade}
                                onClick={() => {
                                    setSelectedGrade(grade.grade)
                                    // If changing grade in topics view, go back to subjects as topics might change
                                    if (viewMode === "topics") {
                                        setViewMode("subjects")
                                        setSelectedSubject(null)
                                    }
                                }}
                                className={`
                                    relative px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ease-out
                                    flex items-center gap-2 border
                                    ${isSelected
                                        ? `club-surface ${grade.gradient} club-border club-ink scale-105 ${grade.shadow}  ring-2 `
                                        : "club-well club-border club-muted club-well club-border club-ink hover:-translate-y-0.5"
                                    }
                                `}
                            >
                                <span className="font-heading text-lg">{grade.emoji}</span>
                                {grade.label}
                                {isSelected && (
                                    <span className="absolute inset-0 rounded-xl club-well pointer-events-none" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-2xl mx-auto md:mx-0">
                <div className="absolute -inset-1 club-surface rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 club-muted group-focus-within:text-purple-400 transition-colors" />
                    <Input
                        placeholder={viewMode === "topics" ? `Search topics in ${selectedSubject?.name}...` : `Search ${gradeInfo?.label} subjects...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-14 h-14 club-well club-border club-ink placeholder:text-white/30 rounded-xl text-lg focus:ring-2 club-border transition-all "
                    />
                </div>
            </div>

            {/* Custom AI Sets Section - Only show in Subjects View */}
            {viewMode === "subjects" && discoveredSets.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 club-accent" />
                        <h3 className="font-heading club-ink font-bold text-2xl tracking-tight">My AI Sets</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {discoveredSets.map((set, index) => (
                            <Card
                                key={`ai-set-${index}`}
                                className="club-surface club-border club-border transition-all duration-300 group cursor-pointer overflow-hidden hover:-translate-y-1"
                            >
                                <CardHeader className="pb-4 relative overflow-hidden">
                                    <div className="absolute inset-0 club-surface translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl club-purple flex items-center justify-center text-3xl ">
                                                🤖
                                            </div>
                                            <div>
                                                <CardTitle className="font-heading club-ink text-lg font-bold leading-tight">{set.title}</CardTitle>
                                                <p className="font-heading club-accent text-xs mt-1 font-medium">
                                                    Grade {set.grade} • {set.questions?.length || 0} Questions
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="club-purple club-ink border-0 px-3 py-1">
                                            AI Generated
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-2">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => onStartGame(set.grade, set.subject, "solo", set.questions)}
                                            className="club-action flex-1 club-purple club-purple club-ink font-bold rounded-xl h-10 transition-all border club-border text-xs"
                                        >
                                            <PlayIcon className="w-4 h-4 mr-1 fill-current" />
                                            Solo
                                        </Button>
                                        <Button
                                            onClick={() => onStartGame(set.grade, set.subject, "host", set.questions)}
                                            className="club-action flex-1 club-purple club-purple club-ink font-bold rounded-xl h-10 transition-all border club-border text-xs"
                                        >
                                            <UsersIcon className="w-4 h-4 mr-1" />
                                            Host
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] club-accent px-1">
                                        <span>{set.is_public ? "🌍 Public" : "🔒 Private"}</span>
                                        <span>{new Date(set.created_at).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW: SUBJECTS */}
            {viewMode === "subjects" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-left-4 duration-500">
                    {filteredSubjects.map((subject, index) => (
                        <Card
                            key={index}
                            onClick={() => handleSubjectClick(subject)}
                            onMouseEnter={() => setHoveredSubject(index)}
                            onMouseLeave={() => setHoveredSubject(null)}
                            className="club-well club-border club-border transition-all duration-500 group cursor-pointer overflow-hidden hover:-translate-y-2 relative"
                        >
                            {/* Hover Gradient Overlay */}
                            <div className={`absolute inset-0 club-surface ${gradeInfo?.gradient || " "} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                            <CardHeader className="pb-4 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl club-well border club-border flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                                            {subject.emoji}
                                        </div>
                                        <div>
                                            <CardTitle className="font-heading club-ink text-xl font-bold">{subject.name}</CardTitle>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className="club-well club-border club-muted text-xs px-2 py-0.5 rounded-full">
                                                    {gradeInfo?.label}
                                                </Badge>
                                                <Badge variant="secondary" className="club-purple club-accent border-none text-xs px-2 py-0.5 rounded-full">
                                                    {(TOPICS_BY_GRADE_SUBJECT[selectedGrade]?.[subject.name]?.length || 0)} Topics
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRightIcon className="w-6 h-6 club-muted club-ink group-hover:translate-x-1 transition-all" />
                                </div>
                            </CardHeader>

                            <CardContent className="pt-2 relative z-10">
                                <p className="font-heading club-muted text-sm line-clamp-2">
                                    Explore specific topics like
                                    {TOPICS_BY_GRADE_SUBJECT[selectedGrade]?.[subject.name]?.slice(0, 2).map((t: string) => ` ${t}`).join(", ")} and more.
                                </p>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredSubjects.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 club-well rounded-xl border border-dashed club-border ">
                            <div className="w-20 h-20 club-well rounded-full flex items-center justify-center mb-6 ">
                                <SearchIcon className="w-10 h-10 club-muted" />
                            </div>
                            <h3 className="font-heading club-ink font-bold text-2xl mb-2">No subjects found</h3>
                            <p className="font-heading club-muted">We couldn't find any subjects matching "{searchQuery}"</p>
                            <Button
                                variant="link"
                                onClick={() => setSearchQuery("")}
                                className="club-action mt-4 club-accent club-accent"
                            >
                                Clear search
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* VIEW: TOPICS */}
            {viewMode === "topics" && selectedSubject && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <LayoutGridIcon className="w-5 h-5 club-accent" />
                            <span className="font-heading club-muted font-medium">Available Topics ({filteredTopics.length})</span>
                        </div>
                        <Button
                            onClick={() => {
                                const randomTopic = filteredTopics[Math.floor(Math.random() * filteredTopics.length)]
                                onStartGame(selectedGrade, `${selectedSubject.name}: ${randomTopic}`, "solo")
                            }}
                            className="club-action club-surface club-ink font-bold rounded-xl h-10 border club-border"
                        >
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Surprise Me!
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredTopics.map((topic, index) => {
                            const isGeneral = topic.includes("General")
                            return (
                                <Card
                                    key={index}
                                    className={`
                                        ${isGeneral ? "club-purple club-border" : "club-well club-border"}
 club-border transition-all duration-300 group cursor-default overflow-hidden relative
 `}
                                >
                                    {/* Hover Gradient Overlay */}
                                    <div className={`absolute inset-0 club-surface ${gradeInfo?.gradient || " "} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                                    <CardHeader className="p-4 relative z-10">
                                        <div className="flex items-start justify-between min-h-[4rem]">
                                            <div className="flex flex-col gap-2">
                                                <CardTitle className={`club-ink text-base font-bold leading-tight ${isGeneral ? "club-accent" : ""}`}>
                                                    {topic}
                                                </CardTitle>
                                                {isGeneral && (
                                                    <Badge className="club-purple text-xs w-fit">Full Subject</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-4 pt-0 relative z-10">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                onClick={() => onStartGame(selectedGrade, `${selectedSubject.name}: ${topic}`, "solo")}
                                                className="club-action club-green club-green club-ink font-bold rounded-lg h-9 text-xs border-b-2 club-border active:border-b-0 active:translate-y-0.5 transition-all"
                                            >
                                                <Gamepad2 className="w-3 h-3 mr-1" />
                                                Solo
                                            </Button>
                                            <Button
                                                onClick={() => onStartGame(selectedGrade, `${selectedSubject.name}: ${topic}`, "host")}
                                                className="club-action club-purple club-purple club-ink font-bold rounded-lg h-9 text-xs border-b-2 club-border active:border-b-0 active:translate-y-0.5 transition-all"
                                            >
                                                <Trophy className="w-3 h-3 mr-1" />
                                                Host
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {filteredTopics.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 club-well rounded-xl border border-dashed club-border ">
                            <div className="w-20 h-20 club-well rounded-full flex items-center justify-center mb-6 ">
                                <SearchIcon className="w-10 h-10 club-muted" />
                            </div>
                            <h3 className="font-heading club-ink font-bold text-2xl mb-2">No topics found</h3>
                            <p className="font-heading club-muted">We couldn't find any topics matching "{searchQuery}"</p>
                            <div className="flex gap-4 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setSearchQuery("")}
                                    className="club-action club-border club-ink club-well"
                                >
                                    Clear search
                                </Button>
                                <Button
                                    onClick={() => onStartGame(selectedGrade, selectedSubject.name, "solo")}
                                    className="club-action club-surface border-none club-ink hover:opacity-90"
                                >
                                    Play General {selectedSubject.name} Game
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Join Game Modal - Enhanced */}
            {showJoinModal && (
                <div className="fixed inset-0 club-overlay flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-md club-well club-border scale-100 animate-in zoom-in-95 duration-300">
                        <CardHeader className="font-heading text-center pb-2">
                            <div className="w-20 h-20 club-surface rounded-xl mx-auto flex items-center justify-center mb-6 rotate-3">
                                <UsersIcon className="w-10 h-10 club-ink" />
                            </div>
                            <CardTitle className="font-heading text-3xl font-black club-ink">
                                Join a Game
                            </CardTitle>
                            <p className="font-heading club-muted">Enter the 6-digit PIN to join the lobby</p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 club-surface rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                <Input
                                    placeholder="000 000"
                                    value={gamePin}
                                    onChange={(e) => setGamePin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="relative club-well club-border club-ink text-center text-4xl font-mono tracking-wide h-20 rounded-xl focus:ring-2 transition-all placeholder:text-white/10"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={() => setShowJoinModal(false)}
                                    className="club-action h-12 club-well club-well club-ink rounded-xl font-bold border club-border"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (gamePin.length === 6) {
                                            onJoinGame(gamePin)
                                            setShowJoinModal(false)
                                        }
                                    }}
                                    disabled={gamePin.length !== 6}
                                    className="club-action h-12 club-blue club-blue club-ink font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                                >
                                    Join Lobby
                                    <ChevronRightIcon className="w-5 h-5 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
