import { StylingRequirements } from './vibesdk'

/**
 * UI/UX Translator
 * Converts natural language descriptions into Tailwind CSS classes and component structures
 */
export class UITranslator {
  /**
   * Parse natural language UI description and convert to styling information
   */
  parseUIDescription(description: string): ParsedUIDescription {
    const lowerDesc = description.toLowerCase()
    
    return {
      layout: this.parseLayout(lowerDesc),
      colors: this.parseColors(lowerDesc),
      spacing: this.parseSpacing(lowerDesc),
      typography: this.parseTypography(lowerDesc),
      components: this.parseComponents(lowerDesc),
      responsive: this.parseResponsive(lowerDesc),
      accessibility: this.parseAccessibility(lowerDesc),
      animations: this.parseAnimations(lowerDesc)
    }
  }

  /**
   * Convert UI description to Tailwind CSS classes
   */
  generateTailwindClasses(description: string): TailwindClasses {
    const parsed = this.parseUIDescription(description)
    
    return {
      container: this.generateContainerClasses(parsed),
      layout: this.generateLayoutClasses(parsed),
      colors: this.generateColorClasses(parsed),
      spacing: this.generateSpacingClasses(parsed),
      typography: this.generateTypographyClasses(parsed),
      responsive: this.generateResponsiveClasses(parsed),
      animations: this.generateAnimationClasses(parsed)
    }
  }

  /**
   * Generate responsive layout based on description
   */
  generateResponsiveLayout(description: string): ResponsiveLayout {
    const lowerDesc = description.toLowerCase()
    
    const layout: ResponsiveLayout = {
      mobile: this.parseMobileLayout(lowerDesc),
      tablet: this.parseTabletLayout(lowerDesc),
      desktop: this.parseDesktopLayout(lowerDesc)
    }
    
    return layout
  }

  /**
   * Generate component composition logic
   */
  generateComponentComposition(description: string): ComponentComposition {
    const lowerDesc = description.toLowerCase()
    
    return {
      structure: this.parseComponentStructure(lowerDesc),
      hierarchy: this.parseComponentHierarchy(lowerDesc),
      interactions: this.parseInteractions(lowerDesc),
      dataFlow: this.parseDataFlow(lowerDesc)
    }
  }

  /**
   * Parse layout information from description
   */
  private parseLayout(description: string): LayoutInfo {
    const layout: LayoutInfo = {
      type: 'flex',
      direction: 'column',
      alignment: 'start',
      distribution: 'start',
      wrap: false
    }

    // Layout type
    if (description.includes('grid')) layout.type = 'grid'
    if (description.includes('flex')) layout.type = 'flex'
    
    // Direction
    if (description.includes('horizontal') || description.includes('row')) {
      layout.direction = 'row'
    }
    if (description.includes('vertical') || description.includes('column')) {
      layout.direction = 'column'
    }
    
    // Alignment
    if (description.includes('center')) layout.alignment = 'center'
    if (description.includes('left')) layout.alignment = 'start'
    if (description.includes('right')) layout.alignment = 'end'
    
    // Distribution
    if (description.includes('space between')) layout.distribution = 'between'
    if (description.includes('space around')) layout.distribution = 'around'
    if (description.includes('space evenly')) layout.distribution = 'evenly'
    
    // Wrap
    if (description.includes('wrap')) layout.wrap = true
    
    return layout
  }

  /**
   * Parse color information from description
   */
  private parseColors(description: string): ColorInfo {
    const colors: ColorInfo = {
      primary: 'blue',
      secondary: 'gray',
      accent: 'purple',
      background: 'white',
      text: 'gray',
      theme: 'light'
    }

    // Primary colors
    const colorMap = {
      'blue': 'blue', 'red': 'red', 'green': 'green', 'yellow': 'yellow',
      'purple': 'purple', 'pink': 'pink', 'indigo': 'indigo', 'teal': 'teal',
      'orange': 'orange', 'cyan': 'cyan', 'lime': 'lime', 'emerald': 'emerald'
    }

    Object.entries(colorMap).forEach(([name, value]) => {
      if (description.includes(name)) {
        colors.primary = value
      }
    })

    // Theme
    if (description.includes('dark')) colors.theme = 'dark'
    if (description.includes('light')) colors.theme = 'light'
    
    return colors
  }

