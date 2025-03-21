"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileType, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  onUpload: (file: File) => void
  isUploading: boolean
}

export function ImageUpload({ onUpload, isUploading }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      onUpload(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      onUpload(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div
      className={`upload-area flex flex-col items-center justify-center p-8 ${
        dragActive ? "border-skyfi-blue bg-skyfi-blue/5" : ""
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        accept=".tif,.tiff,.jpg,.jpeg,.png,.hdf"
        disabled={isUploading}
      />

      <Upload className="h-12 w-12 text-muted-foreground mb-4" />

      <h3 className="text-xl md:text-2xl font-semibold mb-2">Upload Satellite Image</h3>

      {selectedFile && isUploading ? (
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Preparing "{selectedFile.name}" for analysis...
        </p>
      ) : (
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Drag and drop your file here, or click to browse
        </p>
      )}

      <div className="flex items-center justify-center gap-2 mb-4">
        <FileType className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Supported formats: GeoTIFF, JPEG/JPG, HDF, PNG</span>
      </div>

      <Button
        onClick={handleButtonClick}
        disabled={isUploading}
        className="bg-skyfi-blue text-white hover:bg-skyfi-blue/90 px-6 py-2 rounded-sm"
      >
        {isUploading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
            Processing...
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4 mr-2" />
            Select File
          </>
        )}
      </Button>

      {selectedFile && isUploading && (
        <p className="text-xs text-muted-foreground mt-4">
          Large files will be available immediately while uploading in the background
        </p>
      )}
    </div>
  )
}

