"use client"
import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ZoomOut, Settings, HelpCircle } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useWelcomePopup } from "./welcome-popup"

interface DesignPanelProps {
  mode: number
  characterSet: string
  backgroundColor: string
  scale: number
  characterColor: string
  characterSpacing: number
  isMobile: boolean
  modeNames: string[]
  onUpdateMode: (value: number) => void
  onUpdateCharacterSet: (value: string) => void
  onUpdateBackgroundColor: (value: string) => void
  onUpdateScale: (value: number) => void
  onUpdateCharacterColor: (value: string) => void
  onUpdateCharacterSpacing: (value: number) => void
  onZoomOut: () => void
}

export function DesignPanel({
  mode,
  characterSet,
  backgroundColor,
  scale,
  characterColor,
  characterSpacing,
  isMobile,
  modeNames,
  onUpdateMode,
  onUpdateCharacterSet,
  onUpdateBackgroundColor,
  onUpdateScale,
  onUpdateCharacterColor,
  onUpdateCharacterSpacing,
  onZoomOut,
}: DesignPanelProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const { openPopup } = useWelcomePopup()

  // The simplified controls content - reused in both mobile and desktop views
  const ControlsContent = () => (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-white">Mode</Label>
          <div className="flex flex-wrap gap-2">
            {modeNames.map((modeName, index) => (
              <Button
                key={index}
                variant={mode === index ? "default" : "outline"}
                onClick={() => onUpdateMode(index)}
                className={`${isMobile ? "flex-1 min-w-[60px] h-12" : ""} ${mode === index ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "bg-black border-green-600 text-green-500 hover:bg-green-600/10"}`}
              >
                {modeName}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Character Set</Label>
          <Input
            value={characterSet}
            onChange={(e) => onUpdateCharacterSet(e.target.value)}
            className="bg-black border-green-600 text-green-500 focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>
    </>
  )

  // Render different layouts for mobile and desktop
  if (isMobile) {
    return (
      <>
        {/* Fixed control bar at the top for mobile */}
        <div className="sticky top-0 z-10 w-full bg-black border-b border-green-800 p-2 flex justify-between items-center">
          <h2 className="text-lg font-semibold" style={{ color: "#00FF00" }}>
            Free Your Mind
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={openPopup}
              className="h-10 w-10 bg-black border-green-500 text-green-500 hover:bg-green-500/10"
              title="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 bg-black border-green-500 text-green-500 hover:bg-green-500/10"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[80vh] overflow-y-auto pb-8 bg-black border-t border-green-800"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-green-500">Settings</h2>
                </div>
                <ControlsContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </>
    )
  }

  // Desktop layout - update to include the mobile slider implementation
  return (
    <div className="w-80 h-screen overflow-y-auto border-r border-green-800 bg-black p-6 text-foreground">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold" style={{ color: "#00FF00" }}>
          Free Your Mind
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={openPopup}
          className="h-8 w-8 bg-black border-green-500 text-green-500 hover:bg-green-500/10"
          title="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Add the mobile-style scale slider to desktop */}
      <div className="mb-6">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-foreground font-medium">Scale</Label>
              <span className="text-xs text-muted-foreground">{scale.toFixed(2)}x</span>
            </div>
            <div className="flex items-center space-x-2">
              <Slider
                value={[scale]}
                min={0.5}
                max={3.0}
                step={0.05}
                onValueChange={([value]) => onUpdateScale(value)}
                className="touch-none"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={onZoomOut}
                title="Reset zoom to minimum"
                disabled={scale <= 0.5}
                className="h-8 w-8 flex-shrink-0 bg-background border-green-500 text-green-500 hover:bg-green-500/10"
              >
                <ZoomOut className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["settings"]}>
        <AccordionItem value="settings" className="border-green-800">
          <AccordionTrigger className="text-green-500 hover:text-green-400">
            <div className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              <span>Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ControlsContent />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
