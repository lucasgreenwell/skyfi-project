"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { Header } from "@/components/header"
import { ChatInput } from "@/components/chat-input"
import { ImageUpload } from "@/components/image-upload"
import { ImageViewer } from "@/components/image-viewer"
import { ReportSidebar } from "@/components/report-sidebar"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { ToastSimple } from "@/components/ui/toast-simple"
import { generateReportFromQuery, generateReportFromImages, type Report } from "@/lib/database"

// Mock data for demonstration
const mockVessels = [
  {
    id: "1",
    x: 25,
    y: 30,
    width: 5,
    height: 2,
    type: "Cargo Ship",
    metadata: {
      Length: "320m",
      Width: "45m",
      Speed: "12 knots",
      Direction: "North-East",
      "Estimated Capacity": "10,000 TEU",
    },
  },
  {
    id: "2",
    x: 60,
    y: 45,
    width: 3,
    height: 1.5,
    type: "Tanker",
    metadata: {
      Length: "250m",
      Width: "40m",
      Speed: "8 knots",
      Direction: "South",
      "Cargo Type": "Oil",
    },
  },
  {
    id: "3",
    x: 40,
    y: 70,
    width: 2,
    height: 1,
    type: "Fishing Vessel",
    metadata: {
      Length: "35m",
      Width: "10m",
      Speed: "5 knots",
      Direction: "West",
      Activity: "Active fishing",
    },
  },
]

