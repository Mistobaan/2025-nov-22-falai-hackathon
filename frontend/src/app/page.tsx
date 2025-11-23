'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  ChartBarIcon, 
  FolderIcon, 
  CubeIcon, 
  BookOpenIcon, 
  CpuChipIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  const [activeProject, setActiveProject] = useState('Lens_Inspection_V2')

  return (
    <div className="flex h-screen bg-[#0a0e1a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f1419] border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CubeIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold">FlawSmith</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <a 
                href="#" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-gray-100 transition-colors"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600/20 text-blue-400 transition-colors"
              >
                <FolderIcon className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium">Projects</div>
                  <div className="text-xs text-gray-500">Active: {activeProject}</div>
                </div>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-gray-100 transition-colors"
              >
                <CubeIcon className="w-5 h-5" />
                <div className="flex-1">
                  <div>Data Assets</div>
                  <div className="text-xs text-gray-500">Baseline</div>
                </div>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-gray-100 transition-colors"
              >
                <BookOpenIcon className="w-5 h-5" />
                <span>Defect Library</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-gray-100 transition-colors"
              >
                <CpuChipIcon className="w-5 h-5" />
                <span>Generation Jobs</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#0f1419] border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Defect Workbench</h2>
            <p className="text-sm text-gray-400 mt-1">Design and preview synthetic defects for your production line</p>
          </div>
          <Link
            href="/blueprints/new"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            <PlusIcon className="w-5 h-5" />
            Create Blueprint
          </Link>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Welcome to FlawSmith
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Generate photorealistic synthetic defects for your manufacturing quality control systems. 
                Create custom defect blueprints, preview them in real-time, and export training datasets.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Feature Card 1 */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                    <CubeIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Defect Blueprints</h4>
                  <p className="text-gray-400 text-sm">
                    Layer multiple defect types with precise control over appearance, severity, and placement
                  </p>
                </div>

                {/* Feature Card 2 */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                    <CpuChipIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Real-time Preview</h4>
                  <p className="text-gray-400 text-sm">
                    See your defects rendered instantly with photorealistic quality using AI-powered generation
                  </p>
                </div>

                {/* Feature Card 3 */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10">
                  <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                    <ChartBarIcon className="w-6 h-6 text-green-400" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Export & Train</h4>
                  <p className="text-gray-400 text-sm">
                    Generate datasets at scale and integrate with your ML training pipelines seamlessly
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/blueprints/new"
                className="group bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-xl p-8 hover:border-blue-500/60 transition-all hover:shadow-xl hover:shadow-blue-500/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-7 h-7 text-white" />
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-2">Create New Blueprint</h4>
                <p className="text-gray-400">
                  Start building a custom defect configuration with our intuitive layer-based editor
                </p>
              </Link>

              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 rounded-xl p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gray-700/50 rounded-xl flex items-center justify-center">
                    <FolderIcon className="w-7 h-7 text-gray-400" />
                  </div>
                </div>
                <h4 className="text-xl font-semibold mb-2 text-gray-300">Recent Projects</h4>
                <p className="text-gray-500">
                  No recent projects yet. Create your first blueprint to get started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
