"use client"

import * as React from "react"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void
    checked?: boolean
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, ...props }, ref) => (
        <div
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-emerald-500" : "bg-white/10"}`}
            onClick={() => onCheckedChange?.(!checked)}
        >
            <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-[#5b21b6] shadow-lg ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`}
            />
            <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                ref={ref}
                {...props}
            />
        </div>
    )
)
Switch.displayName = "Switch"
