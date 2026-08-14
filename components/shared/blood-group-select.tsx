"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const BLOOD_GROUPS = [
  { value: "A_POS", label: "A+" },
  { value: "A_NEG", label: "A-" },
  { value: "B_POS", label: "B+" },
  { value: "B_NEG", label: "B-" },
  { value: "AB_POS", label: "AB+" },
  { value: "AB_NEG", label: "AB-" },
  { value: "O_POS", label: "O+" },
  { value: "O_NEG", label: "O-" },
]

export function formatBloodGroup(val?: string | null): string {
  if (!val) return "Not Specified"
  const found = BLOOD_GROUPS.find((bg) => bg.value === val)
  return found ? found.label : val
}

interface BloodGroupSelectProps {
  value?: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function BloodGroupSelect({
  value,
  onChange,
  placeholder = "Select Blood Group",
  className,
}: BloodGroupSelectProps) {
  return (
    <Select value={value || ""} onValueChange={(val: any) => onChange(val || "")}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {BLOOD_GROUPS.map((bg) => (
          <SelectItem key={bg.value} value={bg.value}>
            {bg.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
