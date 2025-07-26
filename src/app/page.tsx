"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import {
  File,
  FolderOpen,
  Save,
  Download,
  Upload,
  Play,
  Copy,
  Settings,
  HelpCircle,
  Maximize2,
  Minimize2,
  FileText,
  GitBranch,
  Database,
  Users,
  Zap,
  Sparkles,
  Heart,
  Star,
} from "lucide-react"

const defaultMermaidCode = `graph TD
    A["🚀 Start Your Journey"] --> B{"💭 What's Your Goal?"}
    B -->|✨ Create| C["🎨 Design Something Amazing"]
    B -->|📊 Analyze| D["📈 Dive Into Data"]
    C --> E["🎉 Success!"]
    D --> E
    
    style A fill:#ff6b6b,stroke:#ff5252,color:#fff
    style E fill:#4ecdc4,stroke:#26a69a,color:#fff`

const templates = [
  {
    name: "Flowchart",
    icon: GitBranch,
    color: "from-pink-500 to-rose-500",
    description: "Perfect for workflows",
    code: `graph TD
    A["🚀 Start Your Journey"] --> B{"💭 What's Your Goal?"}
    B -->|✨ Create| C["🎨 Design Something Amazing"]
    B -->|📊 Analyze| D["📈 Dive Into Data"]
    C --> E["🎉 Success!"]
    D --> E
    
    style A fill:#ff6b6b,stroke:#ff5252,color:#fff
    style E fill:#4ecdc4,stroke:#26a69a,color:#fff`,
  },
  {
    name: "Sequence Diagram",
    icon: Users,
    color: "from-purple-500 to-indigo-500",
    description: "Show interactions",
    code: `sequenceDiagram
    participant 👤 Alice
    participant 🤖 Bob
    👤->>🤖: Hey Bob! How's it going? 😊
    🤖-->>👤: Amazing! Thanks for asking! ✨
    👤-)🤖: Catch you later! 👋`,
  },
  {
    name: "Class Diagram",
    icon: Database,
    color: "from-emerald-500 to-teal-500",
    description: "Structure your code",
    code: `classDiagram
    class 🐾Animal {
        +String name
        +int age
        +makeSound() 🔊
    }
    class 🐕Dog {
        +String breed
        +bark() 🐕‍🦺
    }
    🐾Animal <|-- 🐕Dog`,
  },
  {
    name: "State Diagram",
    icon: Zap,
    color: "from-amber-500 to-orange-500",
    description: "Track state changes",
    code: `stateDiagram-v2
    [*] --> 😴Sleeping
    😴Sleeping --> [*]
    😴Sleeping --> 🏃‍♂️Running
    🏃‍♂️Running --> 😴Sleeping
    🏃‍♂️Running --> 💥Crashed
    💥Crashed --> [*]`,
  },
]

