import { GeneratedContract, GeneratedComponent, GeneratedAPIRoute, GeneratedConfig } from './vibesdk'

/**
 * Dependency resolution result
 */
export interface DependencyResolutionResult {
  success: boolean
  resolvedDependencies: ResolvedDependency[]
  unresolvedDependencies: UnresolvedDependency[]
  conflicts: DependencyConflict[]
  suggestions: DependencySuggestion[]
}

/**
 * Resolved dependency information
 */
export interface ResolvedDependency {
  name: string
  version: string
  type: 'npm' | 'internal' | 'contract'
  source: string
  requiredBy: string[]
}

/**
 * Unresolved dependency information
 */
export interface UnresolvedDependency {
  name: string
  requiredBy: string
  reason: 'not_found' | 'version_conflict' | 'circular_reference'
  suggestion?: string
}

/**
 * Dependency conflict information
 */
export interface DependencyConflict {
  name: string
  versions: string[]
  components: string[]
  resolution: 'use_latest' | 'use_specific' | 'manual_resolution'
  recommendedVersion?: string
}

/**
 * Dependency suggestion
 */
export interface DependencySuggestion {
  type: 'optimization' | 'security' | 'performance' | 'maintenance'
  dependency: string
  message: string
  action: 'update' | 'remove' | 'replace' | 'add'
  details?: string
}

/**
 * Import statement information
 */
export interface ImportStatement {
  source: string
  imports: string[]
  type: 'named' | 'default' | 'namespace' | 'side_effect'
  isTypeOnly: boolean
}

/**
 * Automatic dependency manager for full-stack projects
 * Manages imports and dependencies across contracts, components, and API routes
 */
export class DependencyManager {

  /**
   * Resolve and manage all dependencies in the project
   */
  async resolveDependencies(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[],
    configs: GeneratedConfig[]
  ): Promise<DependencyResolutionResult> {
    const resolvedDependencies: ResolvedDependency[] = []
    const unresolvedDependencies: UnresolvedDependency[] = []
    const conflicts: DependencyConflict[] = []
    const suggestions: DependencySuggestion[] = []

    // Extract all dependencies from components
    const allDependencies = this.extractAllDependencies(contracts, components, apiRoutes)

    // Resolve NPM dependencies
    const npmResolution = await this.resolveNpmDependencies(allDependencies)
    resolvedDependencies.push(...npmResolution.resolved)
    unresolvedDependencies.push(...npmResolution.unresolved)
    conflicts.push(...npmResolution.conflicts)

    // Resolve internal dependencies
    const internalResolution = await this.resolveInternalDependencies(contracts, components, apiRoutes)
    resolvedDependencies.push(...internalResolution.resolved)
    unresolvedDependencies.push(...internalResolution.unresolved)

    // Generate optimization suggestions
    suggestions.push(...await this.generateDependencySuggestions(resolvedDependencies, allDependencies))

    return {
      success: unresolvedDependencies.length === 0 && conflicts.length === 0,
      resolvedDependencies,
      unresolvedDependencies,
      conflicts,
      suggestions
    }
  }

