"use client"

import { useState } from "react"
import type { Report, Image as DBImage } from "@/lib/database"

interface UseReportGenerationProps {
  onSuccess?: (result: { report: Report; images: DBImage[] }) => void
  onError?: (error: Error) => void
}

export function useReportGeneration({ onSuccess, onError }: UseReportGenerationProps = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generateFromQuery = async (query: string) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate report from query")
      }

      const result = await response.json()

      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)

      if (onError) {
        onError(error)
      }

      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  const generateFromImages = async (images: { url: string; fileName: string; fileFormat?: string }[]) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate report from images")
      }

      const result = await response.json()

      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)

      if (onError) {
        onError(error)
      }

      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    error,
    generateFromQuery,
    generateFromImages,
  }
}

