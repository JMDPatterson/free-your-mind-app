import type { ImageData } from "./image-processor"

// We'll use the gif.js library to decode GIFs
// This is a type definition for the SuperGif library
declare global {
  interface Window {
    SuperGif: any
  }
}

// Function to load the SuperGif library dynamically
async function loadSuperGifLibrary(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.SuperGif) {
      resolve()
      return
    }

    // Create script element for libgif.js
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/gh/buzzfeed/libgif-js@master/libgif.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load SuperGif library"))
    document.head.appendChild(script)
  })
}

// Function to decode a GIF and extract its frames
export async function decodeGif(url: string): Promise<ImageData> {
  // Create a placeholder for our image data
  const imageData: ImageData = {
    width: 0,
    height: 0,
    frames: [],
    frameCount: 0,
    currentFrame: 0,
    lastFrameTime: 0,
    frameDelay: 100, // Default frame delay in ms
    isLoaded: false,
  }

  try {
    // Load the SuperGif library
    await loadSuperGifLibrary()

    // Create a temporary image element to hold the GIF
    const tempImg = document.createElement("img")
    tempImg.src = url
    tempImg.setAttribute("rel:animated_src", url)
    tempImg.setAttribute("rel:auto_play", "0")

    // Create a div to hold the GIF (SuperGif requires this)
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.opacity = "0"
    container.style.pointerEvents = "none"
    container.appendChild(tempImg)
    document.body.appendChild(container)

    // Create a SuperGif instance
    const gifInstance = new window.SuperGif({ gif: tempImg })

    // Load the GIF and extract frames
    await new Promise<void>((resolve) => {
      gifInstance.load(() => {
        // Get dimensions
        imageData.width = gifInstance.get_canvas().width
        imageData.height = gifInstance.get_canvas().height

        // Get frame count
        imageData.frameCount = gifInstance.get_length()

        // Extract each frame
        for (let i = 0; i < imageData.frameCount; i++) {
          // Move to this frame
          gifInstance.move_to(i)

          // Get the canvas context and extract pixel data
          const canvas = gifInstance.get_canvas()
          const ctx = canvas.getContext("2d")
          if (ctx) {
            const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
            imageData.frames.push(new Uint8ClampedArray(frameData))
          }
        }

        // Set frame delay based on GIF info (if available)
        // SuperGif doesn't expose this directly, so we'll use a reasonable default
        imageData.frameDelay = 100 // 100ms is a common GIF frame delay

        // Mark as loaded
        imageData.isLoaded = true

        // Clean up
        document.body.removeChild(container)

        resolve()
      })
    })

    console.log(`Successfully decoded GIF with ${imageData.frameCount} frames`)
    return imageData
  } catch (error) {
    console.error("Error decoding GIF:", error)

    // Clean up if there was an error
    const container = document.querySelector('div[style*="opacity: 0"]')
    if (container) {
      document.body.removeChild(container)
    }

    return imageData
  }
}
