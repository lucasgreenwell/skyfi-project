"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ZoomIn, ZoomOut, RotateCw, Maximize, Ship, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Vessel {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: string
  metadata: {
    [key: string]: string | number
  }
}

interface ImageViewerProps {
  imageUrl: string
  vessels: Vessel[]
  isUploading?: boolean
}

export function ImageViewer({ imageUrl, vessels, isUploading = false }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setSelectedVessel(null)
  }

  // Reset selected vessel when image changes
  useEffect(() => {
    setSelectedVessel(null)
    setZoom(1)
    setRotation(0)
  }, [imageUrl])

  return (
    <div className="relative flex flex-col h-full">
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        {isUploading && (
          <div className="mr-2 bg-background/80 rounded-md px-2 py-1 flex items-center text-xs">
            <Upload className="h-3 w-3 mr-1 animate-pulse text-skyfi-blue" />
            Uploading...
          </div>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Zoom In</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Zoom Out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
                <span className="sr-only">Rotate</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rotate</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleReset}>
                <Maximize className="h-4 w-4" />
                <span className="sr-only">Reset</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          className="relative h-full w-full"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: "transform 0.3s ease",
          }}
        >
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt="Satellite image"
            fill
            className="object-contain"
            key={imageUrl} // Add key to force re-render when image changes
          />

          {vessels.map((vessel) => (
            <TooltipProvider key={vessel.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="vessel-annotation"
                    style={{
                      left: `${vessel.x}%`,
                      top: `${vessel.y}%`,
                      width: `${vessel.width}%`,
                      height: `${vessel.height}%`,
                    }}
                    onClick={() => setSelectedVessel(vessel)}
                  >
                    <Ship className="h-4 w-4 text-skyfi-blue absolute -top-5 -left-1" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p className="font-bold">{vessel.type}</p>
                    <p className="text-xs">Click for details</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {selectedVessel && (
        <div className="absolute bottom-4 left-4 bg-background/90 p-4 rounded-lg border shadow-lg max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">{selectedVessel.type}</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedVessel(null)}>
              ×
            </Button>
          </div>
          <div className="space-y-1">
            {Object.entries(selectedVessel.metadata).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 text-sm">
                <span className="text-muted-foreground">{key}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

