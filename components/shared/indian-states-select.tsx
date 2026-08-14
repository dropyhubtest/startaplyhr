"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
]

interface IndianStatesSelectProps {
  value?: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function IndianStatesSelect({
  value,
  onChange,
  placeholder = "Select State",
  className,
}: IndianStatesSelectProps) {
  return (
    <Select value={value || ""} onValueChange={(val: any) => onChange(val || "")}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {INDIAN_STATES.map((state) => (
          <SelectItem key={state} value={state}>
            {state}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