  /**
   * Parse spacing information from description
   */
  private parseSpacing(description: string): SpacingInfo {
    const spacing: SpacingInfo = {
      padding: 'medium',
      margin: 'medium',
      gap: 'medium'
    }

    // Size mapping
    const sizeMap = {
      'tight': 'small',
      'compact': 'small',
      'small': 'small',
      'medium': 'medium',
      'large': 'large',
      'spacious': 'large',
      'generous': 'large'
    }

    Object.entries(sizeMap).forEach(([key, value]) => {
      if (description.includes(key)) {
        spacing.padding = value
        spacing.margin = value
        spacing.gap = value
      }
    })

    return spacing
  }

  /**
   * Parse typography information from description
   */
  private parseTypography(description: string): TypographyInfo {
    const typography: TypographyInfo = {
      headingSize: 'large',
      bodySize: 'medium',
      fontWeight: 'normal',
      fontFamily: 'sans'
    }

    // Font sizes
    if (description.includes('large text') || description.includes('big text')) {
      typography.bodySize = 'large'
    }
    if (description.includes('small text')) {
      typography.bodySize = 'small'
    }

    // Font weights
    if (description.includes('bold')) typography.fontWeight = 'bold'
    if (description.includes('light')) typography.fontWeight = 'light'
    if (description.includes('thin')) typography.fontWeight = 'thin'

    // Font families
    if (description.includes('serif')) typography.fontFamily = 'serif'
    if (description.includes('mono')) typography.fontFamily = 'mono'

    return typography
  }

  /**
   * Parse component information from description
   */
  private parseComponents(description: string): ComponentInfo[] {
    const components: ComponentInfo[] = []

    // Common UI components
    const componentPatterns = {
      'button': { type: 'button', variant: 'default' },
      'card': { type: 'card', variant: 'default' },
      'form': { type: 'form', variant: 'default' },
      'input': { type: 'input', variant: 'default' },
      'modal': { type: 'dialog', variant: 'default' },
      'dialog': { type: 'dialog', variant: 'default' },
      'table': { type: 'table', variant: 'default' },
      'list': { type: 'list', variant: 'default' },
      'navigation': { type: 'nav', variant: 'default' },
      'header': { type: 'header', variant: 'default' },
      'footer': { type: 'footer', variant: 'default' },
      'sidebar': { type: 'aside', variant: 'default' }
    }

    Object.entries(componentPatterns).forEach(([pattern, info]) => {
      if (description.includes(pattern)) {
        components.push(info)
      }
    })

    return components
  }

  /**
   * Parse responsive information from description
   */
  private parseResponsive(description: string): ResponsiveInfo {
    return {
      mobile: description.includes('mobile') || description.includes('phone'),
      tablet: description.includes('tablet') || description.includes('ipad'),
      desktop: description.includes('desktop') || description.includes('computer'),
      adaptive: description.includes('responsive') || description.includes('adaptive')
    }
  }

  /**
   * Parse accessibility information from description
   */
  private parseAccessibility(description: string): AccessibilityInfo {
    return {
      screenReader: description.includes('screen reader') || description.includes('accessible'),
      keyboard: description.includes('keyboard') || description.includes('tab'),
      contrast: description.includes('high contrast') || description.includes('accessible'),
      focus: description.includes('focus') || description.includes('accessible')
    }
  }

  /**
   * Parse animation information from description
   */
  private parseAnimations(description: string): AnimationInfo {
    const animations: AnimationInfo = {
      transitions: false,
      hover: false,
      loading: false,
      entrance: false
    }

    if (description.includes('animate') || description.includes('transition')) {
      animations.transitions = true
    }
    if (description.includes('hover')) animations.hover = true
    if (description.includes('loading') || description.includes('spinner')) {
      animations.loading = true
    }
    if (description.includes('fade in') || description.includes('slide in')) {
      animations.entrance = true
    }

    return animations
  }

  /**
   * Generate container classes
   */
  private generateContainerClasses(parsed: ParsedUIDescription): string {
    const classes = ['w-full']
    
    if (parsed.responsive.adaptive) {
      classes.push('container', 'mx-auto', 'px-4')
    }
    
    return classes.join(' ')
  }

