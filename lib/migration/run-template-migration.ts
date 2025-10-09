/**
 * Script to run template migration and update templates.ts
 * This implements task 5.1: Run template migration for remaining legacy templates
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { TemplateMigrationExecutor } from './execute-template-migration'
import { Template } from '../templates'

async function runTemplateMigration() {
  console.log('🚀 Starting template migration process...')
  
  const executor = new TemplateMigrationExecutor()
  
  try {
    // First, identify templates that need migration
    const templatesNeedingMigration = executor.getTemplatesNeedingMigration()
    
    console.log(`📊 Found ${templatesNeedingMigration.length} templates needing migration:`)
    templatesNeedingMigration.forEach(id => console.log(`  - ${id}`))
    
    if (templatesNeedingMigration.length === 0) {
      console.log('✅ All templates are already using modern Cadence 1.0 syntax!')
      return
    }
    
    // Execute migration for all templates
    console.log('\n🔄 Executing template migrations...')
    const migrationResult = await executor.executeAllTemplateMigrations()
    
    if (migrationResult.success) {
      console.log('✅ Template migration completed successfully!')
      
      // Update templates.ts with migrated templates
      await updateTemplatesFile(migrationResult.migratedTemplates)
      
      console.log(`📈 Migration Statistics:`)
      console.log(`  - Total processed: ${migrationResult.statistics.totalProcessed}`)
      console.log(`  - Successful: ${migrationResult.statistics.successfulMigrations}`)
      console.log(`  - Failed: ${migrationResult.statistics.failedMigrations}`)
      console.log(`  - Transformations applied: ${migrationResult.statistics.transformationsApplied}`)
      
    } else {
      console.log('❌ Template migration completed with errors:')
      migrationResult.errors.forEach(error => console.log(`  - ${error}`))
    }
    
    if (migrationResult.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      migrationResult.warnings.forEach(warning => console.log(`  - ${warning}`))
    }
    
    // Save migration report
    const reportPath = join(process.cwd(), 'migration-report.md')
    writeFileSync(reportPath, migrationResult.migrationReport)
    console.log(`\n📄 Migration report saved to: ${reportPath}`)
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

async function updateTemplatesFile(migratedTemplates: Template[]) {
  console.log('\n📝 Updating templates.ts with migrated templates...')
  
  // Generate the new templates.ts content
  const templatesFileContent = generateTemplatesFileContent(migratedTemplates)
  
  // Write the updated file
  const templatesPath = join(process.cwd(), 'lib', 'templates.ts')
  writeFileSync(templatesPath, templatesFileContent)
  
  console.log('✅ templates.ts updated successfully!')
}

function generateTemplatesFileContent(templates: Template[]): string {
  const content = [
    'export interface Template {',
    '  id: string',
    '  name: string',
    '  description: string',
    '  category: "nft" | "defi" | "dao" | "marketplace" | "token" | "utility"',
    '  tags: string[]',
    '  code: string',
    '  author: string',
    '  downloads: number',
    '  featured: boolean',
    '}',
    '',
    'export const templates: Template[] = ['
  ]
  
  templates.forEach((template, index) => {
    content.push('  {')
    content.push(`    id: "${template.id}",`)
    content.push(`    name: "${template.name}",`)
    content.push(`    description: "${template.description}",`)
    content.push(`    category: "${template.category}",`)
    content.push(`    tags: ${JSON.stringify(template.tags)},`)
    content.push(`    author: "${template.author}",`)
    content.push(`    downloads: ${template.downloads},`)
    content.push(`    featured: ${template.featured},`)
    content.push(`    code: \`${template.code}\`,`)
    content.push(`  }${index < templates.length - 1 ? ',' : ''}`)
  })
  
  content.push(']')
  content.push('')
  content.push('export function getTemplateById(id: string): Template | undefined {')
  content.push('  return templates.find((t) => t.id === id)')
  content.push('}')
  content.push('')
  content.push('export function getTemplatesByCategory(category: string): Template[] {')
  content.push('  return templates.filter((t) => t.category === category)')
  content.push('}')
  content.push('')
  content.push('export function getFeaturedTemplates(): Template[] {')
  content.push('  return templates.filter((t) => t.featured)')
  content.push('}')
  content.push('')
  content.push('export function searchTemplates(query: string): Template[] {')
  content.push('  const lowerQuery = query.toLowerCase()')
  content.push('  return templates.filter(')
  content.push('    (t) =>')
  content.push('      t.name.toLowerCase().includes(lowerQuery) ||')
  content.push('      t.description.toLowerCase().includes(lowerQuery) ||')
  content.push('      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),')
  content.push('  )')
  content.push('}')
  content.push('')
  
  return content.join('\n')
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runTemplateMigration().catch(console.error)
}

export { runTemplateMigration, updateTemplatesFile }