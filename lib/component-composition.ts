import { ComponentComposition, ParsedUIDescription } from './ui-translator'
import { GeneratedComponent, ComponentSpecification } from './vibesdk'

/**
 * Component Composition Logic
 * Handles complex interface composition and component relationships
 */
export class ComponentComposer {
  /**
   * Compose complex interface from multiple components
   */
  composeInterface(
    description: string,
    components: ComponentSpecification[],
    composition: ComponentComposition
  ): ComposedInterface {
    const structure = this.buildInterfaceStructure(composition.structure)
    const componentTree = this.buildComponentTree(components, composition.hierarchy)
    const interactions = this.wireInteractions(composition.interactions)
    const dataFlow = this.setupDataFlow(composition.dataFlow)
    
    return {
      structure,
      componentTree,
      interactions,
      dataFlow,
      code: this.generateComposedCode(structure, componentTree, interactions)
    }
  }

  /**
   * Generate component hierarchy
   */
  generateComponentHierarchy(
    rootComponent: ComponentSpecification,
    childComponents: ComponentSpecification[]
  ): ComponentHierarchy {
    const tree = this.buildHierarchyTree(rootComponent, childComponents)
    const dependencies = this.analyzeDependencies(tree)
    const renderOrder = this.calculateRenderOrder(tree)
    
    return {
      tree,
      dependencies,
      renderOrder,
      code: this.generateHierarchyCode(tree)
    }
  }

  /**
   * Create component wrapper system
   */
  createComponentWrapper(
    wrapperType: 'layout' | 'provider' | 'container' | 'modal',
    childComponents: ComponentSpecification[]
  ): ComponentWrapper {
    const wrapperCode = this.generateWrapperCode(wrapperType, childComponents)
    const props = this.generateWrapperProps(wrapperType)
    const styling = this.generateWrapperStyling(wrapperType)
    
    return {
      type: wrapperType,
      code: wrapperCode,
      props,
      styling,
      children: childComponents
    }
  }

  /**
   * Build interface structure
   */
  private buildInterfaceStructure(structure: any): InterfaceStructure {
    const sections: InterfaceSection[] = []
    
    if (structure.header) {
      sections.push({
        name: 'header',
        type: 'header',
        position: 'top',
        required: true,
        components: ['navigation', 'logo', 'user-menu']
      })
    }
    
    if (structure.sidebar) {
      sections.push({
        name: 'sidebar',
        type: 'aside',
        position: 'left',
        required: false,
        components: ['navigation', 'filters', 'actions']
      })
    }
    
    sections.push({
      name: 'main',
      type: 'main',
      position: 'center',
      required: true,
      components: ['content', 'forms', 'displays']
    })
    
    if (structure.footer) {
      sections.push({
        name: 'footer',
        type: 'footer',
        position: 'bottom',
        required: false,
        components: ['links', 'copyright', 'social']
      })
    }
    
    return {
      sections,
      layout: structure.sidebar ? 'sidebar' : 'standard',
      responsive: true
    }
  }

  /**
   * Build component tree
   */
  private buildComponentTree(
    components: ComponentSpecification[],
    hierarchy: any
  ): ComponentTreeNode {
    const root: ComponentTreeNode = {
      id: 'root',
      name: 'App',
      type: 'container',
      children: [],
      props: {},
      level: 0
    }
    
    // Group components by type and level
    const groupedComponents = this.groupComponentsByLevel(components, hierarchy)
    
    // Build tree structure
    this.buildTreeRecursive(root, groupedComponents, 1)
    
    return root
  }

  /**
   * Wire component interactions
   */
  private wireInteractions(interactions: any[]): ComponentInteraction[] {
    return interactions.map(interaction => ({
      id: this.generateInteractionId(),
      type: interaction.type,
      source: interaction.trigger,
      target: interaction.action,
      handler: this.generateInteractionHandler(interaction),
      dependencies: this.getInteractionDependencies(interaction)
    }))
  }

