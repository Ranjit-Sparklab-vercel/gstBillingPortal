"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionProps {
  children: React.ReactNode
  className?: string
  type?: "single" | "multiple"
  defaultValue?: string | string[]
}

interface AccordionItemProps {
  value: string
  title: string
  description?: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function Accordion({ 
  children, 
  className,
  type = "single",
  defaultValue
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>(
    defaultValue 
      ? Array.isArray(defaultValue) ? defaultValue : [defaultValue]
      : []
  )

  const toggleItem = (value: string) => {
    if (type === "single") {
      setOpenItems(openItems.includes(value) ? [] : [value])
    } else {
      setOpenItems(prev => 
        prev.includes(value) 
          ? prev.filter(item => item !== value)
          : [...prev, value]
      )
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === AccordionItem) {
          return React.cloneElement(child as React.ReactElement<AccordionItemProps>, {
            isOpen: openItems.includes(child.props.value),
            onToggle: () => toggleItem(child.props.value),
          })
        }
        return child
      })}
    </div>
  )
}

export function AccordionItem({ 
  value,
  title, 
  description,
  defaultOpen = false,
  children,
  className,
  isOpen: controlledIsOpen,
  onToggle
}: AccordionItemProps & { isOpen?: boolean; onToggle?: () => void }) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen
  const toggle = onToggle || (() => setInternalOpen(!internalOpen))

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1">
          <h3 className="font-semibold text-base">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ml-4",
            isOpen && "transform rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t bg-muted/30">
          {children}
        </div>
      )}
    </div>
  )
}
