"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Zap, Memory, Code, Network, Cpu, GitBranch } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { AgentDefinition } from "@/lib/agent-registry"

// This would be populated by the API in production
const AGENT_CATEGORIES = [
  { id: "memory", name: "Memory Agents", icon: <Memory className="h-4 w-4" /> },
  { id: "logic", name: "Logic Agents", icon: <GitBranch className="h-4 w-4" /> },
  { id: "swarm", name: "Swarm Agents", icon: <Network className="h-4 w-4" /> },
  { id: "gpu", name: "GPU Agents", icon: <Cpu className="h-4 w-4" /> },
  { id: "quantum", name: "Quantum Agents", icon: <Zap className="h-4 w-4" /> },
  { id: "neural", name: "Neural Agents", icon: <Brain className="h-4 w-4" /> },
  { id: "code", name: "Code Agents", icon: <Code className="h-4 w-4" /> },
]

export function AgentSwarmDashboard() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState('memory');
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    // Fetch agents
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/agents');
        const data = await response.json();
        setAgents(data.agents);
      } catch (error) {
        console.error("Error loading agents:", error);
        toast({
          title: "Error",
          description: "Failed to load agents. Check console for details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgents();
    
    // Poll for agent status updates
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, [toast]);
  
  const executeAgent = async (agentId: string) => {
    // Prevent multiple executions
    if (runningAgents.has(agentId)) return;
    
    // Add to running set
    setRunningAgents(prev => new Set(prev).add(agentId));
    
    try {
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agentId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Agent Executed",
          description: `${agentId} completed successfully.`
        });
      } else {
        toast({
          title: "Execution Failed",
          description: data.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error executing agent ${agentId}:`, error);
      toast({
        title: "Error",
        description: `Failed to execute ${agentId}.`,
        variant: "destructive"
      });
    } finally {
      // Remove from running set
      setRunningAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(agentId);
        return newSet;
      });
    }
  };
  
  // Filter agents by category
  const categoryAgents = agents.filter(agent => agent.category === activeCategory);
  
  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-700/50">
        <CardTitle className="text-slate-100 flex items-center">
          <Brain className="mr-2 h-5 w-5 text-purple-500" />
          NEXUS Agent Swarm
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="memory" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-7 bg-slate-800/60">
            {AGENT_CATEGORIES.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400"
              >
                {category.icon}
                <span className="ml-2 hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {AGENT_CATEGORIES.map(category => (
            <TabsContent key={category.id} value={category.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="bg-slate-800/50 border-slate-700/50">
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-slate-700 rounded"></div>
                          <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                              ) : categoryAgents.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-slate-400">
                                  No agents found in this category
                                </div>
                              ) : categoryAgents.map(agent => (
                                <Card key={agent.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors">
                                  <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <h3 className="text-lg font-medium text-slate-100">{agent.name}</h3>
                                        <p className="text-sm text-slate-400">{agent.description}</p>
                                      </div>
                                      <Badge variant="outline" className="bg-slate-700/50 text-cyan-400 border-cyan-800">
                                        {agent.type}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                      <div className="text-xs text-slate-500">ID: {agent.id}</div>
                                      <Button 
                                        size="sm" 
                                        onClick={() => executeAgent(agent.id)}
                                        disabled={runningAgents.has(agent.id)}
                                        className="bg-cyan-700 hover:bg-cyan-600 text-white"
                                      >
                                        {runningAgents.has(agent.id) ? (
                                          <>
                                            <Zap className="mr-2 h-4 w-4 animate-pulse" />
                                            Running...
                                          </>
                                        ) : (
                                          <>
                                            <Zap className="mr-2 h-4 w-4" />
                                            Execute
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
