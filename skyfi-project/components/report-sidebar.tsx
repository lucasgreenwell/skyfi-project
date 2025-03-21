"use client"

import { Download, Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ToastSimple } from "@/components/ui/toast-simple"

interface ReportData {
  title: string
  summary: string
  vesselCount: number
  vesselTypes: {
    type: string
    count: number
  }[]
  additionalInfo: {
    [key: string]: string | number
  }
}

interface ReportSidebarProps {
  report: ReportData
}

export function ReportSidebar({ report }: ReportSidebarProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleCopyReport = () => {
    const reportText = `
    ${report.title}
    
    Summary: ${report.summary}
    
    Vessel Count: ${report.vesselCount}
    
    Vessel Types:
    ${report.vesselTypes.map((v) => `- ${v.type}: ${v.count}`).join("\n")}
    
    Additional Information:
    ${Object.entries(report.additionalInfo)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n")}
  `.trim()

    navigator.clipboard.writeText(reportText)

    // Show toast notification
    setShowToast(true)

    // Show check icon temporarily
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownloadReport = () => {
    const reportText = `
    ${report.title}
    
    Summary: ${report.summary}
    
    Vessel Count: ${report.vesselCount}
    
    Vessel Types:
    ${report.vesselTypes.map((v) => `- ${v.type}: ${v.count}`).join("\n")}
    
    Additional Information:
    ${Object.entries(report.additionalInfo)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n")}
  `.trim()

    const blob = new Blob([reportText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "vessel-analysis-report.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-skyfi-dark">
        <h2 className="text-lg font-semibold">Analysis Report</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={handleCopyReport}>
              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy Report</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDownloadReport}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Download Report</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-xl md:text-2xl font-semibold mb-4">{report.title}</h3>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">SUMMARY</h4>
          <p>{report.summary}</p>
        </div>

        <Separator className="my-4" />

        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">VESSEL COUNT</h4>
          <p className="text-2xl font-bold text-skyfi-blue">{report.vesselCount}</p>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">VESSEL TYPES</h4>
          <div className="space-y-2">
            {report.vesselTypes.map((vessel, index) => (
              <div key={index} className="flex justify-between">
                <span>{vessel.type}</span>
                <span className="font-medium">{vessel.count}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">ADDITIONAL INFORMATION</h4>
          <div className="space-y-2">
            {Object.entries(report.additionalInfo).map(([key, value], index) => (
              <div key={index} className="grid grid-cols-2">
                <span className="text-muted-foreground">{key}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ToastSimple message="Report copied to clipboard" visible={showToast} onClose={() => setShowToast(false)} />
    </div>
  )
}

