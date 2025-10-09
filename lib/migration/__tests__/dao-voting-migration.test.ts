/**
 * Integration tests for DAO voting template migration
 * Validates that the migrated template maintains original functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CadenceTemplateMigrator } from '../template-migrator'
import { CadenceSyntaxTransformer } from '../syntax-transformer'
import { Template } from '../../templates'
import { MigrationLogger } from '../logger'

describe('DAO Voting Template Migration', () => {
  let migrator: CadenceTemplateMigrator
  let transformer: CadenceSyntaxTransformer
  let logger: MigrationLogger

  // Original legacy DAO voting template
  const originalDAOTemplate: Template = {
    id: "dao-voting-legacy",
    name: "DAO Voting System (Legacy)",
    description: "Legacy DAO voting template with old syntax",
    category: "dao",
    tags: ["DAO", "Governance", "Voting"],
    author: "VibeMore",
    downloads: 750,
    featured: false,
    code: `pub contract DAOVoting {
    pub var proposalCount: UInt64

    pub event ProposalCreated(id: UInt64, title: String, creator: Address?)
    pub event VoteCast(proposalId: UInt64, voter: Address?, support: Bool)
    pub event ProposalExecuted(id: UInt64)

    pub struct Proposal {
        pub let id: UInt64
        pub let title: String
        pub let description: String
        pub let creator: Address
        pub var votesFor: UInt64
        pub var votesAgainst: UInt64
        pub var executed: Bool
        pub let createdAt: UFix64

        init(id: UInt64, title: String, description: String, creator: Address) {
            self.id = id
            self.title = title
            self.description = description
            self.creator = creator
            self.votesFor = 0
            self.votesAgainst = 0
            self.executed = false
            self.createdAt = getCurrentBlock().timestamp
        }

        pub fun addVote(support: Bool) {
            if support {
                self.votesFor = self.votesFor + 1
            } else {
                self.votesAgainst = self.votesAgainst + 1
            }
        }

        pub fun execute() {
            self.executed = true
        }
    }

    access(self) var proposals: {UInt64: Proposal}
    access(self) var hasVoted: {UInt64: {Address: Bool}}

    pub fun createProposal(title: String, description: String, creator: Address): UInt64 {
        let proposal = Proposal(
            id: self.proposalCount,
            title: title,
            description: description,
            creator: creator
        )
        self.proposals[self.proposalCount] = proposal
        self.hasVoted[self.proposalCount] = {}
        emit ProposalCreated(id: self.proposalCount, title: title, creator: creator)
        self.proposalCount = self.proposalCount + 1
        return proposal.id
    }

    pub fun vote(proposalId: UInt64, voter: Address, support: Bool) {
        pre {
            self.proposals[proposalId] != nil: "Proposal does not exist"
            self.hasVoted[proposalId]![voter] == nil: "Already voted"
        }

        let proposal = self.proposals[proposalId]!
        proposal.addVote(support: support)
        self.proposals[proposalId] = proposal
        self.hasVoted[proposalId]!.insert(key: voter, true)
        emit VoteCast(proposalId: proposalId, voter: voter, support: support)
    }

    pub fun getProposal(id: UInt64): Proposal? {
        return self.proposals[id]
    }

    pub fun getAllProposals(): [Proposal] {
        return self.proposals.values
    }

    init() {
        self.proposalCount = 0
        self.proposals = {}
        self.hasVoted = {}
    }
}`
  }

  beforeEach(() => {
    logger = new MigrationLogger()
    migrator = new CadenceTemplateMigrator(logger)
    transformer = new CadenceSyntaxTransformer(logger)
  })

  describe('Syntax Transformation', () => {
    it('should transform all pub keywords to access(all)', () => {
      const transformedCode = transformer.transformAccessModifiers(originalDAOTemplate.code)
      
      // Should not contain any pub keywords followed by Cadence keywords
      expect(transformedCode).not.toMatch(/\bpub\s+(?:var|let|fun|resource|struct|contract|interface)/)
      
      // Should contain access(all) modifiers
      expect(transformedCode).toContain('access(all) contract DAOVoting')
      expect(transformedCode).toContain('access(all) var proposalCount')
      expect(transformedCode).toContain('access(all) event ProposalCreated')
      expect(transformedCode).toContain('access(all) struct Proposal')
      expect(transformedCode).toContain('access(all) fun createProposal')
      expect(transformedCode).toContain('access(all) fun vote')
    })

    it('should add view modifiers to getter functions', () => {
      // First transform access modifiers, then function signatures
      let transformedCode = transformer.transformAccessModifiers(originalDAOTemplate.code)
      transformedCode = transformer.transformFunctionSignatures(transformedCode)
      
      // Should add view modifier to getter functions
      expect(transformedCode).toContain('access(all) view fun getProposal')
      expect(transformedCode).toContain('access(all) view fun getAllProposals')
    })

    it('should preserve struct field access modifiers', () => {
      const transformedCode = transformer.transformAll(originalDAOTemplate.code)
      
      // Struct fields should have access(all) modifiers
      expect(transformedCode).toContain('access(all) let id: UInt64')
      expect(transformedCode).toContain('access(all) let title: String')
      expect(transformedCode).toContain('access(all) var votesFor: UInt64')
      expect(transformedCode).toContain('access(all) var executed: Bool')
    })

    it('should preserve access(self) modifiers', () => {
      const transformedCode = transformer.transformAll(originalDAOTemplate.code)
      
      // Should preserve existing access(self) modifiers
      expect(transformedCode).toContain('access(self) var proposals')
      expect(transformedCode).toContain('access(self) var hasVoted')
    })
  })

  describe('Template Migration', () => {
    it('should successfully migrate the DAO voting template', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      
      expect(migratedTemplate).toBeDefined()
      expect(migratedTemplate.id).toBe(originalDAOTemplate.id)
      expect(migratedTemplate.name).toBe(originalDAOTemplate.name)
      expect(migratedTemplate.category).toBe(originalDAOTemplate.category)
    })

    it('should update template metadata', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      
      // Should add Cadence 1.0 tag
      expect(migratedTemplate.tags).toContain('Cadence 1.0')
      
      // Should update description
      expect(migratedTemplate.description).toContain('Cadence 1.0 compatibility')
    })

    it('should preserve all original functionality', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      
      // Should contain all essential contract elements
      expect(migratedTemplate.code).toContain('contract DAOVoting')
      expect(migratedTemplate.code).toContain('struct Proposal')
      expect(migratedTemplate.code).toContain('fun createProposal')
      expect(migratedTemplate.code).toContain('fun vote')
      expect(migratedTemplate.code).toContain('fun getProposal')
      expect(migratedTemplate.code).toContain('fun getAllProposals')
      
      // Should preserve events
      expect(migratedTemplate.code).toContain('event ProposalCreated')
      expect(migratedTemplate.code).toContain('event VoteCast')
      expect(migratedTemplate.code).toContain('event ProposalExecuted')
      
      // Should preserve state variables
      expect(migratedTemplate.code).toContain('var proposalCount: UInt64')
      expect(migratedTemplate.code).toContain('var proposals: {UInt64: Proposal}')
      expect(migratedTemplate.code).toContain('var hasVoted: {UInt64: {Address: Bool}}')
    })
  })

  describe('Template Validation', () => {
    it('should validate the migrated template successfully', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      const validationResult = migrator.validateTemplate(migratedTemplate)
      
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.errors).toHaveLength(0)
      expect(validationResult.compilationSuccess).toBe(true)
    })

    it('should detect legacy syntax in original template', () => {
      const validationResult = migrator.validateTemplate(originalDAOTemplate)
      
      expect(validationResult.isValid).toBe(false)
      expect(validationResult.errors.length).toBeGreaterThan(0)
      expect(validationResult.errors.some(error => error.includes('pub keyword usage'))).toBe(true)
    })

    it('should not detect legacy syntax in migrated template', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      const validationResult = migrator.validateTemplate(migratedTemplate)
      
      // Should not have any legacy syntax errors
      const hasLegacySyntaxErrors = validationResult.errors.some(error => 
        error.includes('pub keyword usage') || 
        error.includes('Legacy syntax found')
      )
      expect(hasLegacySyntaxErrors).toBe(false)
    })
  })

  describe('Voting Logic Preservation', () => {
    it('should preserve proposal creation logic', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      
      // Should contain proposal creation logic
      expect(migratedTemplate.code).toContain('let proposal = Proposal(')
      expect(migratedTemplate.code).toContain('self.proposals[self.proposalCount] = proposal')
      expect(migratedTemplate.code).toContain('self.hasVoted[self.proposalCount] = {}')
      expect(migratedTemplate.code).toContain('emit ProposalCreated')
      expect(migratedTemplate.code).toContain('self.proposalCount = self.proposalCount + 1')
    })

    it('should preserve voting logic', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      
      // Should contain voting logic with preconditions
      expect(migratedTemplate.code).toContain('pre {')
      expect(migratedTemplate.code).toContain('self.proposals[proposalId] != nil: "Proposal does not exist"')
      expect(migratedTemplate.code).toContain('self.hasVoted[proposalId]![voter] == nil: "Already voted"')
      expect(migratedTemplate.code).toContain('proposal.addVote(support: support)')
      expect(migratedTemplate.code).toContain('emit VoteCast')
    })

    it('should preserve proposal struct functionality', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      
      // Should contain all proposal fields
      expect(migratedTemplate.code).toContain('let id: UInt64')
      expect(migratedTemplate.code).toContain('let title: String')
      expect(migratedTemplate.code).toContain('let description: String')
      expect(migratedTemplate.code).toContain('let creator: Address')
      expect(migratedTemplate.code).toContain('var votesFor: UInt64')
      expect(migratedTemplate.code).toContain('var votesAgainst: UInt64')
      expect(migratedTemplate.code).toContain('var executed: Bool')
      expect(migratedTemplate.code).toContain('let createdAt: UFix64')
      
      // Should contain proposal methods
      expect(migratedTemplate.code).toContain('fun addVote(support: Bool)')
      expect(migratedTemplate.code).toContain('fun execute()')
    })

    it('should preserve initialization logic', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      
      // Should contain proper initialization
      expect(migratedTemplate.code).toContain('init() {')
      expect(migratedTemplate.code).toContain('self.proposalCount = 0')
      expect(migratedTemplate.code).toContain('self.proposals = {}')
      expect(migratedTemplate.code).toContain('self.hasVoted = {}')
    })
  })

  describe('Migration Statistics', () => {
    it('should provide accurate migration statistics', () => {
      const migratedTemplate = migrator.migrateTemplate(originalDAOTemplate)
      const stats = migrator.getTemplateMigrationStats(originalDAOTemplate, migratedTemplate)
      
      expect(stats.templateId).toBe(originalDAOTemplate.id)
      expect(stats.templateName).toBe(originalDAOTemplate.name)
      expect(stats.hasChanges).toBe(true)
      expect(stats.originalLines).toBeGreaterThan(0)
      expect(stats.migratedLines).toBeGreaterThan(0)
      expect(stats.originalSize).toBeGreaterThan(0)
      expect(stats.migratedSize).toBeGreaterThan(0)
    })
  })
})