"use client"

import {
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Headphones,
  Keyboard,
  Mouse,
  CreditCard,
  Package,
  Armchair,
  HardDrive,
} from "lucide-react"

export const ASSET_TYPES = [
  { value: "LAPTOP", label: "Laptop", icon: Laptop },
  { value: "DESKTOP", label: "Desktop PC", icon: HardDrive },
  { value: "MOBILE", label: "Mobile Phone", icon: Smartphone },
  { value: "TABLET", label: "Tablet", icon: Tablet },
  { value: "HEADPHONES", label: "Headphones / Headset", icon: Headphones },
  { value: "MONITOR", label: "Monitor / Display", icon: Monitor },
  { value: "KEYBOARD", label: "Keyboard", icon: Keyboard },
  { value: "MOUSE", label: "Mouse / Input Device", icon: Mouse },
  { value: "ACCESS_CARD", label: "Access Card", icon: CreditCard },
  { value: "SIM_CARD", label: "SIM Card", icon: Smartphone },
  { value: "CHAIR", label: "Ergonomic Chair", icon: Armchair },
  { value: "OTHER", label: "Other Asset", icon: Package },
]

export function getAssetTypeDetails(type: string) {
  const found = ASSET_TYPES.find((t) => t.value === type)
  return found || { value: type, label: type, icon: Package }
}

interface AssetTypeIconProps {
  type: string
  className?: string
}

export function AssetTypeIcon({ type, className = "w-5 h-5" }: AssetTypeIconProps) {
  const { icon: Icon } = getAssetTypeDetails(type)
  return <Icon className={className} />
}
