import { decodeGif } from "./gif-decoder"

export interface ImageData {
  width: number
  height: number
  frames: Uint8ClampedArray[]
  frameCount: number
  currentFrame: number
  lastFrameTime: number
  frameDelay: number
  isLoaded: boolean
}

export async function loadGif(url: string): Promise<ImageData> {
  try {
    // Use our GIF decoder to get the actual frames
    const decodedGif = await decodeGif(url)

    // If we successfully decoded the GIF, return it
    if (decodedGif.isLoaded && decodedGif.frameCount > 0) {
      console.log(`Loaded GIF with ${decodedGif.frameCount} frames`)
      return decodedGif
    }

    // If decoding failed, fall back to loading as a static image
    console.warn("GIF decoding failed, falling back to static image")
    return loadStaticImage(url)
  } catch (error) {
    console.error("Error loading GIF:", error)
    return loadStaticImage(url)
  }
}

// Fallback function to load a static image if GIF decoding fails
async function loadStaticImage(url: string): Promise<ImageData> {
  // Create a placeholder for our image data
  const imageData: ImageData = {
    width: 0,
    height: 0,
    frames: [],
    frameCount: 0,
    currentFrame: 0,
    lastFrameTime: 0,
    frameDelay: 100,
    isLoaded: false,
  }

  try {
    // Create an image element to load the image
    const img = new Image()
    img.crossOrigin = "anonymous"

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = url
    })

    // Create a canvas to extract frame data
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Set dimensions based on the loaded image
    imageData.width = canvas.width = img.width
    imageData.height = canvas.height = img.height

    // Draw the image and get its pixel data
    ctx.drawImage(img, 0, 0)
    const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data

    // For a static image, we just have one frame
    imageData.frames.push(new Uint8ClampedArray(frameData))
    imageData.frameCount = 1
    imageData.isLoaded = true

    return imageData
  } catch (error) {
    console.error("Error loading static image:", error)
    return imageData
  }
}

// Convert a pixel to grayscale value (0-1)
export function getPixelBrightness(data: Uint8ClampedArray, index: number): number {
  const r = data[index]
  const g = data[index + 1]
  const b = data[index + 2]

  // Use a more perceptually accurate grayscale conversion
  // This follows the ITU-R BT.709 standard for luminance calculation
  const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

  // Apply contrast enhancement to better distribute values
  return enhanceContrast(brightness, 0.1, 0.9)
}

// Enhance contrast by remapping the brightness range
function enhanceContrast(value: number, blackPoint = 0, whitePoint = 1): number {
  // Clamp the value between black and white points
  const clamped = Math.max(blackPoint, Math.min(whitePoint, value))

  // Remap to 0-1 range
  return (clamped - blackPoint) / (whitePoint - blackPoint)
}

// Get the brightness value at a specific x,y coordinate
export function getBrightnessAt(imageData: ImageData, x: number, y: number): number {
  if (!imageData.isLoaded || imageData.frames.length === 0 || imageData.currentFrame >= imageData.frames.length) {
    return 0
  }

  // Normalize coordinates to image dimensions
  const normX = Math.floor(Math.min(Math.max(x, 0), 0.999) * imageData.width)
  const normY = Math.floor(Math.min(Math.max(y, 0), 0.999) * imageData.height)

  // Calculate pixel index
  const index = (normY * imageData.width + normX) * 4

  // Get brightness from current frame
  return getPixelBrightness(imageData.frames[imageData.currentFrame], index)
}

// Update the current frame based on time
export function updateFrame(imageData: ImageData, currentTime: number): void {
  if (!imageData.isLoaded || imageData.frameCount <= 1) {
    return
  }

  if (currentTime - imageData.lastFrameTime > imageData.frameDelay) {
    imageData.currentFrame = (imageData.currentFrame + 1) % imageData.frameCount
    imageData.lastFrameTime = currentTime
  }
}
