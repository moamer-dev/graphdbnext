'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Sparkles, Send, Bot, User, Loader2, AlertCircle, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    cypher?: string
}

interface ChatAgentProps {
    onVisualize?: (cypher: string) => void
}

export function ChatAgent({ onVisualize }: ChatAgentProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, loading])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/chat/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMessage.content })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response')
            }

            const agentMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.result,
                timestamp: new Date(),
                cypher: data.cypher
            }

            setMessages(prev => [...prev, agentMessage])
        } catch (err: any) {
            console.error('Chat Error:', err)
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-muted/5">
            <div className="space-y-2 p-4 pb-2">
                <Label className="text-xs font-semibold flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    AI Query Assistant
                </Label>
                <p className="text-xs text-muted-foreground/70">
                    Ask questions about your data in natural language.
                </p>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-10 px-4 text-muted-foreground/50 text-xs">
                            <Bot className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p>No messages yet.</p>
                            <p className="mt-1">Try asking: "How many nodes are there?"</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-3 text-sm mb-4",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
                            )}>
                                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div className={cn(
                                "rounded-lg p-3 max-w-[85%]",
                                msg.role === 'user'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border border-border shadow-sm"
                            )}>
                                <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{msg.content}</p>
                                {msg.role === 'assistant' && msg.cypher && onVisualize && (
                                    <div className="mt-3 pt-2 border-t border-border/50">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs gap-1.5"
                                            onClick={() => onVisualize(msg.cypher!)}
                                        >
                                            <Play className="h-3 w-3" />
                                            Visualize Results
                                        </Button>
                                    </div>
                                )}
                                <span className="text-[10px] opacity-70 mt-1 block">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-background border border-border rounded-lg p-3 shadow-sm">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Thinking...
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 text-xs text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="p-4 pt-2 border-t border-border/30 bg-background/50 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        className="text-xs h-9"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        className="h-9 w-9 p-0 shrink-0"
                        disabled={loading || !input.trim()}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    )
}
