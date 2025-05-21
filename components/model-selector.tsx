"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ModelInfo {
  name: string
  size: string
  category: string
}

interface ModelSelectorProps {
  onModelSelect?: (modelName: string) => void
  className?: string
}

export function ModelSelector({ onModelSelect, className }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(true)

  useEffect(() => {
    // Fetch available models
    const fetchModels = async () => {
      try {
        // In a real implementation, fetch from your API
        // For now, use mock data
        setModels([
          { name: "llama-7b", size: "7B", category: "small" },
          { name: "mixtral-8x7b", size: "65B", category: "large" },
          { name: "phi-3-mini", size: "3.8B", category: "tiny" },
        ])

        // Set active model
        setActiveModel("llama-7b")
        setSelectedModel("llama-7b")
        setIsLoadingModels(false)
      } catch (error) {
        console.error("Error fetching models:", error)
        setIsLoadingModels(false)
      }
    }

    fetchModels()
  }, [])

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    if (onModelSelect) {
      onModelSelect(value)
    }
  }

  const handleLoadModel = async () => {
    if (!selectedModel) return

    setIsLoading(true)
    try {
      // In a real implementation, call your API to load the model
      console.log(`Loading model: ${selectedModel}`)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setActiveModel(selectedModel)

      // Notify parent component if callback provided
      if (onModelSelect) {
        onModelSelect(selectedModel)
      }
    } catch (error) {
      console.error("Error loading model:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Select value={selectedModel} onValueChange={handleModelChange} disabled={isLoadingModels || isLoading}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.name} value={model.name}>
              {model.name} ({model.size})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleLoadModel} disabled={!selectedModel || isLoading || selectedModel === activeModel}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading
          </>
        ) : selectedModel === activeModel ? (
          "Active"
        ) : (
          "Load Model"
        )}
      </Button>
    </div>
  )
}
