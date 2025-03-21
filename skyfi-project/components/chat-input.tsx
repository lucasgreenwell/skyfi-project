"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatInputProps {
  onSubmit: (query: string) => void
  isProcessing: boolean
  className?: string
}

export function ChatInput({ onSubmit, isProcessing, className = "" }: ChatInputProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isProcessing) {
      onSubmit(query)
      setQuery("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a question about vessels..."
        className="pr-12 border-skyfi-gray/30 focus-visible:ring-skyfi-blue"
        disabled={isProcessing}
      />
      <Button
        type="submit"
        size="icon"
        className="absolute right-1 top-1 h-8 w-8 bg-skyfi-blue hover:bg-skyfi-blue/90"
        disabled={isProcessing || !query.trim()}
      >
        {isProcessing ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        <span className="sr-only">Send</span>
      </Button>
    </form>
  )
}

