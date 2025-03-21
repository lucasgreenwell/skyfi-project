import { type NextRequest, NextResponse } from "next/server"
import { generateReportFromQuery, generateReportFromImages } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a query-based or image-based report generation
    if (body.query) {
      // Generate report from query
      const result = await generateReportFromQuery(body.query)

      if (!result) {
        return NextResponse.json({ error: "Failed to generate report from query" }, { status: 500 })
      }

      return NextResponse.json(result)
    } else if (body.images && Array.isArray(body.images)) {
      // Generate report from images
      const result = await generateReportFromImages(body.images)

      if (!result) {
        return NextResponse.json({ error: "Failed to generate report from images" }, { status: 500 })
      }

      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: "Invalid request. Must provide either query or images." }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in generate-report API route:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

