"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { DesignPanel } from "@/components/design-panel"
import { useMobile } from "@/hooks/use-mobile"
import { loadGif, getBrightnessAt, updateFrame, type ImageData } from "@/utils/image-processor"
import { WelcomePopupProvider, useWelcomePopup } from "@/components/welcome-popup"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { ZoomOut, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const DEFAULT_DENSITY = " :・.=*+-<>¦｜ﾘﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍZç0123456789$"
const MIN_SCALE = 0.5
const DEFAULT_SCALE = 3.0
const MAX_SCALE = 3.0
const NEO_GIF_URL =
  "https://yyksvv7hmzwys6ev.public.blob.vercel-storage.com/Canadian%2090S%20GIF-1gtB6pgqybECygmolyCuW6X7kaKoat.gif"
const BULLET_TIME_GIF_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sci-fi%20GIF-tET8d7aAKbbeJkQCgv80X5qHs7YUaY.gif"
const MORPHEUS_GIF_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/keanu%20reeves%20film%20GIF-dIVbUeIiTaFrf6SdgPSU4HlRNGd0Xc.gif"

// Mode names
const MODE_NAMES = ["Neo", "Bullet Time", "Morpheus"]

interface Context {
  time: number
  cols: number
  rows: number
  metrics: {
    aspect: number
  }
  frameTime: number
}

interface DesignParams {
  mode: number
  characterSet: string
  backgroundColor: string
  scale: number
  characterColor: string
  characterSpacing: number
}

// Help button component that can be used in both mobile and desktop views
function HelpButton() {
  const { openPopup } = useWelcomePopup()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={openPopup}
      className="h-8 w-8 bg-background border-green-500 text-green-500 hover:bg-green-500/10"
      title="Help"
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  )
}

function DesignToolContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const scaleAnimationRef = useRef<number | null>(null)
  const [canvasSize, setCanvasSize] = useState(0)
  const isMobile = useMobile()
  const neoImageRef = useRef<ImageData | null>(null)
  const bulletTimeImageRef = useRef<ImageData | null>(null)
  const morpheusImageRef = useRef<ImageData | null>(null)

  // New state to track if user has entered the matrix
  const [hasEnteredMatrix, setHasEnteredMatrix] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  // Get access to the welcome popup context
  const { setEnterMatrixHandler } = useWelcomePopup()

  const designParamsRef = useRef<DesignParams>({
    mode: 0, // Default to Neo mode
    characterSet: DEFAULT_DENSITY,
    backgroundColor: "#000000",
    scale: DEFAULT_SCALE, // Start at max scale
    characterColor: "#00FF00",
    characterSpacing: 0.8,
  })

  const [, forceUpdate] = useState({})
  const [canvasOpacity, setCanvasOpacity] = useState(1)

  // Calculate opacity based on scale
  useEffect(() => {
    const scale = designParamsRef.current.scale
    const threshold = MIN_SCALE + 0.1 // Add a small buffer for transition

    if (scale <= MIN_SCALE) {
      setCanvasOpacity(0) // Fully transparent at minimum scale
    } else if (scale < threshold) {
      // Smooth transition between MIN_SCALE and threshold
      const normalizedScale = (scale - MIN_SCALE) / (threshold - MIN_SCALE)
      setCanvasOpacity(normalizedScale)
    } else {
      setCanvasOpacity(1) // Fully opaque above threshold
    }
  }, [designParamsRef.current.scale])

  // Load the GIFs
  useEffect(() => {
    async function loadNeoGif() {
      try {
        const imageData = await loadGif(NEO_GIF_URL)
        neoImageRef.current = imageData
        console.log(`Loaded Neo GIF with ${imageData.frameCount} frames`)
      } catch (error) {
        console.error("Failed to load Neo GIF:", error)
      }
    }

    async function loadBulletTimeGif() {
      try {
        const imageData = await loadGif(BULLET_TIME_GIF_URL)
        bulletTimeImageRef.current = imageData
        console.log(`Loaded Bullet Time GIF with ${imageData.frameCount} frames`)
      } catch (error) {
        console.error("Failed to load Bullet Time GIF:", error)
      }
    }

    async function loadMorpheusGif() {
      try {
        const imageData = await loadGif(MORPHEUS_GIF_URL)
        morpheusImageRef.current = imageData
        console.log(`Loaded Morpheus GIF with ${imageData.frameCount} frames`)
      } catch (error) {
        console.error("Failed to load Morpheus GIF:", error)
      }
    }

    loadNeoGif()
    loadBulletTimeGif()
    loadMorpheusGif()

    return () => {
      neoImageRef.current = null
      bulletTimeImageRef.current = null
      morpheusImageRef.current = null
    }
  }, [])

  // Calculate canvas size based on container and screen size
  useEffect(() => {
    const calculateCanvasSize = () => {
      if (!canvasContainerRef.current) return

      // Get the container dimensions
      const containerWidth = canvasContainerRef.current.clientWidth

      // For mobile, use a percentage of the viewport height to ensure it fits
      if (isMobile) {
        const viewportHeight = window.innerHeight
        // Use 50% of viewport height on mobile, but not more than container width
        const maxSize = Math.min(containerWidth, viewportHeight * 0.5)
        setCanvasSize(maxSize)
      } else {
        // On desktop, use container width but cap at a reasonable size
        const maxSize = Math.min(containerWidth, 600)
        setCanvasSize(maxSize)
      }
    }

    // Calculate initially
    calculateCanvasSize()

    // Recalculate on resize
    const handleResize = () => {
      calculateCanvasSize()
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isMobile])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasSize === 0) return

    canvas.style.cursor = "pointer"
    contextRef.current = canvas.getContext("2d", { alpha: false })
    startTimeRef.current = performance.now()

    const initCanvas = () => {
      const dpr = window.devicePixelRatio || 1

      // Set the canvas size to our calculated size multiplied by the device pixel ratio
      canvas.width = canvasSize * dpr
      canvas.height = canvasSize * dpr

      // Set the display size to our calculated size
      canvas.style.width = `${canvasSize}px`
      canvas.style.height = `${canvasSize}px`
    }

    initCanvas()
    return () => {
      cancelAnimationFrame(frameRef.current)
      if (scaleAnimationRef.current) {
        cancelAnimationFrame(scaleAnimationRef.current)
      }
    }
  }, [canvasSize])

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = contextRef.current
    if (!canvas || !ctx || canvasSize === 0) return

    const render = () => {
      const { backgroundColor, scale, characterSpacing } = designParamsRef.current
      const time = performance.now()
      const elapsedTime = (time - startTimeRef.current) * 0.1
      const cols = canvas.width
      const rows = canvas.height
      const m = Math.min(cols, rows)
      const dpr = window.devicePixelRatio || 1

      // Update GIF frames if needed
      if (neoImageRef.current && neoImageRef.current.isLoaded) {
        updateFrame(neoImageRef.current, time)
      }
      if (bulletTimeImageRef.current && bulletTimeImageRef.current.isLoaded) {
        updateFrame(bulletTimeImageRef.current, time)
      }
      if (morpheusImageRef.current && morpheusImageRef.current.isLoaded) {
        updateFrame(morpheusImageRef.current, time)
      }

      const context: Context = {
        time: elapsedTime,
        cols,
        rows,
        metrics: {
          aspect: canvas.width / canvas.height,
        },
        frameTime: time,
      }

      // Set background color
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, cols, rows)

      // Set text rendering properties
      ctx.fillStyle = designParamsRef.current.characterColor
      ctx.textBaseline = "top"
      ctx.textAlign = "left"

      // Calculate base font size based on canvas size, but smaller to fit more characters
      const baseFontSize = Math.max(6, Math.floor(m / 100))
      const fontSize = baseFontSize * scale

      // Use a monospace font for better rendering
      ctx.font = `${fontSize}px monospace`

      // Disable anti-aliasing for sharper text at small scales
      ctx.imageSmoothingEnabled = false

      // Scale the context to account for device pixel ratio
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Calculate character size with proper spacing
      const charWidth = fontSize * characterSpacing
      const charHeight = fontSize * 1.2

      // Calculate how many characters we can fit
      const charsX = Math.ceil(canvas.width / dpr / charWidth)
      const charsY = Math.ceil(canvas.height / dpr / charHeight)

      // Render ASCII art with pixel-perfect positioning
      for (let y = 0; y < charsY; y++) {
        for (let x = 0; x < charsX; x++) {
          const coord = {
            x: x * charWidth,
            y: y * charHeight,
          }

          // Convert screen coordinates to normalized coordinates for the pattern
          const normalizedCoord = {
            x: (coord.x / (canvas.width / dpr)) * cols,
            y: (coord.y / (canvas.height / dpr)) * rows,
          }

          const char = getCharacterForPosition(normalizedCoord, context) || ""
          if (char && char.trim()) {
            // Only draw non-empty characters
            ctx.fillText(char, coord.x, coord.y)
          }
        }
      }

      // Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      frameRef.current = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(frameRef.current)
  }, [canvasSize])

  // Get character for a specific position based on the current mode
  function getCharacterForPosition(coord: { x: number; y: number }, context: Context) {
    const { mode, characterSet } = designParamsRef.current

    // Safety check for empty character set
    if (!characterSet || characterSet.length === 0) {
      return " "
    }

    // Get the appropriate image reference based on mode
    let imageRef: React.MutableRefObject<ImageData | null> | null = null

    switch (mode) {
      case 0: // Neo
        imageRef = neoImageRef
        break
      case 1: // Bullet Time
        imageRef = bulletTimeImageRef
        break
      case 2: // Morpheus
        imageRef = morpheusImageRef
        break
      default:
        return " "
    }

    if (imageRef?.current && imageRef.current.isLoaded) {
      // Normalize coordinates to 0-1 range for image lookup
      const nx = coord.x / context.cols
      const ny = coord.y / context.rows

      // Get brightness at this position from the current frame
      const brightness = getBrightnessAt(imageRef.current, nx, ny)

      // Replace the existing mapping code with this improved version:
      // Apply a power function to spread out the brightness values more evenly
      // This will give better distribution across the character set
      const adjustedBrightness = Math.pow(brightness, 0.5) // Square root function spreads out lower values
      const idx = Math.floor(adjustedBrightness * characterSet.length)
      return characterSet[Math.min(characterSet.length - 1, Math.max(0, idx))] || " "
    }

    return " "
  }

  const updateDesignParam = <K extends keyof DesignParams>(key: K, value: DesignParams[K]) => {
    designParamsRef.current[key] = value
    forceUpdate({})
  }

  // Function to enter the matrix - triggers zoom out animation
  const enterTheMatrix = useCallback(() => {
    console.log("Entering the Matrix...") // Debug log
    setIsEntering(true)
    setHasEnteredMatrix(true)
    setAnimationComplete(false) // Reset animation state

    // Cancel any existing animation
    if (scaleAnimationRef.current) {
      cancelAnimationFrame(scaleAnimationRef.current)
    }

    const startScale = designParamsRef.current.scale
    const targetScale = MIN_SCALE // Zoom out to minimum scale
    const duration = 3000 // Animation duration in milliseconds
    const startTime = performance.now()

    const animateScale = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Use easeOutQuad for smooth deceleration
      const easeOutQuad = (t: number) => t * (2 - t)
      const easedProgress = easeOutQuad(progress)

      // Calculate new scale value
      const newScale = startScale - (startScale - targetScale) * easedProgress

      // Update scale
      updateDesignParam("scale", newScale)

      // Continue animation if not complete
      if (progress < 1) {
        scaleAnimationRef.current = requestAnimationFrame(animateScale)
      } else {
        scaleAnimationRef.current = null
        setIsEntering(false)
        setAnimationComplete(true) // Mark animation as complete

        // Show controls after animation completes
        setTimeout(() => {
          setShowControls(true)
        }, 500) // Small delay before showing controls
      }
    }

    scaleAnimationRef.current = requestAnimationFrame(animateScale)
  }, [])

  // Register the enter matrix handler with the popup context - only once
  useEffect(() => {
    setEnterMatrixHandler(enterTheMatrix)
  }, [setEnterMatrixHandler, enterTheMatrix])

  // Function to smoothly interpolate scale to minimum scale
  const zoomOut = () => {
    const currentScale = designParamsRef.current.scale

    // Only zoom out if we're currently zoomed in beyond minimum scale
    if (currentScale <= MIN_SCALE) {
      return
    }

    // Cancel any existing animation
    if (scaleAnimationRef.current) {
      cancelAnimationFrame(scaleAnimationRef.current)
    }

    const startScale = currentScale
    const targetScale = MIN_SCALE // Zoom out to minimum scale
    const duration = 3000 // Animation duration in milliseconds
    const startTime = performance.now()

    const animateScale = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Use easeOutQuad for smooth deceleration
      const easeOutQuad = (t: number) => t * (2 - t)
      const easedProgress = easeOutQuad(progress)

      // Calculate new scale value
      const newScale = startScale - (startScale - targetScale) * easedProgress

      // Update scale
      updateDesignParam("scale", newScale)

      // Continue animation if not complete
      if (progress < 1) {
        scaleAnimationRef.current = requestAnimationFrame(animateScale)
      } else {
        scaleAnimationRef.current = null
      }
    }

    scaleAnimationRef.current = requestAnimationFrame(animateScale)
  }

  // Get the current GIF URL based on mode
  const getCurrentGifUrl = () => {
    switch (designParamsRef.current.mode) {
      case 0:
        return NEO_GIF_URL
      case 1:
        return BULLET_TIME_GIF_URL
      case 2:
        return MORPHEUS_GIF_URL
      default:
        return NEO_GIF_URL
    }
  }

  return (
    <div className="min-h-screen dark bg-black" data-theme="dark">
      {/* Responsive layout that changes direction on mobile */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Design panel - only show if user has entered the matrix and controls are visible */}
        {hasEnteredMatrix && showControls && (
          <div className={`transition-opacity duration-1000 ease-in-out ${showControls ? "opacity-100" : "opacity-0"}`}>
            <DesignPanel
              {...designParamsRef.current}
              isMobile={isMobile}
              onUpdateMode={(value) => updateDesignParam("mode", value)}
              onUpdateCharacterSet={(value) => updateDesignParam("characterSet", value)}
              onUpdateBackgroundColor={(value) => updateDesignParam("backgroundColor", value)}
              onUpdateScale={(value) => updateDesignParam("scale", value)}
              onUpdateCharacterColor={(value) => updateDesignParam("characterColor", value)}
              onUpdateCharacterSpacing={(value) => updateDesignParam("characterSpacing", value)}
              onZoomOut={zoomOut}
              modeNames={MODE_NAMES}
            />
          </div>
        )}

        {/* Main content area - takes remaining space */}
        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center bg-black relative">
          <div ref={canvasContainerRef} className="w-full flex items-center justify-center">
            <div className="rounded-lg overflow-hidden shadow-lg relative">
              {/* Original GIF layer (underneath) */}
              <div
                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                style={{
                  opacity: 1 - canvasOpacity,
                  width: canvasSize ? `${canvasSize}px` : "100%",
                  height: canvasSize ? `${canvasSize}px` : "100%",
                  backgroundImage: `url(${getCurrentGifUrl()})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: designParamsRef.current.backgroundColor,
                }}
              />

              {/* ASCII canvas layer (on top) */}
              <canvas
                ref={canvasRef}
                className="block touch-manipulation relative transition-opacity duration-1000 ease-in-out"
                style={{
                  backgroundColor: "transparent",
                  width: canvasSize ? `${canvasSize}px` : "100%",
                  height: canvasSize ? `${canvasSize}px` : "100%",
                  opacity: canvasOpacity,
                }}
              />
            </div>
          </div>

          {/* Mobile scale slider - only show if controls are visible AND animation is complete */}
          {isMobile && hasEnteredMatrix && showControls && animationComplete && (
            <div
              className={`w-full max-w-md mt-6 px-4 transition-opacity duration-1000 ease-in-out ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-foreground font-medium">Scale</Label>
                    <span className="text-xs text-muted-foreground">{designParamsRef.current.scale.toFixed(2)}x</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Slider
                      value={[designParamsRef.current.scale]}
                      min={0.5}
                      max={MAX_SCALE}
                      step={0.05}
                      onValueChange={([value]) => updateDesignParam("scale", value)}
                      className="touch-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={zoomOut}
                      title="Reset zoom to minimum"
                      disabled={designParamsRef.current.scale <= MIN_SCALE}
                      className="h-8 w-8 flex-shrink-0 bg-background border-green-500 text-green-500 hover:bg-green-500/10"
                    >
                      <ZoomOut className="h-4 w-4" strokeWidth={2} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Main component that wraps everything with the WelcomePopupProvider
export default function DesignTool() {
  return (
    <WelcomePopupProvider>
      <DesignToolContent />
    </WelcomePopupProvider>
  )
}
