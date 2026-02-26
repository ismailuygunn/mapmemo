'use client'

// Premium UI Components — Radix UI based
import * as Tooltip from '@radix-ui/react-tooltip'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import * as Progress from '@radix-ui/react-progress'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { ChevronDown } from 'lucide-react'
import { forwardRef } from 'react'

// ═══════════════════════════════════════════
// TOOLTIP — hover info badges
// ═══════════════════════════════════════════
export function InfoTooltip({ children, content, side = 'top' }) {
    return (
        <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        side={side}
                        sideOffset={6}
                        className="ui-tooltip"
                    >
                        {content}
                        <Tooltip.Arrow className="ui-tooltip-arrow" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}

// ═══════════════════════════════════════════
// ACCORDION — collapsible sections (for days)
// ═══════════════════════════════════════════
export function Accordion({ children, ...props }) {
    return (
        <AccordionPrimitive.Root {...props} className="ui-accordion">
            {children}
        </AccordionPrimitive.Root>
    )
}

export const AccordionItem = forwardRef(({ children, ...props }, ref) => (
    <AccordionPrimitive.Item ref={ref} {...props} className="ui-accordion-item">
        {children}
    </AccordionPrimitive.Item>
))
AccordionItem.displayName = 'AccordionItem'

export const AccordionTrigger = forwardRef(({ children, ...props }, ref) => (
    <AccordionPrimitive.Header className="ui-accordion-header">
        <AccordionPrimitive.Trigger ref={ref} {...props} className="ui-accordion-trigger">
            {children}
            <ChevronDown size={16} className="ui-accordion-chevron" aria-hidden />
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = 'AccordionTrigger'

export const AccordionContent = forwardRef(({ children, ...props }, ref) => (
    <AccordionPrimitive.Content ref={ref} {...props} className="ui-accordion-content">
        <div className="ui-accordion-content-inner">{children}</div>
    </AccordionPrimitive.Content>
))
AccordionContent.displayName = 'AccordionContent'

// ═══════════════════════════════════════════
// PROGRESS BAR — animated progress
// ═══════════════════════════════════════════
export function ProgressBar({ value, max = 100, label, color }) {
    const percentage = Math.min((value / max) * 100, 100)
    return (
        <div className="ui-progress-wrapper">
            {label && <span className="ui-progress-label">{label}</span>}
            <Progress.Root className="ui-progress" value={value} max={max}>
                <Progress.Indicator
                    className="ui-progress-indicator"
                    style={{
                        transform: `translateX(-${100 - percentage}%)`,
                        background: color || 'linear-gradient(90deg, var(--primary-1), var(--primary-2))',
                    }}
                />
            </Progress.Root>
            <span className="ui-progress-value">{Math.round(percentage)}%</span>
        </div>
    )
}

// ═══════════════════════════════════════════
// SWITCH — toggle with animation
// ═══════════════════════════════════════════
export function Switch({ checked, onCheckedChange, label, hint }) {
    return (
        <div className="ui-switch-wrapper">
            <div className="ui-switch-info">
                {label && <span className="ui-switch-label">{label}</span>}
                {hint && <span className="ui-switch-hint">{hint}</span>}
            </div>
            <SwitchPrimitive.Root
                className="ui-switch"
                checked={checked}
                onCheckedChange={onCheckedChange}
            >
                <SwitchPrimitive.Thumb className="ui-switch-thumb" />
            </SwitchPrimitive.Root>
        </div>
    )
}

// ═══════════════════════════════════════════
// TABS — for advanced options sections
// ═══════════════════════════════════════════
export function Tabs({ children, ...props }) {
    return (
        <TabsPrimitive.Root {...props} className="ui-tabs">
            {children}
        </TabsPrimitive.Root>
    )
}

export function TabsList({ children }) {
    return (
        <TabsPrimitive.List className="ui-tabs-list">
            {children}
        </TabsPrimitive.List>
    )
}

export function TabsTrigger({ children, ...props }) {
    return (
        <TabsPrimitive.Trigger {...props} className="ui-tabs-trigger">
            {children}
        </TabsPrimitive.Trigger>
    )
}

export function TabsContent({ children, ...props }) {
    return (
        <TabsPrimitive.Content {...props} className="ui-tabs-content">
            {children}
        </TabsPrimitive.Content>
    )
}

// ═══════════════════════════════════════════
// RATING STARS — visual star display
// ═══════════════════════════════════════════
export function RatingStars({ rating, size = 14 }) {
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.3
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

    return (
        <span className="ui-rating" style={{ fontSize: size }}>
            {'★'.repeat(fullStars)}
            {hasHalf && '⯨'}
            {'☆'.repeat(emptyStars)}
            <span className="ui-rating-number">{rating}</span>
        </span>
    )
}

// ═══════════════════════════════════════════
// BADGE — status/type badge
// ═══════════════════════════════════════════
export function Badge({ children, variant = 'default', icon }) {
    return (
        <span className={`ui-badge ui-badge-${variant}`}>
            {icon && <span className="ui-badge-icon">{icon}</span>}
            {children}
        </span>
    )
}

// ═══════════════════════════════════════════
// SKELETON — loading placeholder
// ═══════════════════════════════════════════
export function Skeleton({ width = '100%', height = 20, borderRadius = 8 }) {
    return (
        <div
            className="ui-skeleton"
            style={{ width, height, borderRadius }}
        />
    )
}
