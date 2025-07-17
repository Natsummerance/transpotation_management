import React from "react"

interface DatePickerProps {
  value: [string, string]
  onChange: (val: [string, string]) => void
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="date"
        value={value[0]}
        onChange={e => onChange([e.target.value, value[1]])}
        className="border rounded px-2 py-1"
      />
      <span>至</span>
      <input
        type="date"
        value={value[1]}
        onChange={e => onChange([value[0], e.target.value])}
        className="border rounded px-2 py-1"
      />
    </div>
  )
} 