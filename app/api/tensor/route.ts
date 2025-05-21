import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import os from "os"
import { TensorLMStudioBridge } from "@/lib/tensor-lm-studio-bridge"

// Global references
let tensorProcess: any = null
let isRunning = false
let tensorLMStudioBridge: TensorLMStudioBridge | null = null

export async function GET(request: NextRequest) {
  // Check if we're using the integrated mode
  if (tensorLMStudioBridge) {
    try {
      const status = await tensorLMStudioBridge.getStatus()
      return NextResponse.json(status)
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }
  }

  // Return status for standalone mode
  return NextResponse.json({
    isRunning,
    processId: tensorProcess?.pid || null,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, modelName, modelPath, config } = body

    // Check if we should use integrated mode
    const useIntegrated = body.integrated === true || modelPath !== undefined

    if (useIntegrated) {
      // Initialize bridge if needed
      if (!tensorLMStudioBridge) {
        tensorLMStudioBridge = new TensorLMStudioBridge()
      }

      switch (action) {
        case "start":
          const success = await tensorLMStudioBridge.start(modelPath, config)
          return NextResponse.json({ success })

        case "stop":
          const stopped = await tensorLMStudioBridge.stop()
          return NextResponse.json({ success: stopped })

        case "status":
          const status = await tensorLMStudioBridge.getStatus()
          return NextResponse.json(status)

        case "detect":
          // Use existing hardware detection
          return await detectHardware()

        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }
    } else {
      // Original standalone mode
      switch (action) {
        case "start":
          return await startTensorSystem(modelName, config)
        case "stop":
          return await stopTensorSystem()
        case "status":
          return NextResponse.json({ isRunning, processId: tensorProcess?.pid || null })
        case "detect":
          return await detectHardware()
        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }
    }
  } catch (error) {
    console.error("Error in tensor API:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function startTensorSystem(modelName: string, config: any) {
  if (isRunning) {
    return NextResponse.json({ success: false, error: "Tensor system is already running" })
  }

  try {
    // Create config file
    const configPath = path.join(os.tmpdir(), `tensor_config_${Date.now()}.json`)
    fs.writeFileSync(configPath, JSON.stringify(config || getDefaultConfig(modelName), null, 2))

    // Determine script path
    const scriptDir = process.env.TENSOR_SCRIPTS_PATH || path.join(process.cwd(), "tensor-scripts")
    const scriptPath = path.join(scriptDir, "tensor_server_nvme.py")

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({
        success: false,
        error: `Script not found: ${scriptPath}. Please ensure tensor scripts are in the correct location.`,
      })
    }

    // Start the process
    tensorProcess = spawn("python", [scriptPath, configPath], {
      stdio: "pipe",
      detached: false,
    })

    tensorProcess.stdout.on("data", (data: Buffer) => {
      console.log(`[TensorSystem] ${data.toString().trim()}`)
    })

    tensorProcess.stderr.on("data", (data: Buffer) => {
      console.error(`[TensorSystem] ${data.toString().trim()}`)
    })

    tensorProcess.on("close", (code: number) => {
      console.log(`Tensor system process exited with code ${code}`)
      isRunning = false
      tensorProcess = null
    })

    isRunning = true
    return NextResponse.json({ success: true, processId: tensorProcess.pid })
  } catch (error) {
    console.error("Failed to start tensor system:", error)
    return NextResponse.json({ success: false, error: String(error) })
  }
}

async function stopTensorSystem() {
  if (!isRunning || !tensorProcess) {
    return NextResponse.json({ success: true, message: "Tensor system is not running" })
  }

  try {
    // Kill the process
    tensorProcess.kill()

    // Wait for process to exit
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (!isRunning) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Force resolve after timeout
      setTimeout(() => {
        clearInterval(checkInterval)
        if (tensorProcess) {
          tensorProcess.kill("SIGKILL")
          isRunning = false
          tensorProcess = null
        }
        resolve()
      }, 5000)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to stop tensor system:", error)
    return NextResponse.json({ success: false, error: String(error) })
  }
}

async function detectHardware() {
  // In a real implementation, this would detect hardware
  // For now, we'll return mock data

  const hasGpu = Math.random() > 0.3 // 70% chance of having a GPU

  return NextResponse.json({
    gpu: {
      available: hasGpu,
      count: hasGpu ? Math.floor(Math.random() * 2) + 1 : 0,
      memory: hasGpu
        ? [
            {
              device: 0,
              allocated_mb: Math.floor(Math.random() * 2000) + 1000,
              reserved_mb: 8192,
            },
          ]
        : [],
    },
    cpu: {
      percent: Math.floor(Math.random() * 50) + 10,
      count: Math.floor(Math.random() * 6) + 2,
      threads: Math.floor(Math.random() * 12) + 4,
    },
    ram: {
      total_gb: Math.floor(Math.random() * 16) + 8,
      used_gb: Math.floor(Math.random() * 8) + 2,
      percent: Math.floor(Math.random() * 60) + 20,
    },
    nvme: {
      available: true,
      total_gb: Math.floor(Math.random() * 500) + 250,
      used_gb: Math.floor(Math.random() * 200) + 50,
      percent_used: Math.floor(Math.random() * 40) + 10,
    },
  })
}

function getDefaultConfig(modelName: string) {
  // Determine model size from name
  const isSmall = modelName?.includes("7b")
  const isMedium = modelName?.includes("13b") || modelName?.includes("14b") || modelName?.includes("30b")
  const isLarge = modelName?.includes("65b") || modelName?.includes("70b")

  let sizeCategory = "medium"
  if (isSmall) sizeCategory = "small"
  else if (isMedium) sizeCategory = "medium"
  else if (isLarge) sizeCategory = "large"

  return {
    system: {
      name: "GRAVEMIND Tensor Engine",
      version: "1.0.0",
      auto_detect_resources: true,
      description: "Hardware-aware distributed inference system with NVME offloading",
    },
    model: {
      name: modelName || "default",
      size_category: sizeCategory,
    },
    hardware: {
      gpu: {
        max_utilization: 0.95,
        reserved_vram_mb: 512,
        precision: "fp16",
        batch_size: 1,
        cuda_streams: 4,
      },
      cpu: {
        max_thread_percent: 85,
        pin_memory: true,
        numa_aware: true,
        thread_batch_size: 4,
      },
      nvme: {
        path: process.env.AGENT_PATH || path.join(process.cwd(), "nvme_cache"),
        max_utilization_gb: 950,
      },
      ram: {
        max_utilization_percent: 85,
        swap_threshold_gb: 4,
        emergency_release_percent: 15,
      },
    },
    layer_allocation: {
      strategy: "hardware_optimized",
      auto_balance: true,
      nvme_threshold_layer_size_mb: 150,
      gpu_layer_count: "auto",
      cpu_layer_count: "auto",
      nvme_layer_count: "auto",
    },
    api: {
      host: "127.0.0.1",
      port: 8080,
      workers: 1,
      timeout_seconds: 300,
    },
  }
}
