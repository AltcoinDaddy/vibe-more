import { describe, it, expect, beforeEach } from 'vitest'
import { apiRouteGenerator } from '../api-route-generator'
import { backendLogicGenerator } from '../backend-logic-generator'
import { securityMiddleware } from '../auth-security'
import { APIRouteSpecification } from '../vibesdk'

describe('API Route Generation System', () => {
  describe('API Route Generator', () => {
    it('should generate a basic API route', () => {
      const spec: APIRouteSpecification = {
        path: '/api/nft/mint',
        methods: ['POST'],
        contractCalls: [{
          contractName: 'TestNFT',
          functionName: 'mintNFT',
          parameters: [
            { name: 'recipient', type: 'Address', required: true },
            { name: 'name', type: 'String', required: true }
          ],
          returnType: 'Void'
        }],
        validation: {
          body: {
            recipient: { type: 'string' },
            name: { type: 'string' }
          }
        },
        authentication: true
      }

      const result = apiRouteGenerator.generateRoute(spec)

      expect(result.filename).toBe('app/api/nft/mint/route.ts')
      expect(result.endpoint).toBe('/api/nft/mint')
      expect(result.methods).toEqual(['POST'])
      expect(result.contractCalls).toEqual(['TestNFT.mintNFT'])
      expect(result.code).toContain('export async function POST')
      expect(result.code).toContain('import { z } from "zod"')
      expect(result.code).toContain('verifyAuth')
    })

    it('should generate multiple routes from contract code', () => {
      const contractCode = `
        access(all) contract TestContract {
          access(all) fun mintNFT(recipient: Address, name: String): Void {}
          access(all) fun getNFT(id: UInt64): String {}
          access(self) fun privateFunction(): Void {}
        }
      `

      const routes = apiRouteGenerator.generateRoutesFromContract(contractCode, 'TestContract')

      expect(routes).toHaveLength(2) // Only public functions
      
      const mintRoute = routes.find(r => r.endpoint.includes('mintnft'))
      const getRoute = routes.find(r => r.endpoint.includes('getnft'))

      expect(mintRoute).toBeDefined()
      expect(getRoute).toBeDefined()
      expect(mintRoute?.methods).toEqual(['POST'])
      expect(getRoute?.methods).toEqual(['GET'])
    })

    it('should handle validation schemas correctly', () => {
      const spec: APIRouteSpecification = {
        path: '/api/test',
        methods: ['POST'],
        contractCalls: [],
        validation: {
          body: {
            email: { type: 'email' },
            amount: { type: 'number', min: 0, max: 1000 }
          }
        },
        authentication: false
      }

      const result = apiRouteGenerator.generateRoute(spec)

      expect(result.code).toContain('z.string().email()')
      expect(result.code).toContain('z.number().min(0).max(1000)')
    })
  })

  describe('Backend Logic Generator', () => {
    it('should generate complete backend logic', () => {
      const contractCode = `
        access(all) contract TestContract {
          access(all) fun mintToken(recipient: Address, amount: UFix64): Void {}
          access(all) fun getBalance(address: Address): UFix64 {}
        }
      `

      const options = {
        contractName: 'TestContract',
        contractAddress: '0x1234567890123456',
        network: 'testnet' as const,
        authenticationRequired: true,
        rateLimiting: true,
        caching: true
      }

      const result = backendLogicGenerator.generateBackendLogic(contractCode, options)

      expect(result.transactionHandlers).toHaveLength(2)
      expect(result.walletIntegration).toContain('WalletSession')
      expect(result.authenticationMiddleware).toContain('withAuth')
      expect(result.errorHandling).toContain('handleTransactionError')
      expect(result.utilities).toHaveLength(2)
    })

    it('should generate transaction handlers with proper authentication', () => {
      const contractCode = `
        access(all) contract TestContract {
          access(all) fun mintNFT(recipient: Address): Void {}
        }
      `

      const options = {
        contractName: 'TestContract',
        contractAddress: '0x1234567890123456',
        network: 'testnet' as const,
        authenticationRequired: true,
        rateLimiting: false,
        caching: false
      }

      const result = backendLogicGenerator.generateBackendLogic(contractCode, options)
      const handler = result.transactionHandlers[0]

      expect(handler).toContain('handleMintNFT')
      expect(handler).toContain('getSessionFromRequest')
      expect(handler).toContain('AUTH_REQUIRED')
      expect(handler).toContain('executeTransaction')
    })

    it('should generate read operations as script calls', () => {
      const contractCode = `
        access(all) contract TestContract {
          access(all) fun getTokenBalance(address: Address): UFix64 {}
        }
      `

      const options = {
        contractName: 'TestContract',
        contractAddress: '0x1234567890123456',
        network: 'testnet' as const,
        authenticationRequired: false,
        rateLimiting: false,
        caching: false
      }

      const result = backendLogicGenerator.generateBackendLogic(contractCode, options)
      const handler = result.transactionHandlers[0]

      expect(handler).toContain('handleGetTokenBalance')
      expect(handler).toContain('executeScript')
      expect(handler).not.toContain('executeTransaction')
      expect(handler).not.toContain('AUTH_REQUIRED')
    })
  })

  describe('Security Middleware', () => {
    it('should generate proper security headers', () => {
      const headers = securityMiddleware.getSecurityHeaders()

      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
    })

    it('should handle rate limiting', () => {
      const mockRequest = {
        headers: new Map([
          ['x-forwarded-for', '192.168.1.1']
        ])
      } as any

      const result1 = securityMiddleware.checkRateLimit(mockRequest)
      expect(result1.allowed).toBe(true)
      expect(result1.headers['X-RateLimit-Remaining']).toBe('99')

      // Simulate many requests
      for (let i = 0; i < 100; i++) {
        securityMiddleware.checkRateLimit(mockRequest)
      }

      const result2 = securityMiddleware.checkRateLimit(mockRequest)
      expect(result2.allowed).toBe(false)
      expect(result2.headers['Retry-After']).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should generate a complete API route with all features', () => {
      const spec: APIRouteSpecification = {
        path: '/api/marketplace/list',
        methods: ['POST'],
        contractCalls: [{
          contractName: 'NFTMarketplace',
          functionName: 'listForSale',
          parameters: [
            { name: 'tokenID', type: 'UInt64', required: true },
            { name: 'price', type: 'UFix64', required: true }
          ],
          returnType: 'Void'
        }],
        validation: {
          body: {
            tokenID: { type: 'number', min: 1 },
            price: { type: 'number', min: 0.01 }
          }
        },
        authentication: true
      }

      const route = apiRouteGenerator.generateRoute(spec)

      // Verify route structure
      expect(route.filename).toBe('app/api/marketplace/list/route.ts')
      expect(route.code).toContain('import { NextRequest, NextResponse }')
      expect(route.code).toContain('import { z } from "zod"')
      expect(route.code).toContain('import { verifyAuth }')
      expect(route.code).toContain('import { flowClient }')

      // Verify validation
      expect(route.code).toContain('BodySchema')
      expect(route.code).toContain('z.number().min(1)')
      expect(route.code).toContain('z.number().min(0.01)')

      // Verify authentication
      expect(route.code).toContain('verifyAuth(request)')
      expect(route.code).toContain('Unauthorized')

      // Verify Flow integration
      expect(route.code).toContain('executeTransaction')
      expect(route.code).toContain('NFTMarketplace.listForSale')

      // Verify error handling
      expect(route.code).toContain('handleAPIError')
      expect(route.code).toContain('ZodError')
    })

    it('should generate backend logic that integrates with API routes', () => {
      const contractCode = `
        access(all) contract NFTMarketplace {
          access(all) fun listForSale(tokenID: UInt64, price: UFix64): Void {}
          access(all) fun purchase(tokenID: UInt64): Void {}
          access(all) fun getListings(): [UInt64] {}
        }
      `

      const options = {
        contractName: 'NFTMarketplace',
        contractAddress: '0x1234567890123456',
        network: 'testnet' as const,
        authenticationRequired: true,
        rateLimiting: true,
        caching: true
      }

      const backendLogic = backendLogicGenerator.generateBackendLogic(contractCode, options)

      // Verify transaction handlers
      expect(backendLogic.transactionHandlers).toHaveLength(3)
      
      const listHandler = backendLogic.transactionHandlers.find(h => h.includes('handleListForSale'))
      const purchaseHandler = backendLogic.transactionHandlers.find(h => h.includes('handlePurchase'))
      const getHandler = backendLogic.transactionHandlers.find(h => h.includes('handleGetListings'))

      expect(listHandler).toBeDefined()
      expect(purchaseHandler).toBeDefined()
      expect(getHandler).toBeDefined()

      // Verify write operations use transactions
      expect(listHandler).toContain('executeTransaction')
      expect(purchaseHandler).toContain('executeTransaction')

      // Verify read operations use scripts
      expect(getHandler).toContain('executeScript')

      // Verify authentication integration
      expect(backendLogic.authenticationMiddleware).toContain('withAuth')
      expect(backendLogic.walletIntegration).toContain('authenticateWallet')

      // Verify error handling
      expect(backendLogic.errorHandling).toContain('handleTransactionError')
      expect(backendLogic.errorHandling).toContain('INSUFFICIENT_BALANCE')
    })
  })
})