"use client"

import type React from "react"

import { useState, createContext, useContext, useCallback } from "react"
import { Button } from "@/components/ui/button"

// Create a context to manage the popup state globally
type WelcomePopupContextType = {
  isOpen: boolean
  openPopup: () => void
  closePopup: () => void
  enterMatrix: () => void
  setEnterMatrixHandler: (handler: () => void) => void
}

const WelcomePopupContext = createContext<WelcomePopupContextType>({
  isOpen: false,
  openPopup: () => {},
  closePopup: () => {},
  enterMatrix: () => {},
  setEnterMatrixHandler: () => {},
})

// Hook to use the popup context
export function useWelcomePopup() {
  return useContext(WelcomePopupContext)
}

export function WelcomePopupProvider({ children }: { children: React.ReactNode }) {
  // Set isOpen to true by default so it shows on every page load/refresh
  const [isOpen, setIsOpen] = useState(true)
  const [enterMatrixHandler, setEnterMatrixHandlerState] = useState<(() => void) | null>(null)

  const openPopup = useCallback(() => setIsOpen(true), [])
  const closePopup = useCallback(() => setIsOpen(false), [])

  const enterMatrix = useCallback(() => {
    console.log("Enter Matrix button clicked") // Debug log
    closePopup()
    if (enterMatrixHandler) {
      enterMatrixHandler()
    }
  }, [closePopup, enterMatrixHandler])

  const setEnterMatrixHandler = useCallback((handler: () => void) => {
    setEnterMatrixHandlerState(() => handler)
  }, [])

  return (
    <WelcomePopupContext.Provider value={{ isOpen, openPopup, closePopup, enterMatrix, setEnterMatrixHandler }}>
      {children}
      <WelcomePopupContent />
    </WelcomePopupContext.Provider>
  )
}

function WelcomePopupContent() {
  const { isOpen, enterMatrix } = useWelcomePopup()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-md p-6 mx-4 rounded-lg bg-black border border-green-500 shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-green-500">Welcome to The Matrix.</h2>

        <div className="space-y-3 text-green-400 mb-6">
          <p>Unfortunately, no one can be told what the Matrix is. You have to see it for yourself.</p>
          <p>
            Once you enter, adjust the scale, explore different pattern modes, and manipulate the Matrix to create your
            own unique experience.
          </p>
          <p>This is your last chance. After this, there is no turning back.</p>
          <p className="text-sm opacity-80">
            Built using v0 and Vercel by{" "}
            <a href="https://www.jmdpatterson.com/" className="underline text-white hover:text-white">
              JMDPatterson
            </a>
            . A fan-made non-commercial project inspired by the Wachowskis' 'The Matrix' franchise. v0 Project forked
            from @ctatedev (Twitter/X).
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={enterMatrix}
            className="px-8 py-4 text-lg font-bold bg-green-600 hover:bg-green-700 text-black border-2 border-green-500 shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            Enter the Matrix
          </Button>
        </div>
      </div>
    </div>
  )
}

// For backward compatibility
export function WelcomePopup() {
  return null // The actual popup is now rendered by the provider
}
