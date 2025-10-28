import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { 
  executeFlowTransaction,
  executeFlowScript,
  isValidFlowAddress,
  convertToCadenceArg,
  createAPIResponse,
  handleFlowError
} from "@/lib/flow-api-integration"
import {
  createSuccessResponse,
  createErrorResponse,
  handleUnknownError,
  APIErrors,
  logRequest,
  addSecurityHeaders,
  addCORSHeaders
} from "@/lib/api-response"

/**
 * Example Generated API Route: NFT Minting
 * This demonstrates the output of the API route generator
 */

// Validation schemas
const MintRequestSchema = z.object({
  recipient: z.string().refine(isValidFlowAddress, "Invalid Flow address"),
  name: z.string().min(1, "NFT name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  thumbnail: z.string().url("Invalid thumbnail URL"),
  metadata: z.record(z.any()).optional(),
  royalties: z.array(z.object({
    receiver: z.string().refine(isValidFlowAddress, "Invalid royalty receiver address"),
    cut: z.number().min(0).max(1, "Royalty cut must be between 0 and 1"),
    description: z.string().optional()
  })).optional()
})

const QuerySchema = z.object({
  recipient: z.string().refine(isValidFlowAddress, "Invalid Flow address").optional()
})

// Flow blockchain integration utilities
async function executeScript({ script, args }: { script: string, args: any[] }) {
  try {
    const result = await executeFlowScript({
      script,
      args
    })
    return result
  } catch (error) {
    throw new Error(`Script execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

async function executeTransaction({ transaction, args, authorizers }: { 
  transaction: string, 
  args: any[], 
  authorizers: string[] 
}) {
  try {
    const result = await executeFlowTransaction({
      transaction,
      args,
      authorizers
    })
    return result
  } catch (error) {
    throw new Error(`Transaction execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Validate request body
    const body = await request.json()
    const validatedBody = MintRequestSchema.parse(body)
    
    // Prepare royalties array
    const royalties = validatedBody.royalties || []
    
    // Execute Flow transaction
    const transactionResult = await executeTransaction({
      transaction: `
        import GeneratedNFT from 0xCONTRACT_ADDRESS
        import NonFungibleToken from 0xNONFUNGIBLETOKEN_ADDRESS
        import MetadataViews from 0xMETADATAVIEWS_ADDRESS
        
        transaction(
          recipient: Address,
          name: String,
          description: String,
          thumbnail: String,
          metadata: {String: AnyStruct},
          royalties: [MetadataViews.Royalty]
        ) {
          let minter: &GeneratedNFT.NFTMinter
          let recipientCollection: &{NonFungibleToken.CollectionPublic}
          
          prepare(signer: &Account) {
            // Get the minter reference
            self.minter = signer.storage.borrow<&GeneratedNFT.NFTMinter>(
              from: GeneratedNFT.MinterStoragePath
            ) ?? panic("Could not borrow minter reference")
            
            // Get the recipient's collection
            self.recipientCollection = getAccount(recipient)
              .capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(
                GeneratedNFT.CollectionPublicPath
              ) ?? panic("Could not borrow recipient collection")
          }
          
          execute {
            // Mint the NFT
            let nft <- self.minter.mintNFT(
              name: name,
              description: description,
              thumbnail: thumbnail,
              metadata: metadata,
              royalties: royalties
            )
            
            // Deposit to recipient's collection
            self.recipientCollection.deposit(token: <-nft)
          }
        }
      `,
      args: [
        convertToCadenceArg(validatedBody.recipient, 'address'),
        convertToCadenceArg(validatedBody.name, 'string'),
        convertToCadenceArg(validatedBody.description, 'string'),
        convertToCadenceArg(validatedBody.thumbnail, 'string'),
        convertToCadenceArg(validatedBody.metadata || {}, 'dictionary'),
        convertToCadenceArg(royalties, 'array')
      ],
      authorizers: [validatedBody.recipient] // In practice, this would be the minter's address
    })
    
    // Format and return response
    const response = createSuccessResponse({
      transactionId: transactionResult.transactionId,
      status: transactionResult.status,
      recipient: validatedBody.recipient,
      nftDetails: {
        name: validatedBody.name,
        description: validatedBody.description,
        thumbnail: validatedBody.thumbnail,
        metadata: validatedBody.metadata,
        royalties: royalties
      },
      events: transactionResult.events
    }, undefined, 201)
    
    logRequest('POST', request.url, startTime, 201)
    return addSecurityHeaders(addCORSHeaders(response))
    
  } catch (error) {
    const apiError = handleUnknownError(error, 'NFT minting')
    const response = createErrorResponse(apiError)
    logRequest('POST', request.url, startTime, apiError.statusCode, error)
    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)
    const validatedQuery = QuerySchema.parse(queryParams)
    
    // Execute Flow script to get NFT information
    const scriptResult = await executeScript({
      script: `
        import GeneratedNFT from 0xCONTRACT_ADDRESS
        import NonFungibleToken from 0xNONFUNGIBLETOKEN_ADDRESS
        
        access(all) fun main(address: Address): [UInt64] {
          let account = getAccount(address)
          let collection = account.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(
            GeneratedNFT.CollectionPublicPath
          ) ?? panic("Could not borrow collection")
          
          return collection.getIDs()
        }
      `,
      args: [validatedQuery.recipient || '0x01']
    })
    
    const nftIds = scriptResult.data || []
    
    // Get detailed information for each NFT
    const nftDetails = []
    for (const id of nftIds.slice(0, 10)) { // Limit to 10 for performance
      try {
        const detailResult = await executeScript({
          script: `
            import GeneratedNFT from 0xCONTRACT_ADDRESS
            import MetadataViews from 0xMETADATAVIEWS_ADDRESS
            
            access(all) fun main(address: Address, id: UInt64): {String: AnyStruct}? {
              let account = getAccount(address)
              let collection = account.capabilities.borrow<&GeneratedNFT.Collection>(
                GeneratedNFT.CollectionPublicPath
              ) ?? return nil
              
              let nft = collection.borrowGeneratedNFT(id: id) ?? return nil
              
              let display = nft.resolveView(Type<MetadataViews.Display>()) as! MetadataViews.Display?
              
              return {
                "id": id,
                "name": display?.name ?? "",
                "description": display?.description ?? "",
                "thumbnail": display?.thumbnail?.uri() ?? ""
              }
            }
          `,
          args: [validatedQuery.recipient || '0x01', id]
        })
        
        if (detailResult.success && detailResult.data) {
          nftDetails.push(detailResult.data)
        }
      } catch (error) {
        console.warn(`Failed to get details for NFT ${id}:`, error)
      }
    }
    
    // Format and return response
    const response = createSuccessResponse({
      address: validatedQuery.recipient || '0x01',
      totalNFTs: nftIds.length,
      nfts: nftDetails
    })
    
    logRequest('GET', request.url, startTime, 200)
    return addSecurityHeaders(addCORSHeaders(response))
    
  } catch (error) {
    const apiError = handleUnknownError(error, 'NFT query')
    const response = createErrorResponse(apiError)
    logRequest('GET', request.url, startTime, apiError.statusCode, error)
    return addSecurityHeaders(addCORSHeaders(response))
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new Response(null, { status: 200 })
  return addSecurityHeaders(addCORSHeaders(response))
}

// Comprehensive error handling
function handleAPIError(error: unknown): NextResponse {
  console.error('[API Error]:', error)
  
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    }, { status: 400 })
  }
  
  if (error instanceof Error) {
    if (error.message.includes('Script execution failed')) {
      return NextResponse.json({
        error: "Flow script execution failed",
        code: "SCRIPT_ERROR",
        details: error.message
      }, { status: 502 })
    }
    
    if (error.message.includes('Transaction execution failed')) {
      return NextResponse.json({
        error: "Flow transaction failed",
        code: "TRANSACTION_ERROR",
        details: error.message
      }, { status: 502 })
    }
    
    return NextResponse.json({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      details: error.message
    }, { status: 500 })
  }
  
  return NextResponse.json({
    error: "Unknown error occurred",
    code: "UNKNOWN_ERROR"
  }, { status: 500 })
}