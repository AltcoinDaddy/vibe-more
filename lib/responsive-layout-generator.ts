import { ResponsiveLayout, ParsedUIDescription } from './ui-translator'

/**
 * Responsive Layout Generator
 * Creates responsive layouts with accessibility compliance
 */
export class ResponsiveLayoutGenerator {
  /**
   * Generate responsive layout component
   */
  generateResponsiveLayout(
    description: string,
    parsedUI: ParsedUIDescription
  ): ResponsiveLayoutComponent {
    const layoutCode = this.buildResponsiveLayoutCode(description, parsedUI)
    const breakpoints = this.generateBreakpoints(parsedUI.responsive)
    const accessibilityFeatures = this.generateAccessibilityFeatures(parsedUI.accessibility)
    
    return {
      code: layoutCode,
      breakpoints,
      accessibilityFeatures,
      dependencies: this.getLayoutDependencies()
    }
  }

  /**
   * Generate grid layout system
   */
  generateGridLayout(
    columns: { mobile: number; tablet: number; desktop: number },
    gap: string = 'medium'
  ): string {
    const gapClass = this.getGapClass(gap)
    
    return `<div className="grid grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop} ${gapClass}">
  {children}
</div>`
  }

  /**
   * Generate flexbox layout system
   */
  generateFlexLayout(
    direction: 'row' | 'column',
    alignment: string = 'start',
    responsive: boolean = true
  ): string {
    const directionClass = direction === 'row' ? 'flex-row' : 'flex-col'
    const alignmentClass = this.getAlignmentClass(alignment)
    const responsiveClasses = responsive ? 'flex-col md:flex-row' : directionClass
    
    return `<div className="flex ${responsiveClasses} ${alignmentClass}">
  {children}
</div>`
  }

  /**
   * Generate container with responsive padding
   */
  generateContainer(maxWidth: string = 'full'): string {
    const maxWidthClass = maxWidth === 'full' ? 'max-w-full' : `max-w-${maxWidth}`
    
    return `<div className="container mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClass}">
  {children}
</div>`
  }

  /**
   * Build complete responsive layout code
   */
  private buildResponsiveLayoutCode(
    description: string,
    parsedUI: ParsedUIDescription
  ): string {
    const imports = this.generateLayoutImports()
    const interfaces = this.generateLayoutInterfaces()
    const component = this.generateLayoutComponent(description, parsedUI)
    
    return `${imports}\n\n${interfaces}\n\n${component}`
  }

  /**
   * Generate layout imports
   */
  private generateLayoutImports(): string {
    return `'use client'

import React from 'react'
import { cn } from '@/lib/utils'`
  }

  /**
   * Generate layout interfaces
   */
  private generateLayoutInterfaces(): string {
    return `interface ResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  gap?: 'none' | 'sm' | 'md' | 'lg'
}`
  }

  /**
   * Generate main layout component
   */
  private generateLayoutComponent(
    description: string,
    parsedUI: ParsedUIDescription
  ): string {
    const layoutType = parsedUI.layout.type
    const layoutClasses = this.generateLayoutClasses(parsedUI)
    const responsiveClasses = this.generateResponsiveClasses(parsedUI)
    const accessibilityProps = this.generateAccessibilityProps(parsedUI.accessibility)
    
    return `export default function ResponsiveLayout({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
  gap = 'md'
}: ResponsiveLayoutProps) {
  const containerClasses = cn(
    // Base container styles
    'w-full mx-auto',
    
    // Max width responsive classes
    {
      'max-w-sm': maxWidth === 'sm',
      'max-w-md': maxWidth === 'md',
      'max-w-lg': maxWidth === 'lg',
      'max-w-xl': maxWidth === 'xl',
      'max-w-2xl': maxWidth === '2xl',
      'max-w-full': maxWidth === 'full'
    },
    
    // Padding responsive classes
    {
      'px-0': padding === 'none',
      'px-2 sm:px-4': padding === 'sm',
      'px-4 sm:px-6 lg:px-8': padding === 'md',
      'px-6 sm:px-8 lg:px-12': padding === 'lg'
    },
    
    // Layout-specific classes
    '${layoutClasses}',
    
    // Responsive classes
    '${responsiveClasses}',
    
    className
  )

  return (
    <div 
      className={containerClasses}
      ${accessibilityProps}
    >
      ${this.generateLayoutStructure(parsedUI)}
    </div>
  )
}`
  }