  /**
   * Generate layout classes
   */
  private generateLayoutClasses(parsed: ParsedUIDescription): string {
    const classes = []
    
    if (parsed.layout.type === 'flex') {
      classes.push('flex')
      
      if (parsed.layout.direction === 'column') classes.push('flex-col')
      if (parsed.layout.direction === 'row') classes.push('flex-row')
      
      // Alignment
      switch (parsed.layout.alignment) {
        case 'center': classes.push('items-center'); break
        case 'start': classes.push('items-start'); break
        case 'end': classes.push('items-end'); break
      }
      
      // Distribution
      switch (parsed.layout.distribution) {
        case 'center': classes.push('justify-center'); break
        case 'between': classes.push('justify-between'); break
        case 'around': classes.push('justify-around'); break
        case 'evenly': classes.push('justify-evenly'); break
      }
      
      if (parsed.layout.wrap) classes.push('flex-wrap')
    }
    
    if (parsed.layout.type === 'grid') {
      classes.push('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    }
    
    return classes.join(' ')
  }

  /**
   * Generate color classes
   */
  private generateColorClasses(parsed: ParsedUIDescription): string {
    const classes = []
    
    if (parsed.colors.theme === 'dark') {
      classes.push('dark:bg-gray-900', 'dark:text-white')
    } else {
      classes.push('bg-white', 'text-gray-900')
    }
    
    return classes.join(' ')
  }

  /**
   * Generate spacing classes
   */
  private generateSpacingClasses(parsed: ParsedUIDescription): string {
    const spacingMap = {
      small: { padding: 'p-2', margin: 'm-2', gap: 'gap-2' },
      medium: { padding: 'p-4', margin: 'm-4', gap: 'gap-4' },
      large: { padding: 'p-8', margin: 'm-8', gap: 'gap-8' }
    }
    
    const spacing = spacingMap[parsed.spacing.padding as keyof typeof spacingMap] || spacingMap.medium
    
    return `${spacing.padding} ${spacing.gap}`
  }

  /**
   * Generate typography classes
   */
  private generateTypographyClasses(parsed: ParsedUIDescription): string {
    const classes = []
    
    // Font family
    switch (parsed.typography.fontFamily) {
      case 'serif': classes.push('font-serif'); break
      case 'mono': classes.push('font-mono'); break
      default: classes.push('font-sans'); break
    }
    
    // Font weight
    switch (parsed.typography.fontWeight) {
      case 'thin': classes.push('font-thin'); break
      case 'light': classes.push('font-light'); break
      case 'bold': classes.push('font-bold'); break
      default: classes.push('font-normal'); break
    }
    
    return classes.join(' ')
  }

  /**
   * Generate responsive classes
   */
  private generateResponsiveClasses(parsed: ParsedUIDescription): string {
    const classes = []
    
    if (parsed.responsive.adaptive) {
      classes.push('sm:px-6', 'lg:px-8')
    }
    
    return classes.join(' ')
  }

  /**
   * Generate animation classes
   */
  private generateAnimationClasses(parsed: ParsedUIDescription): string {
    const classes = []
    
    if (parsed.animations.transitions) {
      classes.push('transition-all', 'duration-200', 'ease-in-out')
    }
    
    if (parsed.animations.hover) {
      classes.push('hover:scale-105', 'hover:shadow-lg')
    }
    
    return classes.join(' ')
  }

  /**
   * Parse mobile layout
   */
  private parseMobileLayout(description: string): LayoutBreakpoint {
    return {
      columns: description.includes('single column') ? 1 : 1,
      spacing: 'small',
      navigation: description.includes('hamburger') ? 'hamburger' : 'bottom'
    }
  }

  /**
   * Parse tablet layout
   */
  private parseTabletLayout(description: string): LayoutBreakpoint {
    return {
      columns: description.includes('two column') ? 2 : 2,
      spacing: 'medium',
      navigation: 'top'
    }
  }

  /**
   * Parse desktop layout
   */
  private parseDesktopLayout(description: string): LayoutBreakpoint {
    const columns = description.includes('three column') ? 3 : 
                   description.includes('four column') ? 4 : 3
    
    return {
      columns,
      spacing: 'large',
      navigation: 'top'
    }
  }

  /**
   * Parse component structure
   */
  private parseComponentStructure(description: string): ComponentStructure {
    return {
      header: description.includes('header') || description.includes('top'),
      main: true,
      sidebar: description.includes('sidebar') || description.includes('aside'),
      footer: description.includes('footer') || description.includes('bottom')
    }
  }

  /**
   * Parse component hierarchy
   */
  private parseComponentHierarchy(description: string): ComponentHierarchy {
    return {
      depth: description.includes('nested') ? 3 : 2,
      sections: this.extractSections(description),
      relationships: this.extractRelationships(description)
    }
  }

  /**
   * Parse interactions
   */
  private parseInteractions(description: string): InteractionInfo[] {
    const interactions: InteractionInfo[] = []
    
    if (description.includes('click')) {
      interactions.push({ type: 'click', trigger: 'button', action: 'navigate' })
    }
    
    if (description.includes('hover')) {
      interactions.push({ type: 'hover', trigger: 'element', action: 'highlight' })
    }
    
    if (description.includes('form')) {
      interactions.push({ type: 'submit', trigger: 'form', action: 'validate' })
    }
    
    return interactions
  }

  /**
   * Parse data flow
   */
  private parseDataFlow(description: string): DataFlowInfo {
    return {
      direction: description.includes('bidirectional') ? 'bidirectional' : 'unidirectional',
      sources: this.extractDataSources(description),
      destinations: this.extractDataDestinations(description)
    }
  }

  /**
   * Extract sections from description
   */
  private extractSections(description: string): string[] {
    const sections = []
    
    if (description.includes('header')) sections.push('header')
    if (description.includes('navigation')) sections.push('navigation')
    if (description.includes('main')) sections.push('main')
    if (description.includes('content')) sections.push('content')
    if (description.includes('sidebar')) sections.push('sidebar')
    if (description.includes('footer')) sections.push('footer')
    
    return sections
  }

  /**
   * Extract relationships from description
   */
  private extractRelationships(description: string): ComponentRelationship[] {
    // This would be more sophisticated in a real implementation
    return [
      { parent: 'main', child: 'content', type: 'contains' }
    ]
  }

  /**
   * Extract data sources from description
   */
  private extractDataSources(description: string): string[] {
    const sources = []
    
    if (description.includes('api')) sources.push('api')
    if (description.includes('database')) sources.push('database')
    if (description.includes('form')) sources.push('form')
    if (description.includes('user input')) sources.push('user')
    
    return sources
  }

  /**
   * Extract data destinations from description
   */
  private extractDataDestinations(description: string): string[] {
    const destinations = []
    
    if (description.includes('display')) destinations.push('display')
    if (description.includes('save')) destinations.push('storage')
    if (description.includes('send')) destinations.push('api')
    
    return destinations
  }
}

// Supporting interfaces
export interface ParsedUIDescription {
  layout: LayoutInfo
  colors: ColorInfo
  spacing: SpacingInfo
  typography: TypographyInfo
  components: ComponentInfo[]
  responsive: ResponsiveInfo
  accessibility: AccessibilityInfo
  animations: AnimationInfo
}

export interface TailwindClasses {
  container: string
  layout: string
  colors: string
  spacing: string
  typography: string
  responsive: string
  animations: string
}

export interface ResponsiveLayout {
  mobile: LayoutBreakpoint
  tablet: LayoutBreakpoint
  desktop: LayoutBreakpoint
}

export interface ComponentComposition {
  structure: ComponentStructure
  hierarchy: ComponentHierarchy
  interactions: InteractionInfo[]
  dataFlow: DataFlowInfo
}

interface LayoutInfo {
  type: 'flex' | 'grid'
  direction: 'row' | 'column'
  alignment: 'start' | 'center' | 'end'
  distribution: 'start' | 'center' | 'between' | 'around' | 'evenly'
  wrap: boolean
}

interface ColorInfo {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  theme: 'light' | 'dark'
}

interface SpacingInfo {
  padding: 'small' | 'medium' | 'large'
  margin: 'small' | 'medium' | 'large'
  gap: 'small' | 'medium' | 'large'
}

interface TypographyInfo {
  headingSize: 'small' | 'medium' | 'large'
  bodySize: 'small' | 'medium' | 'large'
  fontWeight: 'thin' | 'light' | 'normal' | 'bold'
  fontFamily: 'sans' | 'serif' | 'mono'
}

interface ComponentInfo {
  type: string
  variant: string
}

interface ResponsiveInfo {
  mobile: boolean
  tablet: boolean
  desktop: boolean
  adaptive: boolean
}

interface AccessibilityInfo {
  screenReader: boolean
  keyboard: boolean
  contrast: boolean
  focus: boolean
}

interface AnimationInfo {
  transitions: boolean
  hover: boolean
  loading: boolean
  entrance: boolean
}

interface LayoutBreakpoint {
  columns: number
  spacing: 'small' | 'medium' | 'large'
  navigation: 'top' | 'bottom' | 'hamburger'
}

interface ComponentStructure {
  header: boolean
  main: boolean
  sidebar: boolean
  footer: boolean
}

interface ComponentHierarchy {
  depth: number
  sections: string[]
  relationships: ComponentRelationship[]
}

interface ComponentRelationship {
  parent: string
  child: string
  type: 'contains' | 'references' | 'depends'
}

interface InteractionInfo {
  type: 'click' | 'hover' | 'submit' | 'change'
  trigger: string
  action: string
}

interface DataFlowInfo {
  direction: 'unidirectional' | 'bidirectional'
  sources: string[]
  destinations: string[]
}