  /**
   * Automatically fix import statements in components
   */
  async fixImports(
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Promise<{ components: GeneratedComponent[], apiRoutes: GeneratedAPIRoute[] }> {
    const fixedComponents = await Promise.all(
      components.map(async (component) => ({
        ...component,
        code: await this.fixImportsInCode(component.code, component.filename)
      }))
    )

    const fixedApiRoutes = await Promise.all(
      apiRoutes.map(async (route) => ({
        ...route,
        code: await this.fixImportsInCode(route.code, route.filename)
      }))
    )

    return {
      components: fixedComponents,
      apiRoutes: fixedApiRoutes
    }
  }

  /**
   * Generate optimized import statements
   */
  generateOptimizedImports(dependencies: string[], filename: string): string[] {
    const imports: string[] = []
    const groupedImports = this.groupImportsBySource(dependencies)

    // React imports
    if (groupedImports.react.length > 0) {
      const reactImports = groupedImports.react.join(', ')
      imports.push(`import React, { ${reactImports} } from 'react'`)
    }

    // Next.js imports
    if (groupedImports.next.length > 0) {
      groupedImports.next.forEach(imp => {
        imports.push(`import { ${imp.imports.join(', ')} } from '${imp.source}'`)
      })
    }

    // UI component imports
    if (groupedImports.ui.length > 0) {
      groupedImports.ui.forEach(imp => {
        imports.push(`import { ${imp.imports.join(', ')} } from '${imp.source}'`)
      })
    }

    // Form handling imports
    if (groupedImports.forms.length > 0) {
      groupedImports.forms.forEach(imp => {
        imports.push(`import { ${imp.imports.join(', ')} } from '${imp.source}'`)
      })
    }

    // Flow blockchain imports
    if (groupedImports.flow.length > 0) {
      groupedImports.flow.forEach(imp => {
        imports.push(`import { ${imp.imports.join(', ')} } from '${imp.source}'`)
      })
    }

    // Internal imports
    if (groupedImports.internal.length > 0) {
      groupedImports.internal.forEach(imp => {
        imports.push(`import { ${imp.imports.join(', ')} } from '${imp.source}'`)
      })
    }

    // External library imports
    if (groupedImports.external.length > 0) {
      groupedImports.external.forEach(imp => {
        imports.push(`import { ${imp.imports.join(', ')} } from '${imp.source}'`)
      })
    }

    return imports
  }

  /**
   * Extract all dependencies from project components
   */
  private extractAllDependencies(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Map<string, string[]> {
    const dependencies = new Map<string, string[]>()

    // Extract from contracts
    contracts.forEach(contract => {
      dependencies.set(contract.filename, contract.dependencies)
    })

    // Extract from components
    components.forEach(component => {
      const extractedDeps = this.extractDependenciesFromCode(component.code)
      dependencies.set(component.filename, [...component.dependencies, ...extractedDeps])
    })

    // Extract from API routes
    apiRoutes.forEach(route => {
      const extractedDeps = this.extractDependenciesFromCode(route.code)
      dependencies.set(route.filename, extractedDeps)
    })

    return dependencies
  }

  /**
   * Resolve NPM dependencies
   */
  private async resolveNpmDependencies(
    allDependencies: Map<string, string[]>
  ): Promise<{
    resolved: ResolvedDependency[]
    unresolved: UnresolvedDependency[]
    conflicts: DependencyConflict[]
  }> {
    const resolved: ResolvedDependency[] = []
    const unresolved: UnresolvedDependency[] = []
    const conflicts: DependencyConflict[] = []

    const npmDependencies = new Map<string, Set<string>>()

    // Collect all NPM dependencies
    for (const [filename, deps] of Array.from(allDependencies.entries())) {
      for (const dep of deps) {
        if (this.isNpmDependency(dep)) {
          if (!npmDependencies.has(dep)) {
            npmDependencies.set(dep, new Set())
          }
          npmDependencies.get(dep)!.add(filename)
        }
      }
    }

    // Resolve each NPM dependency
    for (const [depName, requiredBy] of Array.from(npmDependencies.entries())) {
      const version = this.getRecommendedVersion(depName)
      
      if (version) {
        resolved.push({
          name: depName,
          version,
          type: 'npm',
          source: 'npm',
          requiredBy: Array.from(requiredBy)
        })
      } else {
        unresolved.push({
          name: depName,
          requiredBy: Array.from(requiredBy).join(', '),
          reason: 'not_found',
          suggestion: `Install ${depName} using: npm install ${depName}`
        })
      }
    }

    return { resolved, unresolved, conflicts }
  }

  /**
   * Resolve internal dependencies
   */
  private async resolveInternalDependencies(
    contracts: GeneratedContract[],
    components: GeneratedComponent[],
    apiRoutes: GeneratedAPIRoute[]
  ): Promise<{
    resolved: ResolvedDependency[]
    unresolved: UnresolvedDependency[]
  }> {
    const resolved: ResolvedDependency[] = []
    const unresolved: UnresolvedDependency[] = []

    const allFiles = new Set([
      ...contracts.map(c => c.filename),
      ...components.map(c => c.filename),
      ...apiRoutes.map(r => r.filename)
    ])

    // Check internal dependencies
    const allDependencies = this.extractAllDependencies(contracts, components, apiRoutes)
    
    for (const [filename, deps] of Array.from(allDependencies.entries())) {
      for (const dep of deps) {
        if (this.isInternalDependency(dep)) {
          const resolvedPath = this.resolveInternalPath(dep)
          
          if (allFiles.has(resolvedPath) || this.isValidInternalPath(resolvedPath)) {
            resolved.push({
              name: dep,
              version: '1.0.0',
              type: 'internal',
              source: resolvedPath,
              requiredBy: [filename]
            })
          } else {
            unresolved.push({
              name: dep,
              requiredBy: filename,
              reason: 'not_found',
              suggestion: `Create the missing file: ${resolvedPath}`
            })
          }
        }
      }
    }

    return { resolved, unresolved }
  }

  /**
   * Generate dependency optimization suggestions
   */
  private async generateDependencySuggestions(
    resolvedDependencies: ResolvedDependency[],
    allDependencies: Map<string, string[]>
  ): Promise<DependencySuggestion[]> {
    const suggestions: DependencySuggestion[] = []

    // Check for outdated dependencies
    for (const dep of resolvedDependencies) {
      if (dep.type === 'npm' && this.isOutdated(dep.name, dep.version)) {
        suggestions.push({
          type: 'maintenance',
          dependency: dep.name,
          message: `${dep.name} has a newer version available`,
          action: 'update',
          details: `Update to latest version for bug fixes and improvements`
        })
      }
    }

    // Check for unused dependencies
    const usedDependencies = new Set<string>()
    for (const deps of Array.from(allDependencies.values())) {
      deps.forEach(dep => usedDependencies.add(dep))
    }

    for (const dep of resolvedDependencies) {
      if (!usedDependencies.has(dep.name)) {
        suggestions.push({
          type: 'optimization',
          dependency: dep.name,
          message: `${dep.name} appears to be unused`,
          action: 'remove',
          details: 'Remove unused dependencies to reduce bundle size'
        })
      }
    }

    // Suggest bundle optimization
    const heavyDependencies = resolvedDependencies.filter(dep => 
      this.isHeavyDependency(dep.name)
    )

    for (const dep of heavyDependencies) {
      suggestions.push({
        type: 'performance',
        dependency: dep.name,
        message: `${dep.name} is a large dependency`,
        action: 'replace',
        details: 'Consider using a lighter alternative or lazy loading'
      })
    }

    return suggestions
  }

  /**
   * Fix imports in code
   */
  private async fixImportsInCode(code: string, filename: string): Promise<string> {
    const lines = code.split('\n')
    const importLines: string[] = []
    const codeLines: string[] = []
    let inImportSection = true

    for (const line of lines) {
      if (line.trim().startsWith('import ') || line.trim().startsWith('export ')) {
        if (inImportSection) {
          importLines.push(line)
        } else {
          codeLines.push(line)
        }
      } else if (line.trim() === '') {
        if (inImportSection && importLines.length > 0) {
          importLines.push(line)
        } else {
          codeLines.push(line)
        }
      } else {
        inImportSection = false
        codeLines.push(line)
      }
    }

    // Optimize imports
    const optimizedImports = this.optimizeImportStatements(importLines)
    
    return [...optimizedImports, '', ...codeLines].join('\n')
  }

  /**
   * Optimize import statements
   */
  private optimizeImportStatements(importLines: string[]): string[] {
    const imports = importLines
      .filter(line => line.trim().startsWith('import '))
      .map(line => this.parseImportStatement(line))
      .filter(Boolean) as ImportStatement[]

    // Group imports by source
    const groupedImports = new Map<string, ImportStatement[]>()
    
    for (const imp of imports) {
      if (!groupedImports.has(imp.source)) {
        groupedImports.set(imp.source, [])
      }
      groupedImports.get(imp.source)!.push(imp)
    }

    // Generate optimized import statements
    const optimizedImports: string[] = []

    // Sort import groups
    const sortedGroups = Array.from(groupedImports.entries()).sort(([a], [b]) => {
      // React first
      if (a === 'react') return -1
      if (b === 'react') return 1
      
      // Next.js second
      if (a.startsWith('next')) return -1
      if (b.startsWith('next')) return 1
      
      // External libraries
      if (!a.startsWith('@/') && !b.startsWith('@/')) return a.localeCompare(b)
      
      // Internal imports last
      if (a.startsWith('@/') && b.startsWith('@/')) return a.localeCompare(b)
      if (a.startsWith('@/')) return 1
      if (b.startsWith('@/')) return -1
      
      return a.localeCompare(b)
    })

    for (const [source, sourceImports] of sortedGroups) {
      const mergedImports = this.mergeImportsFromSameSource(sourceImports)
      optimizedImports.push(this.formatImportStatement(mergedImports))
    }

    return optimizedImports
  }

  /**
   * Helper methods
   */

  private extractDependenciesFromCode(code: string): string[] {
    const dependencies: string[] = []
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g
    let match

    while ((match = importRegex.exec(code)) !== null) {
      dependencies.push(match[1])
    }

    return dependencies
  }

  private isNpmDependency(dep: string): boolean {
    return !dep.startsWith('@/') && !dep.startsWith('./') && !dep.startsWith('../')
  }

  private isInternalDependency(dep: string): boolean {
    return dep.startsWith('@/') || dep.startsWith('./') || dep.startsWith('../')
  }

  private getRecommendedVersion(depName: string): string | null {
    // Simplified version resolution - in real implementation, check npm registry
    const versions: Record<string, string> = {
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
      'next': '^15.2.4',
      'typescript': '^5.0.0',
      'tailwindcss': '^4.1.9',
      '@onflow/fcl': '^1.12.0',
      '@onflow/types': '^1.4.0',
      'react-hook-form': '^7.60.0',
      'zod': '^3.25.67',
      'lucide-react': '^0.460.0'
    }

    return versions[depName] || null
  }

  private resolveInternalPath(dep: string): string {
    if (dep.startsWith('@/')) {
      return dep.replace('@/', '')
    }
    return dep
  }

  private isValidInternalPath(path: string): boolean {
    // Simplified validation - in real implementation, check file system
    return path.startsWith('components/') || 
           path.startsWith('lib/') || 
           path.startsWith('hooks/') ||
           path.startsWith('app/')
  }

  private isOutdated(name: string, version: string): boolean {
    // Simplified check - in real implementation, check npm registry
    return false
  }

  private isHeavyDependency(name: string): boolean {
    const heavyDeps = ['lodash', 'moment', 'rxjs', 'three']
    return heavyDeps.includes(name)
  }

  private parseImportStatement(line: string): ImportStatement | null {
    const match = line.match(/import\s+(.*?)\s+from\s+['"]([^'"]+)['"]/)
    if (!match) return null

    const [, importPart, source] = match
    const imports: string[] = []
    let type: ImportStatement['type'] = 'named'
    let isTypeOnly = false

    if (importPart.includes('type ')) {
      isTypeOnly = true
    }

    if (importPart.includes('{')) {
      type = 'named'
      const namedImports = importPart.match(/\{([^}]+)\}/)?.[1]
      if (namedImports) {
        imports.push(...namedImports.split(',').map(s => s.trim()))
      }
    } else if (importPart.includes('* as ')) {
      type = 'namespace'
      imports.push(importPart.trim())
    } else {
      type = 'default'
      imports.push(importPart.trim())
    }

    return { source, imports, type, isTypeOnly }
  }

  private mergeImportsFromSameSource(imports: ImportStatement[]): ImportStatement {
    const merged: ImportStatement = {
      source: imports[0].source,
      imports: [],
      type: 'named',
      isTypeOnly: false
    }

    const namedImports = new Set<string>()
    let hasDefault = false
    let hasNamespace = false

    for (const imp of imports) {
      if (imp.type === 'named') {
        imp.imports.forEach(i => namedImports.add(i))
      } else if (imp.type === 'default') {
        hasDefault = true
        merged.imports.push(imp.imports[0])
      } else if (imp.type === 'namespace') {
        hasNamespace = true
        merged.imports.push(imp.imports[0])
      }
    }

    if (namedImports.size > 0) {
      merged.imports.push(`{ ${Array.from(namedImports).sort().join(', ')} }`)
    }

    return merged
  }

  private formatImportStatement(imp: ImportStatement): string {
    return `import ${imp.imports.join(', ')} from '${imp.source}'`
  }

  private groupImportsBySource(dependencies: string[]): {
    react: string[]
    next: Array<{ source: string, imports: string[] }>
    ui: Array<{ source: string, imports: string[] }>
    forms: Array<{ source: string, imports: string[] }>
    flow: Array<{ source: string, imports: string[] }>
    internal: Array<{ source: string, imports: string[] }>
    external: Array<{ source: string, imports: string[] }>
  } {
    return {
      react: dependencies.filter(dep => dep === 'react').map(dep => dep.split('/').pop() || dep),
      next: dependencies.filter(dep => dep.startsWith('next')).map(dep => ({ source: dep, imports: [dep.split('/').pop() || dep] })),
      ui: dependencies.filter(dep => dep.startsWith('@/components/ui')).map(dep => ({ source: dep, imports: [dep.split('/').pop() || dep] })),
      forms: dependencies.filter(dep => dep.includes('form') || dep.includes('zod')).map(dep => ({ source: dep, imports: [dep.split('/').pop() || dep] })),
      flow: dependencies.filter(dep => dep.startsWith('@onflow')).map(dep => ({ source: dep, imports: [dep.split('/').pop() || dep] })),
      internal: dependencies.filter(dep => dep.startsWith('@/')).map(dep => ({ source: dep, imports: [dep.split('/').pop() || dep] })),
      external: dependencies.filter(dep => !dep.startsWith('@/') && !dep.startsWith('next') && dep !== 'react').map(dep => ({ source: dep, imports: [dep.split('/').pop() || dep] }))
    }
  }
}