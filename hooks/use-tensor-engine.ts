"use client"

import { useState, useEffect, useCallback } from "react"
import { getTensorEngine, type TensorEngine } from "@/lib/tensor-system/tensor-engine"

interface UseTensorEngineOptions {
  autoDetectOnMount?: boolean
}

export function useTensorEngine(options: UseTensorEngineOptions = {}) {
  const { autoDetectOnMount = false } = options
  const [engine] = useState<TensorEngine>(() => getTensorEngine())
  const [status, setStatus] = useState(() => engine.getStatus())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleStatusChange = () => {
      setStatus(engine.getStatus())
    }

    const handleError = (err: any) => {
      console.error("Tensor engine error:", err)
      setError(err.message || "An unknown error occurred")
      setIsLoading(false)
    }

    // Listen for events
    engine.on("started", handleStatusChange)
    engine.on("stopped", handleStatusChange)
    engine.on("hardware-detected", handleStatusChange)
    engine.on("hardware-updated", handleStatusChange)
    engine.on("allocation-updated", handleStatusChange)
    engine.on("error", handleError)

    // Auto-detect hardware if requested
    if (autoDetectOnMount) {
      detectHardware()
    }

    return () => {
      // Clean up event listeners
      engine.off("started", handleStatusChange)
      engine.off("stopped", handleStatusChange)
      engine.off("hardware-detected", handleStatusChange)
      engine.off("hardware-updated", handleStatusChange)
      engine.off("allocation-updated", handleStatusChange)
      engine.off("error", handleError)
    }
  }, [engine, autoDetectOnMount])

  const startEngine = useCallback(
    async (modelName: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await engine.start(modelName)
        if (!result) {
          setError("Failed to start tensor engine")
        }
        return result
      } catch (err: any) {
        setError(err.message || "Failed to start tensor engine")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [engine],
  )

  const stopEngine = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await engine.stop()
      if (!result) {
        setError("Failed to stop tensor engine")
      }
      return result
    } catch (err: any) {
      setError(err.message || "Failed to stop tensor engine")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [engine])

  const detectHardware = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await engine["detectHardware"]()
      return true
    } catch (err: any) {
      setError(err.message || "Failed to detect hardware")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [engine])

  const setNvmePath = useCallback(
    (path: string) => {
      try {
        engine.setNvmePath(path)
        return true
      } catch (err: any) {
        setError(err.message || "Failed to set NVME path")
        return false
      }
    },
    [engine],
  )

  const simulateInference = useCallback(
    async (prompt: string, options = {}) => {
      setIsLoading(true)
      setError(null)
      try {
        return await engine["simulateInference"](prompt, options)
      } catch (err: any) {
        setError(err.message || "Failed to run inference")
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [engine],
  )

  return {
    status,
    isLoading,
    error,
    startEngine,
    stopEngine,
    detectHardware,
    setNvmePath,
    simulateInference,
    clearError: () => setError(null),
  }
}
