
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Neo4jGraph } from '@langchain/community/graphs/neo4j_graph'
import { MemgraphGraph } from '@langchain/community/graphs/memgraph_graph'
import { ChatMistralAI } from '@langchain/mistralai'
import { GraphCypherQAChain } from '@langchain/community/chains/graph_qa/cypher'
import { PromptTemplate } from '@langchain/core/prompts'
import type { AISettings } from '@graphdb/model-builder'

const CYPHSER_GENERATION_TEMPLATE = `Task:Generate Cypher statement to query a graph database.
Instructions:
Use only the provided relationship types and properties in the schema.
Do not use any other relationship types or properties that are not provided.
Schema:
{schema}
Note: Do not include any explanations or apologies in your responses.
Do not respond to any questions that might ask anything else than for you to construct a Cypher statement.
Do not include any text except the generated Cypher statement.
Do not use markdown or code blocks.
The question is:
{question}`

const CYPHER_GENERATION_PROMPT = new PromptTemplate({
    template: CYPHSER_GENERATION_TEMPLATE,
    inputVariables: ['schema', 'question'],
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { question } = body

        if (!question) {
            return NextResponse.json({ error: 'Question is required' }, { status: 400 })
        }

        // 1. Fetch AI Settings
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
            select: { aiSettings: true }
        })

        const aiSettings = userSettings?.aiSettings as unknown as AISettings

        if (!aiSettings?.enabled) {
            return NextResponse.json({ error: 'AI is disabled in settings' }, { status: 403 })
        }

        const apiKey = aiSettings.model.apiKey
        if (!apiKey) {
            return NextResponse.json({ error: 'AI API Key not configured' }, { status: 400 })
        }

        // 2. Initialize Graph Database
        const dbType = (process.env.GRAPH_DB_TYPE || 'memgraph').toLowerCase()
        const host = process.env.GRAPH_DB_HOST || process.env.MEMGRAPH_HOST || process.env.NEO4J_HOST || '127.0.0.1'
        const port = process.env.GRAPH_DB_PORT || process.env.MEMGRAPH_PORT || process.env.NEO4J_PORT || '7687'
        const username = process.env.GRAPH_DB_USERNAME || process.env.NEO4J_USERNAME || 'neo4j'
        const password = process.env.GRAPH_DB_PASSWORD || process.env.NEO4J_PASSWORD || 'password'
        const url = process.env.NEO4J_URI || process.env.NEO4J_URL || `bolt://${host}:${port}`
        const database = process.env.NEO4J_DATABASE || null

        let graph;
        if (dbType === 'neo4j') {
            graph = await Neo4jGraph.initialize({
                url,
                username,
                password,
                database: database as string,
            })
        } else {
            // Memgraph
            graph = await MemgraphGraph.initialize({
                url,
                username,
                password,
            })
        }

        // 3. Initialize Chat Model (Mistral)
        const model = new ChatMistralAI({
            apiKey: apiKey,
            modelName: aiSettings.model.modelName || 'mistral-medium',
            temperature: aiSettings.model.temperature || 0,
        })

        // 4. Create Chain
        const chain = GraphCypherQAChain.fromLLM({
            llm: model,
            graph: graph,
            cypherPrompt: CYPHER_GENERATION_PROMPT,
            returnDirect: false,
            returnIntermediateSteps: true, // Enable intermediate steps to get the Cypher query
        })

        // 5. Run Chain
        const response = await chain.invoke({
            query: question,
        })

        // Extract Cypher query from intermediate steps
        // intermediateSteps is typically an array. The first element usually contains the query.
        // We need to robustly find the query.
        let generatedCypher = '';
        if (response.intermediateSteps && Array.isArray(response.intermediateSteps)) {
            const stepWithQuery = response.intermediateSteps.find((step: any) => step.query);
            if (stepWithQuery) {
                generatedCypher = stepWithQuery.query;
            }
        }

        return NextResponse.json({
            result: response.result,
            cypher: generatedCypher
        })

    } catch (error: any) {
        console.error('Error in AI Agent:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
