import { supabase } from "@/lib/supabase"

// Types based on the database schema
export interface Query {
  id: string
  query_text: string
  structured_query?: any
  created_at: string
}

export interface Report {
  id: string
  query_id: string
  text_report: string
  report_data?: any
  created_at: string
}

export interface Image {
  id: string
  file_name: string
  file_url: string
  file_format: string
  metadata?: any
  created_at: string
}

export interface ReportImage {
  id: string
  report_id: string
  image_id: string
  created_at: string
}

// Function to store a query
export async function storeQuery(queryText: string, structuredQuery?: any): Promise<Query | null> {
  try {
    const { data, error } = await supabase
      .from("queries")
      .insert([
        {
          query_text: queryText,
          structured_query: structuredQuery || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error storing query:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in storeQuery:", error)
    return null
  }
}

// Function to store a report
export async function storeReport(queryId: string, textReport: string, reportData?: any): Promise<Report | null> {
  try {
    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          query_id: queryId,
          text_report: textReport,
          report_data: reportData || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error storing report:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in storeReport:", error)
    return null
  }
}

// Function to store image metadata
export async function storeImage(
  fileUrl: string,
  fileName?: string,
  fileFormat?: string,
  metadata?: any,
): Promise<Image | null> {
  try {
    const { data, error } = await supabase
      .from("images")
      .insert([
        {
          file_url: fileUrl,
          file_name: fileName || null,
          file_format: fileFormat || null,
          metadata: metadata || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error storing image metadata:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in storeImage:", error)
    return null
  }
}

// Function to link a report to an image
export async function linkReportToImage(reportId: string, imageId: string): Promise<ReportImage | null> {
  try {
    const { data, error } = await supabase
      .from("report_images")
      .insert([
        {
          report_id: reportId,
          image_id: imageId,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error linking report to image:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in linkReportToImage:", error)
    return null
  }
}

// Function to get a report by ID with its associated images
export async function getReportWithImages(reportId: string): Promise<{ report: Report; images: Image[] } | null> {
  try {
    // Get the report
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single()

    if (reportError) {
      console.error("Error fetching report:", reportError)
      return null
    }

    // Get the associated images
    const { data: reportImagesData, error: reportImagesError } = await supabase
      .from("report_images")
      .select("image_id")
      .eq("report_id", reportId)

    if (reportImagesError) {
      console.error("Error fetching report images:", reportImagesError)
      return null
    }

    if (reportImagesData.length === 0) {
      return { report: reportData, images: [] }
    }

    const imageIds = reportImagesData.map((ri) => ri.image_id)

    const { data: imagesData, error: imagesError } = await supabase.from("images").select("*").in("id", imageIds)

    if (imagesError) {
      console.error("Error fetching images:", imagesError)
      return null
    }

    return { report: reportData, images: imagesData }
  } catch (error) {
    console.error("Error in getReportWithImages:", error)
    return null
  }
}

// Function to generate a report from a text query
export async function generateReportFromQuery(queryText: string): Promise<{ report: Report; images: Image[] } | null> {
  try {
    // 1. Store the query
    const query = await storeQuery(queryText)
    if (!query) {
      throw new Error("Failed to store query")
    }

    // 2. In a real implementation, this would call an AI service or backend
    // For now, we'll simulate a report generation with mock data
    const mockReportText = `Analysis based on query: "${queryText}"\n\nThis analysis identified 3 vessels in the retrieved satellite images. The vessels include cargo ships, tankers, and fishing vessels operating in the monitored area.`

    const mockReportData = {
      title: `Query Results: ${queryText}`,
      summary: `Analysis based on your query: "${queryText}"`,
      vesselCount: 3,
      vesselTypes: [
        { type: "Cargo Ship", count: 1 },
        { type: "Tanker", count: 1 },
        { type: "Fishing Vessel", count: 1 },
      ],
      additionalInfo: {
        "Image Date": "2025-03-20",
        "Image Resolution": "1.5m",
        "Coverage Area": "25 sq km",
        "Weather Conditions": "Clear",
        "Analysis Confidence": "92%",
      },
    }

    // 3. Store the report
    const report = await storeReport(query.id, mockReportText, mockReportData)
    if (!report) {
      throw new Error("Failed to store report")
    }

    // 4. For demo purposes, we'll use a placeholder image
    // In a real implementation, this would retrieve relevant images from the database
    const mockImage = await storeImage("/placeholder.svg?height=800&width=1200", "query-result.png", "png", {
      location: "Sample Location",
      date: "2025-03-20",
      resolution: "1.5m",
    })

    if (!mockImage) {
      throw new Error("Failed to store image metadata")
    }

    // 5. Link the report to the image
    const reportImage = await linkReportToImage(report.id, mockImage.id)
    if (!reportImage) {
      throw new Error("Failed to link report to image")
    }

    return { report, images: [mockImage] }
  } catch (error) {
    console.error("Error in generateReportFromQuery:", error)
    return null
  }
}

// Function to generate a report from uploaded images
export async function generateReportFromImages(
  images: { url: string; fileName: string; fileFormat?: string }[],
): Promise<{ report: Report; images: Image[] } | null> {
  try {
    // 1. Store a generic query for image uploads
    const queryText = `Analysis of ${images.length} uploaded image${images.length > 1 ? "s" : ""}`
    const query = await storeQuery(queryText)
    if (!query) {
      throw new Error("Failed to store query")
    }

    // 2. In a real implementation, this would call an AI service or backend
    // For now, we'll simulate a report generation with mock data
    const mockReportText = `Analysis of uploaded images\n\nThis analysis identified 3 vessels in the uploaded images. The vessels include cargo ships, tankers, and fishing vessels.`

    const mockReportData = {
      title: "Analysis of Uploaded Images",
      summary: "This analysis identified vessels in the uploaded images.",
      vesselCount: 3,
      vesselTypes: [
        { type: "Cargo Ship", count: 1 },
        { type: "Tanker", count: 1 },
        { type: "Fishing Vessel", count: 1 },
      ],
      additionalInfo: {
        "Image Count": images.length,
        "Analysis Date": new Date().toISOString().split("T")[0],
        "Analysis Confidence": "90%",
      },
    }

    // 3. Store the report
    const report = await storeReport(query.id, mockReportText, mockReportData)
    if (!report) {
      throw new Error("Failed to store report")
    }

    // 4. Store each image and link to the report
    const storedImages: Image[] = []

    for (const image of images) {
      const storedImage = await storeImage(image.url, image.fileName, image.fileFormat, {
        uploadDate: new Date().toISOString(),
        source: "user-upload",
      })

      if (!storedImage) {
        console.error(`Failed to store image metadata for ${image.fileName}`)
        continue
      }

      // Link the report to the image
      const reportImage = await linkReportToImage(report.id, storedImage.id)
      if (!reportImage) {
        console.error(`Failed to link report to image ${storedImage.id}`)
        continue
      }

      storedImages.push(storedImage)
    }

    if (storedImages.length === 0) {
      throw new Error("Failed to store any image metadata")
    }

    return { report, images: storedImages }
  } catch (error) {
    console.error("Error in generateReportFromImages:", error)
    return null
  }
}