  /**
   * Setup data flow between components
   */
  private setupDataFlow(dataFlow: any): DataFlowSetup {
    const flows: DataFlowConnection[] = []
    
    dataFlow.sources.forEach((source: string) => {
      dataFlow.destinations.forEach((destination: string) => {
        flows.push({
          from: source,
          to: destination,
          type: dataFlow.direction === 'bidirectional' ? 'bidirectional' : 'unidirectional',
          transform: this.generateDataTransform(source, destination)
        })
      })
    })
    
    return {
      connections: flows,
      stateManagement: this.determineStateManagement(flows),
      providers: this.generateProviders(flows)
    }
  }

  /**
   * Generate composed interface code
   */
  private generateComposedCode(
    structure: InterfaceStructure,
    componentTree: ComponentTreeNode,
    interactions: ComponentInteraction[]
  ): string {
    const imports = this.generateComposedImports(componentTree, interactions)
    const interfaces = this.generateComposedInterfaces(structure)
    const component = this.generateComposedComponent(structure, componentTree, interactions)
    
    return `${imports}\n\n${interfaces}\n\n${component}`
  }

  /**
   * Generate imports for composed interface
   */
  private generateComposedImports(
    componentTree: ComponentTreeNode,
    interactions: ComponentInteraction[]
  ): string {
    const imports = [
      `'use client'`,
      ``,
      `import React, { useState, useEffect, useCallback } from 'react'`,
      `import { cn } from '@/lib/utils'`
    ]
    
    // Add component imports
    const componentImports = this.extractComponentImports(componentTree)
    imports.push(...componentImports)
    
    // Add interaction imports
    const interactionImports = this.extractInteractionImports(interactions)
    imports.push(...interactionImports)
    
    return imports.join('\n')
  }

  /**
   * Generate interfaces for composed component
   */
  private generateComposedInterfaces(structure: InterfaceStructure): string {
    const sectionInterfaces = structure.sections.map(section => 
      `interface ${this.toPascalCase(section.name)}Props {
  className?: string
  children?: React.ReactNode
}`
    ).join('\n\n')
    
    const mainInterface = `interface ComposedInterfaceProps {
  className?: string
  data?: any
  onInteraction?: (type: string, data: any) => void
}`
    
    return `${sectionInterfaces}\n\n${mainInterface}`
  }

  /**
   * Generate main composed component
   */
  private generateComposedComponent(
    structure: InterfaceStructure,
    componentTree: ComponentTreeNode,
    interactions: ComponentInteraction[]
  ): string {
    const stateManagement = this.generateStateManagement(interactions)
    const interactionHandlers = this.generateInteractionHandlers(interactions)
    const componentRender = this.generateComponentRender(structure, componentTree)
    
    return `export default function ComposedInterface({
  className,
  data,
  onInteraction
}: ComposedInterfaceProps) {
${stateManagement}

${interactionHandlers}

  return (
    <div className={cn('min-h-screen bg-background', className)}>
${componentRender}
    </div>
  )
}`
  }

  /**
   * Generate state management code
   */
  private generateStateManagement(interactions: ComponentInteraction[]): string {
    const states = [
      `  const [loading, setLoading] = useState(false)`,
      `  const [error, setError] = useState<string | null>(null)`,
      `  const [data, setData] = useState<any>(null)`
    ]
    
    // Add interaction-specific states
    interactions.forEach(interaction => {
      if (interaction.type === 'form') {
        states.push(`  const [formData, setFormData] = useState<any>({})`)
      }
      if (interaction.type === 'modal') {
        states.push(`  const [modalOpen, setModalOpen] = useState(false)`)
      }
    })
    
    return states.join('\n')
  }

  /**
   * Generate interaction handlers
   */
  private generateInteractionHandlers(interactions: ComponentInteraction[]): string {
    const handlers = interactions.map(interaction => 
      `  const handle${this.toPascalCase(interaction.type)} = useCallback(${interaction.handler}, [${interaction.dependencies.join(', ')}])`
    )
    
    return handlers.join('\n')
  }