export default function FlowCraftStudio() {
  const [mermaidCode, setMermaidCode] = useState(defaultMermaidCode)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState("Flowchart")

  const handleTemplateSelect = (template: (typeof templates)[0]) => {
    setMermaidCode(template.code)
    setActiveTemplate(template.name)
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-orange-200/50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                FlowCraft Studio
              </h1>
              <p className="text-xs text-orange-600/70">Create beautiful diagrams</p>
            </div>
            <Badge className="ml-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0">v1.0 ✨</Badge>
          </div>

          <div className="flex items-center gap-1 ml-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-orange-700 hover:bg-orange-100">
                  File
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur">
                <DropdownMenuItem className="hover:bg-orange-50">
                  <File className="w-4 h-4 mr-2 text-orange-500" />
                  New
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-orange-50">
                  <FolderOpen className="w-4 h-4 mr-2 text-orange-500" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-orange-50">
                  <Save className="w-4 h-4 mr-2 text-orange-500" />
                  Save
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-orange-50">
                  <Download className="w-4 h-4 mr-2 text-orange-500" />
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-orange-700 hover:bg-orange-100">
                  Edit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur">
                <DropdownMenuItem className="hover:bg-orange-50">
                  <Copy className="w-4 h-4 mr-2 text-orange-500" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-orange-50">
                  <Upload className="w-4 h-4 mr-2 text-orange-500" />
                  Paste
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-orange-700 hover:bg-orange-100">
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white/95 backdrop-blur">
                <DropdownMenuItem onClick={() => setIsFullscreen(!isFullscreen)} className="hover:bg-orange-50">
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 mr-2 text-orange-500" />
                  ) : (
                    <Maximize2 className="w-4 h-4 mr-2 text-orange-500" />
                  )}
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg">
              <Play className="w-4 h-4 mr-2" />
              Render Magic ✨
            </Button>
            <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-100">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-100">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-72 bg-white/60 backdrop-blur border-r border-orange-200/50">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-500" />
              <h3 className="font-semibold text-orange-800">Recent Files</h3>
            </div>
            <div className="space-y-2">
              {[
                { name: "workflow.mmd", emoji: "🚀", time: "2 hours ago" },
                { name: "database-schema.mmd", emoji: "🗄️", time: "Yesterday" },
                { name: "user-journey.mmd", emoji: "👤", time: "3 days ago" },
                { name: "api-flow.mmd", emoji: "⚡", time: "1 week ago" },
              ].map((file) => (
                <Button
                  key={file.name}
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-white/80 rounded-lg p-3 h-auto"
                >
                  <span className="mr-3 text-lg">{file.emoji}</span>
                  <div className="text-left flex-1">
                    <div className="text-gray-700 font-medium">{file.name}</div>
                    <div className="text-xs text-gray-500">{file.time}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-orange-200/50" />

          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-orange-500" />
              <h3 className="font-medium text-sm text-orange-800">Quick Templates</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <Button
                  key={template.name}
                  variant={activeTemplate === template.name ? "secondary" : "ghost"}
                  className={`h-auto p-3 rounded-lg transition-all duration-200 ${
                    activeTemplate === template.name
                      ? "bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-200 shadow-sm"
                      : "hover:bg-white/80 hover:shadow-sm"
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="text-center">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mx-auto mb-2 shadow-sm`}
                    >
                      <template.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs font-medium text-gray-800">{template.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor and Preview */}
        <div className="flex-1">
          <ResizablePanelGroup direction="horizontal">
            {/* Code Editor */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-r from-orange-100 to-pink-100 px-6 py-4 border-b border-orange-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-semibold text-orange-800">Mermaid Code</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/80 text-orange-700 border border-orange-200">
                        Lines: {mermaidCode.split("\n").length}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-white/80">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6 bg-white/40">
                  <Textarea
                    value={mermaidCode}
                    onChange={(e) => setMermaidCode(e.target.value)}
                    className="h-full resize-none font-mono text-sm bg-white/80 border-orange-200/50 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                    placeholder="✨ Enter your magical Mermaid code here..."
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-orange-200/50" />

            {/* Preview */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 px-6 py-4 border-b border-orange-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-semibold text-purple-800">Live Preview</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-white/80 text-purple-700 border border-purple-200">✨ Auto-refresh</Badge>
                      <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-white/80">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6 bg-gradient-to-br from-white/60 to-purple-50/60">
                  <Card className="h-full flex items-center justify-center bg-white/80 backdrop-blur border-orange-200/50 rounded-xl shadow-lg">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl">
                        <GitBranch className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-800 mb-2">Your Diagram Preview ✨</h3>
                      <p className="text-gray-600 mb-6 max-w-sm">
                        Watch your Mermaid code come to life with beautiful, interactive diagrams
                      </p>
                      <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg">
                        <Play className="w-4 h-4 mr-2" />
                        Render Magic ✨
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Status Bar */}
      <footer className="bg-gradient-to-r from-orange-100 to-pink-100 px-6 py-3 border-t border-orange-200/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6 text-orange-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Ready to create magic ✨</span>
            </div>
            <span>•</span>
            <span>Ln 1, Col 1</span>
            <span>•</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-6 text-purple-700">
            <span>Mermaid v10.6.1 🧜‍♀️</span>
            <span>•</span>
            <span>Made with ❤️ by FlowCraft</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