  /**
   * Generate layout classes based on parsed UI
   */
  private generateLayoutClasses(parsedUI: ParsedUIDescription): string {
    const classes = []
    
    if (parsedUI.layout.type === 'flex') {
      classes.push('flex')
      
      if (parsedUI.layout.direction === 'column') {
        classes.push('flex-col')
      } else {
        classes.push('flex-row')
      }
      
      // Alignment
      switch (parsedUI.layout.alignment) {
        case 'center':
          classes.push('items-center')
          break
        case 'end':
          classes.push('items-end')
          break
        default:
          classes.push('items-start')
      }
      
      // Distribution
      switch (parsedUI.layout.distribution) {
        case 'center':
          classes.push('justify-center')
          break
        case 'between':
          classes.push('justify-between')
          break
        case 'around':
          classes.push('justify-around')
          break
        case 'evenly':
          classes.push('justify-evenly')
          break
        default:
          classes.push('justify-start')
      }
      
      if (parsedUI.layout.wrap) {
        classes.push('flex-wrap')
      }
    }
    
    if (parsedUI.layout.type === 'grid') {
      classes.push('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    }
    
    return classes.join(' ')
  }

  /**
   * Generate responsive classes
   */
  private generateResponsiveClasses(parsedUI: ParsedUIDescription): string {
    const classes = []
    
    if (parsedUI.responsive.adaptive) {
      // Mobile-first responsive design
      classes.push(
        // Mobile (default)
        'text-sm',
        // Tablet
        'md:text-base',
        // Desktop
        'lg:text-lg'
      )
      
      // Layout adjustments
      if (parsedUI.layout.type === 'flex') {
        classes.push('flex-col', 'md:flex-row')
      }
    }
    
    return classes.join(' ')
  }

  /**
   * Generate accessibility props
   */
  private generateAccessibilityProps(accessibility: any): string {
    const props = []
    
    if (accessibility.screenReader) {
      props.push('role="main"')
      props.push('aria-label="Main content area"')
    }
    
    if (accessibility.keyboard) {
      props.push('tabIndex={0}')
    }
    
    return props.join('\n      ')
  }

  /**
   * Generate layout structure
   */
  private generateLayoutStructure(parsedUI: ParsedUIDescription): string {
    const hasHeader = parsedUI.components.some(c => c.type === 'header')
    const hasSidebar = parsedUI.components.some(c => c.type === 'aside')
    const hasFooter = parsedUI.components.some(c => c.type === 'footer')
    
    let structure = ''
    
    if (hasHeader) {
      structure += `      <header className="w-full mb-4 md:mb-6 lg:mb-8">
        {/* Header content */}
      </header>
      `
    }
    
    if (hasSidebar) {
      structure += `      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
        <aside className="w-full lg:w-64 flex-shrink-0">
          {/* Sidebar content */}
        </aside>
        <main className="flex-1">
          {children}
        </main>
      </div>
      `
    } else {
      structure += `      <main className="w-full">
        {children}
      </main>
      `
    }
    
    if (hasFooter) {
      structure += `      <footer className="w-full mt-4 md:mt-6 lg:mt-8">
        {/* Footer content */}
      </footer>`
    }
    
    return structure || '{children}'
  }

  /**
   * Generate breakpoints configuration
   */
  private generateBreakpoints(responsive: any): BreakpointConfig {
    return {
      mobile: { min: 0, max: 767 },
      tablet: { min: 768, max: 1023 },
      desktop: { min: 1024, max: Infinity }
    }
  }

  /**
   * Generate accessibility features
   */
  private generateAccessibilityFeatures(accessibility: any): AccessibilityFeature[] {
    const features: AccessibilityFeature[] = []
    
    if (accessibility.screenReader) {
      features.push({
        type: 'screen-reader',
        implementation: 'ARIA labels and semantic HTML',
        code: 'role="main" aria-label="Main content"'
      })
    }
    
    if (accessibility.keyboard) {
      features.push({
        type: 'keyboard-navigation',
        implementation: 'Tab index and focus management',
        code: 'tabIndex={0} onKeyDown={handleKeyDown}'
      })
    }
    
    if (accessibility.contrast) {
      features.push({
        type: 'high-contrast',
        implementation: 'WCAG AA compliant color contrast',
        code: 'text-gray-900 dark:text-gray-100'
      })
    }
    
    if (accessibility.focus) {
      features.push({
        type: 'focus-indicators',
        implementation: 'Visible focus indicators',
        code: 'focus:ring-2 focus:ring-blue-500 focus:outline-none'
      })
    }
    
    return features
  }

  /**
   * Get layout dependencies
   */
  private getLayoutDependencies(): string[] {
    return [
      'react',
      'clsx',
      '@/lib/utils'
    ]
  }

  /**
   * Get gap class for spacing
   */
  private getGapClass(gap: string): string {
    const gapMap = {
      none: 'gap-0',
      small: 'gap-2 md:gap-4',
      medium: 'gap-4 md:gap-6',
      large: 'gap-6 md:gap-8'
    }
    
    return gapMap[gap as keyof typeof gapMap] || gapMap.medium
  }

  /**
   * Get alignment class
   */
  private getAlignmentClass(alignment: string): string {
    const alignmentMap = {
      start: 'items-start justify-start',
      center: 'items-center justify-center',
      end: 'items-end justify-end',
      between: 'items-center justify-between',
      around: 'items-center justify-around'
    }
    
    return alignmentMap[alignment as keyof typeof alignmentMap] || alignmentMap.start
  }

  /**
   * Generate CSS Grid template
   */
  generateCSSGrid(
    columns: number,
    rows?: number,
    gap: string = 'medium'
  ): string {
    const gapClass = this.getGapClass(gap)
    const gridCols = `grid-cols-${columns}`
    const gridRows = rows ? `grid-rows-${rows}` : ''
    
    return `<div className="grid ${gridCols} ${gridRows} ${gapClass}">
  {children}
</div>`
  }

  /**
   * Generate responsive navigation
   */
  generateResponsiveNavigation(type: 'top' | 'hamburger' | 'bottom'): string {
    switch (type) {
      case 'hamburger':
        return `<nav className="flex items-center justify-between p-4 md:hidden">
  <div className="flex items-center">
    <button className="hamburger-menu">
      <span className="sr-only">Open menu</span>
      {/* Hamburger icon */}
    </button>
  </div>
</nav>

<nav className="hidden md:flex items-center space-x-8 p-4">
  {/* Desktop navigation items */}
</nav>`
      
      case 'bottom':
        return `<nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:relative md:border-t-0">
  <div className="flex justify-around p-2 md:justify-start md:space-x-8 md:p-4">
    {/* Navigation items */}
  </div>
</nav>`
      
      default:
        return `<nav className="flex items-center justify-between p-4">
  <div className="flex items-center space-x-8">
    {/* Navigation items */}
  </div>
</nav>`
    }
  }

  /**
   * Generate responsive typography scale
   */
  generateResponsiveTypography(): string {
    return `{
  // Headings
  h1: 'text-2xl md:text-3xl lg:text-4xl font-bold',
  h2: 'text-xl md:text-2xl lg:text-3xl font-semibold',
  h3: 'text-lg md:text-xl lg:text-2xl font-medium',
  
  // Body text
  body: 'text-sm md:text-base lg:text-lg',
  small: 'text-xs md:text-sm',
  
  // Interactive elements
  button: 'text-sm md:text-base px-3 py-2 md:px-4 md:py-2',
  input: 'text-sm md:text-base px-3 py-2 md:px-4 md:py-3'
}`
  }
}

// Supporting interfaces
export interface ResponsiveLayoutComponent {
  code: string
  breakpoints: BreakpointConfig
  accessibilityFeatures: AccessibilityFeature[]
  dependencies: string[]
}

interface BreakpointConfig {
  mobile: { min: number; max: number }
  tablet: { min: number; max: number }
  desktop: { min: number; max: number }
}

interface AccessibilityFeature {
  type: string
  implementation: string
  code: string
}