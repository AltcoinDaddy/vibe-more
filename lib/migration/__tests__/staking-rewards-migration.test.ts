/**
 * Integration tests for staking rewards template migration
 * Verifies that the migrated template maintains original functionality
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { CadenceTemplateMigrator } from '../template-migrator'
import { CadenceSyntaxTransformer } from '../syntax-transformer'
import { getTemplateById } from '../../templates'
import { MigrationLogger } from '../logger'

describe('Staking Rewards Template Migration', () => {
  let migrator: CadenceTemplateMigrator
  let transformer: CadenceSyntaxTransformer
  let logger: MigrationLogger

  beforeEach(() => {
    logger = new MigrationLogger()
    migrator = new CadenceTemplateMigrator(logger)
    transformer = new CadenceSyntaxTransformer(logger)
  })

  test('should successfully migrate staking rewards template', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify the template has been migrated
    expect(template.code).not.toContain('pub contract')
    expect(template.code).not.toContain('pub var')
    expect(template.code).not.toContain('pub let')
    expect(template.code).not.toContain('pub fun')
    expect(template.code).not.toContain('pub struct')
    expect(template.code).not.toContain('pub event')
  })

  test('should use modern Cadence 1.0 syntax', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify modern syntax is used
    expect(template.code).toContain('access(all) contract StakingRewards')
    expect(template.code).toContain('access(all) var totalStaked')
    expect(template.code).toContain('access(all) let rewardRate')
    expect(template.code).toContain('access(all) struct StakeInfo')
    expect(template.code).toContain('access(all) event Staked')
    expect(template.code).toContain('access(all) event Withdrawn')
    expect(template.code).toContain('access(all) event RewardPaid')
  })

  test('should have proper access control for staking operations', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify access control patterns
    expect(template.code).toContain('access(all) fun stake')
    expect(template.code).toContain('access(all) fun withdraw')
    expect(template.code).toContain('access(self) var stakes')
  })

  test('should preserve reward calculation and distribution logic', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify core staking logic is preserved
    expect(template.code).toContain('fun calculateReward(user: Address): UFix64')
    expect(template.code).toContain('timeStaked = getCurrentBlock().timestamp - stakeInfo.stakedAt')
    expect(template.code).toContain('reward = stakeInfo.amount * self.rewardRate * timeStaked / 86400.0')
    
    // Verify staking operations
    expect(template.code).toContain('self.totalStaked = self.totalStaked + amount')
    expect(template.code).toContain('emit Staked(user: user, amount: amount)')
    expect(template.code).toContain('emit Withdrawn(user: user, amount: amount)')
  })

  test('should have view functions for read-only operations', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify view functions are properly marked
    expect(template.code).toContain('access(all) view fun calculateReward')
    expect(template.code).toContain('access(all) view fun getStakeInfo')
  })

  test('should maintain proper struct functionality', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify StakeInfo struct maintains functionality
    expect(template.code).toContain('access(all) struct StakeInfo')
    expect(template.code).toContain('access(all) var amount: UFix64')
    expect(template.code).toContain('access(all) var rewardDebt: UFix64')
    expect(template.code).toContain('access(all) let stakedAt: UFix64')
    expect(template.code).toContain('access(all) fun addStake(amount: UFix64)')
    expect(template.code).toContain('access(all) fun removeStake(amount: UFix64)')
  })

  test('should have proper preconditions for staking operations', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify preconditions are maintained
    expect(template.code).toContain('amount > 0.0: "Cannot stake 0 tokens"')
    expect(template.code).toContain('self.stakes[user] != nil: "No stake found"')
    expect(template.code).toContain('self.stakes[user]!.amount >= amount: "Insufficient staked amount"')
  })

  test('should maintain event emission for tracking', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify events are properly defined and emitted
    expect(template.code).toContain('access(all) event Staked(user: Address, amount: UFix64)')
    expect(template.code).toContain('access(all) event Withdrawn(user: Address, amount: UFix64)')
    expect(template.code).toContain('access(all) event RewardPaid(user: Address, reward: UFix64)')
  })

  test('should have updated metadata for Cadence 1.0', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify metadata has been updated
    expect(template.description).toContain('Cadence 1.0 compatibility')
    expect(template.tags).toContain('Cadence 1.0')
  })

  test('should validate successfully after migration', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    const validationResult = migrator.validateTemplate(template)
    
    expect(validationResult.isValid).toBe(true)
    expect(validationResult.errors).toHaveLength(0)
    expect(validationResult.compilationSuccess).toBe(true)
  })

  test('should not contain legacy syntax patterns', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify no legacy patterns remain
    expect(template.code).not.toMatch(/\bpub\s+(?:var|let|fun|resource|struct|contract|interface|event)/)
    expect(template.code).not.toMatch(/\bpub\(set\)\s+/)
    expect(template.code).not.toMatch(/\baccount\.(?:save|load|borrow|copy)\(/)
  })

  test('should maintain initialization logic', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify initialization is preserved
    expect(template.code).toContain('init() {')
    expect(template.code).toContain('self.totalStaked = 0.0')
    expect(template.code).toContain('self.rewardRate = 0.1')
    expect(template.code).toContain('self.stakes = {}')
  })

  test('should preserve reward calculation accuracy', () => {
    const template = getTemplateById('staking-rewards')
    expect(template).toBeDefined()
    
    if (!template) return

    // Verify reward calculation formula is intact
    const rewardCalculationRegex = /reward = stakeInfo\.amount \* self\.rewardRate \* timeStaked \/ 86400\.0/
    expect(template.code).toMatch(rewardCalculationRegex)
    
    // Verify time calculation
    const timeCalculationRegex = /timeStaked = getCurrentBlock\(\)\.timestamp - stakeInfo\.stakedAt/
    expect(template.code).toMatch(timeCalculationRegex)
  })
})