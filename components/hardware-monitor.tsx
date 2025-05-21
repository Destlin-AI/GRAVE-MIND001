"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Cpu, HardDrive, MemoryStickIcon as Memory, Server } from "lucide-react"

interface HardwareInfo {
  gpu: {
    available: boolean
    count: number
    memory: Array<{
      device: number
      allocated_mb: number
      reserved_mb: number
    }>
  }
  cpu: {
    percent: number
    count: number
    threads: number
  }
  ram: {
    total_gb: number
    used_gb: number
    percent: number
  }
  nvme: {
    total_gb: number
    used_gb: number
    percent_used: number
  }
}

export function HardwareMonitor() {
  const [hardware, setHardware] = useState<HardwareInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch hardware info
    const fetchHardwareInfo = async () => {
      try {
        // In a real implementation, fetch from your API
        // For now, use mock data
        setHardware({
          gpu: {
            available: true,
            count: 1,
            memory: [{ device: 0, allocated_mb: 2048, reserved_mb: 8192 }],
          },
          cpu: {
            percent: 35,
            count: 8,
            threads: 16,
          },
          ram: {
            total_gb: 32,
            used_gb: 12.5,
            percent: 39,
          },
          nvme: {
            total_gb: 1000,
            used_gb: 350,
            percent_used: 35,
          },
        })
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching hardware info:", error)
        setIsLoading(false)
      }
    }

    fetchHardwareInfo()

    // Set up polling interval
    const interval = setInterval(fetchHardwareInfo, 5000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hardware Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hardware) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hardware Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 text-gray-500">Unable to fetch hardware information</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hardware Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <h3 className="text-sm font-medium flex items-center">
                <Cpu className="h-4 w-4 mr-1" /> CPU
              </h3>
              <span className="text-sm">{hardware.cpu.percent}%</span>
            </div>
            <Progress value={hardware.cpu.percent} className="h-2" />
            <div className="text-xs text-gray-500 mt-1">
              {hardware.cpu.count} cores / {hardware.cpu.threads} threads
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <h3 className="text-sm font-medium flex items-center">
                <Memory className="h-4 w-4 mr-1" /> RAM
              </h3>
              <span className="text-sm">
                {hardware.ram.used_gb.toFixed(1)} / {hardware.ram.total_gb} GB
              </span>
            </div>
            <Progress value={hardware.ram.percent} className="h-2" />
          </div>

          {hardware.gpu.available && (
            <div>
              <div className="flex justify-between mb-1">
                <h3 className="text-sm font-medium flex items-center">
                  <Server className="h-4 w-4 mr-1" /> GPU
                </h3>
                <span className="text-sm">
                  {(hardware.gpu.memory[0].allocated_mb / 1024).toFixed(1)} /
                  {(hardware.gpu.memory[0].reserved_mb / 1024).toFixed(1)} GB
                </span>
              </div>
              <Progress
                value={(hardware.gpu.memory[0].allocated_mb / hardware.gpu.memory[0].reserved_mb) * 100}
                className="h-2"
              />
              <div className="text-xs text-gray-500 mt-1">{hardware.gpu.count} device(s)</div>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-1">
              <h3 className="text-sm font-medium flex items-center">
                <HardDrive className="h-4 w-4 mr-1" /> NVME
              </h3>
              <span className="text-sm">
                {hardware.nvme.used_gb.toFixed(1)} / {hardware.nvme.total_gb} GB
              </span>
            </div>
            <Progress value={hardware.nvme.percent_used} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