  /**
   * Generate component render structure
   */
  private generateComponentRender(
    structure: InterfaceStructure,
    componentTree: ComponentTreeNode
  ): string {
    const sections = structure.sections.map(section => {
      const sectionName = this.toPascalCase(section.name)
      const sectionClasses = this.getSectionClasses(section)
      
      return `      <${section.type} className="${sectionClasses}">
        <${sectionName} />
      </${section.type}>`
    })
    
    return sections.join('\n')
  }

  /**
   * Group components by hierarchy level
   */
  private groupComponentsByLevel(
    components: ComponentSpecification[],
    hierarchy: any
  ): Map<number, ComponentSpecification[]> {
    const grouped = new Map<number, ComponentSpecification[]>()
    
    components.forEach(component => {
      const level = this.determineComponentLevel(component, hierarchy)
      if (!grouped.has(level)) {
        grouped.set(level, [])
      }
      grouped.get(level)!.push(component)
    })
    
    return grouped
  }

  /**
   * Build tree structure recursively
   */
  private buildTreeRecursive(
    parent: ComponentTreeNode,
    groupedComponents: Map<number, ComponentSpecification[]>,
    level: number
  ): void {
    const componentsAtLevel = groupedComponents.get(level) || []
    
    componentsAtLevel.forEach(component => {
      const node: ComponentTreeNode = {
        id: this.generateNodeId(),
        name: component.name,
        type: component.type,
        children: [],
        props: this.convertPropsToRecord(component.props),
        level
      }
      
      parent.children.push(node)
      
      // Recursively build children
      this.buildTreeRecursive(node, groupedComponents, level + 1)
    })
  }

  /**
   * Generate wrapper code based on type
   */
  private generateWrapperCode(
    wrapperType: string,
    childComponents: ComponentSpecification[]
  ): string {
    switch (wrapperType) {
      case 'layout':
        return this.generateLayoutWrapper(childComponents)
      case 'provider':
        return this.generateProviderWrapper(childComponents)
      case 'container':
        return this.generateContainerWrapper(childComponents)
      case 'modal':
        return this.generateModalWrapper(childComponents)
      default:
        return this.generateDefaultWrapper(childComponents)
    }
  }

  /**
   * Generate layout wrapper
   */
  private generateLayoutWrapper(childComponents: ComponentSpecification[]): string {
    return `export default function LayoutWrapper({ children, className }: WrapperProps) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      <header className="border-b">
        {/* Header content */}
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t mt-auto">
        {/* Footer content */}
      </footer>
    </div>
  )
}`
  }

  /**
   * Generate provider wrapper
   */
  private generateProviderWrapper(childComponents: ComponentSpecification[]): string {
    return `export default function ProviderWrapper({ children }: WrapperProps) {
  return (
    <div className="provider-wrapper">
      {children}
    </div>
  )
}`
  }

  /**
   * Generate container wrapper
   */
  private generateContainerWrapper(childComponents: ComponentSpecification[]): string {
    return `export default function ContainerWrapper({ children, className }: WrapperProps) {
  return (
    <div className={cn('container mx-auto px-4', className)}>
      {children}
    </div>
  )
}`
  }

  /**
   * Generate modal wrapper
   */
  private generateModalWrapper(childComponents: ComponentSpecification[]): string {
    return `export default function ModalWrapper({ children, open, onClose }: ModalWrapperProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        {children}
      </DialogContent>
    </Dialog>
  )
}`
  }

  /**
   * Generate default wrapper
   */
  private generateDefaultWrapper(childComponents: ComponentSpecification[]): string {
    return `export default function Wrapper({ children, className }: WrapperProps) {
  return (
    <div className={cn('wrapper', className)}>
      {children}
    </div>
  )
}`
  }

