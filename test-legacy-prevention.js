#!/usr/bin/env node

// Simple test to verify our legacy prevention system is working
const { RealtimeValidator } = require('./lib/migration/realtime-validator.js');

async function testLegacyPrevention() {
  console.log('🧪 Testing Legacy Prevention System...\n');
  
  const validator = new RealtimeValidator();
  
  // Test 1: Legacy code should be rejected
  const legacyCode = `pub contract TestContract {
    pub var balance: UFix64
    
    pub fun deposit() {
      account.save(<-resource, to: /storage/path)
    }
  }`;
  
  console.log('Test 1: Legacy Code Detection');
  console.log('Code:', legacyCode.substring(0, 50) + '...');
  
  try {
    const result = await validator.validateUserInput(legacyCode);
    console.log('✅ Legacy patterns detected:', result.hasLegacyPatterns);
    console.log('✅ Pattern count:', result.patterns.length);
    console.log('✅ Suggestions provided:', result.suggestions.length > 0);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Modern code should be accepted
  const modernCode = `access(all) contract ModernContract {
    access(all) var balance: UFix64
    
    access(all) fun deposit() {
      account.storage.save(<-resource, to: /storage/path)
    }
  }`;
  
  console.log('Test 2: Modern Code Acceptance');
  console.log('Code:', modernCode.substring(0, 50) + '...');
  
  try {
    const result = await validator.validateUserInput(modernCode);
    console.log('✅ No legacy patterns:', !result.hasLegacyPatterns);
    console.log('✅ Code is valid:', result.isValid);
    console.log('✅ Pattern count:', result.patterns.length);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n🎉 Legacy Prevention System Test Complete!');
}

testLegacyPrevention().catch(console.error);