const mockReport = {
  title: "Vessel Analysis Report",
  summary:
    "This analysis identified 3 vessels in the provided satellite image. The vessels include cargo ships, tankers, and fishing vessels operating in the monitored area.",
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

interface ImageData {
  id: string
  url: string
  fileName: string
  isUploading: boolean
  uploadSuccess?: boolean
  uploadError?: string
  uploadInProgress?: boolean
  file?: File
  vessels: typeof mockVessels
  report: typeof mockReport
  dbId?: string // Database ID for the image
}

// Function to upload image to Supabase
async function uploadImageToSupabase(file: File) {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${fileName}`

    const { data, error } = await supabase.storage.from("uploaded-images").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Supabase upload error:", error.message)
      throw error
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage.from("uploaded-images").getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

// Store file objects by ID for background uploads
const pendingUploads = new Map<string, File>()

export default function Home() {
  const [showResults, setShowResults] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [images, setImages] = useState<ImageData[]>([])
  const [currentReport, setCurrentReport] = useState<Report | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<{
    visible: boolean
    message: string
    type: "success" | "error"
  }>({
    visible: false,
    message: "",
    type: "success",
  })

  // Initialize with a placeholder image when needed
  const placeholderImage = {
    id: "placeholder",
    fileName: "placeholder.svg",
    url: "/placeholder.svg?height=800&width=1200",
    isUploading: false,
    vessels: mockVessels,
    report: mockReport,
  }

  // Get the current image or use placeholder if no images
  const currentImage = images.length > 0 ? images[currentImageIndex] : placeholderImage

  // Show toast notification
  const showToast = (message: string, type: "success" | "error") => {
    setToast({
      visible: true,
      message,
      type,
    })

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 3000)
  }

  // Handle background uploads
  useEffect(() => {
    // Find any images that are pending upload (isUploading === true but uploadInProgress !== true)
    const pendingImages = images.filter(
      (img) =>
        img.isUploading && !img.uploadInProgress && img.uploadSuccess === undefined && img.uploadError === undefined,
    )

    // Process each pending image
    pendingImages.forEach(async (image) => {
      // Get the corresponding file from our Map or from the input ref
      const file =
        pendingUploads.get(image.id) ||
        (fileInputRef.current?.files?.[0]?.name === image.fileName ? fileInputRef.current.files[0] : undefined)

      if (!file) {
        console.error(`No file found for upload: ${image.fileName}`)

        // Mark as error since we can't find the file
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  isUploading: false,
                  uploadSuccess: false,
                  uploadError: "File not found for upload",
                }
              : img,
          ),
        )
        return
      }

      // Mark this image as being processed to prevent duplicate uploads
      setImages((prev) => prev.map((img) => (img.id === image.id ? { ...img, uploadInProgress: true } : img)))

      try {
        // Try to upload to Supabase in the background
        const publicUrl = await uploadImageToSupabase(file)

        // Update the image with the new URL and success status
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  isUploading: false,
                  uploadInProgress: false,
                  uploadSuccess: true,
                  url: publicUrl || img.url, // Keep the local URL if upload failed
                }
              : img,
          ),
        )

        // Clean up the pending upload
        pendingUploads.delete(image.id)

        showToast(`Successfully uploaded ${image.fileName}`, "success")
      } catch (error) {
        console.error("Background upload error:", error)

        // Mark the upload as failed but keep the local URL
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  isUploading: false,
                  uploadInProgress: false,
                  uploadSuccess: false,
                  uploadError: error instanceof Error ? error.message : "Upload failed",
                }
              : img,
          ),
        )

        // Clean up the pending upload
        pendingUploads.delete(image.id)

        showToast(`Failed to upload ${image.fileName}. Using local version instead.`, "error")
      }
    })
  }, [images])

  const handleChatSubmit = async (query: string) => {
    setIsProcessing(true)

    try {
      // Generate a report from the query
      const result = await generateReportFromQuery(query)

      if (!result) {
        throw new Error("Failed to generate report from query")
      }

      const { report, images: dbImages } = result

      // Convert DB images to our ImageData format
      const newImages = dbImages.map((dbImage) => ({
        id: uuidv4(),
        url: dbImage.file_url,
        fileName: dbImage.file_name,
        isUploading: false,
        vessels: mockVessels, // In a real app, this would come from the analysis
        report: report.report_data || mockReport,
        dbId: dbImage.id,
      }))

      // Update state with the new images and report
      setImages(newImages)
      setCurrentReport(report)
      setShowResults(true)
      setCurrentImageIndex(0)

      showToast("Report generated successfully", "success")
    } catch (error) {
      console.error("Error generating report from query:", error)
      showToast(`Error generating report: ${error instanceof Error ? error.message : "Unknown error"}`, "error")

      // Fallback to mock data for demo purposes
      setImages([
        {
          id: uuidv4(),
          fileName: "query-result.png",
          url: "/placeholder.svg?height=800&width=1200",
          isUploading: false,
          vessels: mockVessels,
          report: {
            ...mockReport,
            title: `Query Results: ${query}`,
            summary: `Analysis based on your query: "${query}"`,
          },
        },
      ])
      setShowResults(true)
      // Don't set currentReport for the fallback case to ensure the user sees the generate button
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)

    try {
      // Immediately create a local object URL for instant display
      const localObjectUrl = URL.createObjectURL(file)
      const imageId = uuidv4()

      // Store the file in our Map for later upload
      pendingUploads.set(imageId, file)

      // Create a new image with the local URL and mark it as uploading
      const newImage = {
        id: imageId,
        fileName: file.name,
        url: localObjectUrl,
        isUploading: true, // Mark as uploading
        vessels: mockVessels, // In a real app, this would be the result of analysis
        report: {
          ...mockReport,
          title: `Analysis of ${file.name}`,
          summary: `This analysis identified vessels in the uploaded image "${file.name}".`,
        },
      }

      // Reset the current report when uploading a new image
      setCurrentReport(null)

      // Add the new image to our collection and show it immediately
      setImages((prev) => [...prev, newImage])
      setCurrentImageIndex(images.length) // Set to the new image
      setShowResults(true)

      // The actual upload happens in the background via the useEffect
    } catch (error) {
      console.error("Error handling image upload:", error)
      showToast(`Error preparing image: ${error instanceof Error ? error.message : "Unknown error"}`, "error")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAdditionalImageUpload = async (file: File) => {
    try {
      // Immediately create a local object URL for instant display
      const localObjectUrl = URL.createObjectURL(file)
      const imageId = uuidv4()

      // Store the file in our Map for later upload
      pendingUploads.set(imageId, file)

      // Create a new image with the local URL and mark it as uploading
      const newImage = {
        id: imageId,
        fileName: file.name,
        url: localObjectUrl,
        isUploading: true, // Mark as uploading
        vessels: mockVessels, // In a real app, this would be the result of analysis
        report: {
          ...mockReport,
          title: `Analysis of ${file.name}`,
          summary: `This analysis identified vessels in the uploaded image "${file.name}".`,
        },
      }

      // Reset the current report when uploading a new image
      setCurrentReport(null)

      // Add the new image to our collection and show it immediately
      setImages((prev) => [...prev, newImage])
      setCurrentImageIndex(images.length) // Set to the new image

      // The actual upload happens in the background via the useEffect
    } catch (error) {
      console.error("Error handling additional image upload:", error)
      showToast(`Error preparing image: ${error instanceof Error ? error.message : "Unknown error"}`, "error")
    }
  }

  const handleGenerateReport = async () => {
    if (images.length === 0) {
      showToast("No images available to generate a report", "error")
      return
    }

    setIsGeneratingReport(true)

    try {
      // Filter out images that are still uploading
      const readyImages = images.filter((img) => !img.isUploading)

      if (readyImages.length === 0) {
        showToast("Please wait for images to finish uploading", "error")
        return
      }

      // Prepare image data for the database
      const imageData = readyImages.map((img) => ({
        url: img.url,
        fileName: img.fileName,
        fileFormat: img.fileName.split(".").pop() || "unknown",
      }))

      // Generate a report from the uploaded images
      const result = await generateReportFromImages(imageData)

      if (!result) {
        throw new Error("Failed to generate report from images")
      }

      const { report, images: dbImages } = result

      // Update the current report
      setCurrentReport(report)

      // Update the images with database IDs and the report data
      setImages((prev) =>
        prev.map((img) => {
          const matchingDbImage = dbImages.find((dbImg) => dbImg.file_url === img.url)
          return matchingDbImage
            ? {
                ...img,
                dbId: matchingDbImage.id,
                report: report.report_data || img.report, // Update with the new report data
              }
            : img
        }),
      )

      showToast("Report generated successfully", "success")
    } catch (error) {
      console.error("Error generating report from images:", error)
      showToast(`Error generating report: ${error instanceof Error ? error.message : "Unknown error"}`, "error")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAdditionalImageUpload(e.target.files[0])
      // We'll access the file later via fileInputRef for uploading
    }
  }

  const goToPreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const goToNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  // Determine if we should show the generate report button
  const showGenerateButton =
    showResults &&
    images.length > 0 &&
    !currentReport &&
    !isGeneratingReport &&
    images.some((img) => img.uploadSuccess || !img.isUploading)

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {!showResults ? (
          <div className="flex flex-col md:flex-row w-full">
            <div className="w-full md:w-1/2 p-6 flex flex-col">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">Ask about vessels</h2>
              <p className="text-muted-foreground mb-6">
                Type a natural language query to search our satellite image database for vessel information.
              </p>
              <ChatInput onSubmit={handleChatSubmit} isProcessing={isProcessing} className="mb-6" />
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">Example queries:</p>
                  <ul className="text-sm text-muted-foreground mt-2">
                    <li>"Show me cargo ships near Singapore"</li>
                    <li>"Find fishing vessels in the Mediterranean"</li>
                    <li>"Identify tankers in the Gulf of Mexico"</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 p-6 border-t md:border-t-0 md:border-l">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">Upload satellite image</h2>
              <p className="text-muted-foreground mb-6">
                Upload your own satellite imagery for vessel detection and analysis.
              </p>
              <ImageUpload onUpload={handleImageUpload} isUploading={isUploading} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 relative">
              {/* Image navigation controls */}
              {images.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center bg-background/80 rounded-lg border shadow-sm px-2 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPreviousImage}
                    disabled={currentImageIndex === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous Image</span>
                  </Button>

                  <span className="mx-2 text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextImage}
                    disabled={currentImageIndex === images.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next Image</span>
                  </Button>
                </div>
              )}

              {/* Upload status indicator */}
              {currentImage.isUploading && (
                <div className="absolute top-4 right-4 z-10 bg-background/80 rounded-lg border shadow-sm px-3 py-1 text-sm flex items-center">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-skyfi-blue border-t-transparent mr-2" />
                  Uploading in background...
                </div>
              )}

              <div className="absolute inset-0">
                <ImageViewer
                  imageUrl={currentImage.url}
                  vessels={currentImage.vessels}
                  isUploading={currentImage.isUploading}
                />
              </div>
            </div>

            <div className="w-full md:w-96 border-t md:border-t-0 md:border-l">
              {currentReport ? (
                <ReportSidebar report={currentImage.report} />
              ) : (
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b bg-skyfi-dark">
                    <h2 className="text-lg font-semibold">Analysis Tools</h2>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold">Generate Analysis Report</h3>
                      <p className="text-muted-foreground">
                        Click the button below to analyze the image and generate a detailed vessel report.
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateReport}
                      disabled={isGeneratingReport || images.some((img) => img.isUploading)}
                      className="bg-skyfi-blue text-white hover:bg-skyfi-blue/90 px-6 py-2 rounded-sm w-full max-w-xs"
                    >
                      {isGeneratingReport ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {showResults && (
        <div className="border-t p-4 flex items-center justify-center gap-4">
          <ChatInput onSubmit={handleChatSubmit} isProcessing={isProcessing} className="max-w-2xl w-full" />

          {/* Upload button moved next to chat bar */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".tif,.tiff,.jpg,.jpeg,.png,.hdf"
              disabled={isUploading}
            />
            <Button
              onClick={triggerFileInput}
              disabled={isUploading}
              className="bg-skyfi-blue text-white hover:bg-skyfi-blue/90 h-10 px-6 py-2 rounded-sm"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Image
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Toast notification for upload status */}
      <ToastSimple
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        type={toast.type}
      />
    </div>
  )
}