  // Utility methods
  private generateInteractionId(): string {
    return `interaction_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateNodeId(): string {
    return `node_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateInteractionHandler(interaction: any): string {
    return `(event: any) => {
    console.log('${interaction.type} interaction triggered', event)
    onInteraction?.('${interaction.type}', event)
  }`
  }

  private getInteractionDependencies(interaction: any): string[] {
    return ['onInteraction']
  }

  private generateDataTransform(source: string, destination: string): string {
    return `(data: any) => data`
  }

  private determineStateManagement(flows: DataFlowConnection[]): string {
    return flows.length > 3 ? 'context' : 'local'
  }

  private generateProviders(flows: DataFlowConnection[]): string[] {
    return flows.length > 5 ? ['DataProvider', 'InteractionProvider'] : []
  }

  private extractComponentImports(componentTree: ComponentTreeNode): string[] {
    const imports: string[] = []
    this.traverseTree(componentTree, (node) => {
      if (node.type !== 'container') {
        imports.push(`import ${node.name} from '@/components/${this.toKebabCase(node.name)}'`)
      }
    })
    return [...new Set(imports)]
  }

  private extractInteractionImports(interactions: ComponentInteraction[]): string[] {
    const imports: string[] = []
    interactions.forEach(interaction => {
      if (interaction.type === 'modal') {
        imports.push(`import { Dialog, DialogContent } from '@/components/ui/dialog'`)
      }
    })
    return [...new Set(imports)]
  }

  private traverseTree(node: ComponentTreeNode, callback: (node: ComponentTreeNode) => void): void {
    callback(node)
    node.children.forEach(child => this.traverseTree(child, callback))
  }

  private determineComponentLevel(component: ComponentSpecification, hierarchy: any): number {
    // Simple level determination - could be more sophisticated
    if (component.type === 'navigation') return 1
    if (component.type === 'form') return 2
    if (component.type === 'display') return 2
    return 3
  }

  private convertPropsToRecord(props: any[]): Record<string, any> {
    const record: Record<string, any> = {}
    props.forEach(prop => {
      record[prop.name] = prop.type
    })
    return record
  }

  private getSectionClasses(section: InterfaceSection): string {
    const baseClasses = 'w-full'
    const positionClasses = {
      top: 'border-b',
      bottom: 'border-t mt-auto',
      left: 'border-r',
      right: 'border-l',
      center: 'flex-1'
    }
    
    return `${baseClasses} ${positionClasses[section.position as keyof typeof positionClasses] || ''}`
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[-_](.)/g, (_, char) => char.toUpperCase())
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }
}

// Supporting interfaces
export interface ComposedInterface {
  structure: InterfaceStructure
  componentTree: ComponentTreeNode
  interactions: ComponentInteraction[]
  dataFlow: DataFlowSetup
  code: string
}

export interface ComponentHierarchy {
  tree: ComponentTreeNode
  dependencies: string[]
  renderOrder: string[]
  code: string
}

export interface ComponentWrapper {
  type: string
  code: string
  props: Record<string, any>
  styling: string
  children: ComponentSpecification[]
}

interface InterfaceStructure {
  sections: InterfaceSection[]
  layout: 'standard' | 'sidebar' | 'dashboard'
  responsive: boolean
}

interface InterfaceSection {
  name: string
  type: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  required: boolean
  components: string[]
}

interface ComponentTreeNode {
  id: string
  name: string
  type: string
  children: ComponentTreeNode[]
  props: Record<string, any>
  level: number
}

interface ComponentInteraction {
  id: string
  type: string
  source: string
  target: string
  handler: string
  dependencies: string[]
}

interface DataFlowSetup {
  connections: DataFlowConnection[]
  stateManagement: string
  providers: string[]
}

interface DataFlowConnection {
  from: string
  to: string
  type: 'unidirectional' | 'bidirectional'
  transform: string
}

interface WrapperProps {
  children: React.ReactNode
  className?: string
}

interface ModalWrapperProps extends WrapperProps {
  open: boolean
  onClose: () => void
}