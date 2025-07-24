
"use client"

// This component is no longer used by the new layout system
// but is kept to prevent breaking imports in older files.
// It can be safely deleted if no other component depends on it.

import * as React from "react"

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  // Renders nothing to avoid interfering with the new layout.
  return null;
}
Sidebar.displayName = "Sidebar"

export { Sidebar }
