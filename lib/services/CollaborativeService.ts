import { getGraphDatabaseService } from './graph-database'

export interface QueryComment {
  id: string
  queryId: string
  userId: string
  userName?: string
  content: string
  createdAt: string
  updatedAt?: string
}

export interface QueryRating {
  queryId: string
  userId: string
  rating: number
  createdAt: string
}

export interface SharedQueryCollection {
  id: string
  name: string
  description?: string
  ownerId: string
  ownerName?: string
  queryIds: string[]
  memberIds: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export class CollaborativeService {
  private db = getGraphDatabaseService()

  private escapeIdentifier(identifier: string): string {
    if (/[^a-zA-Z0-9_]/.test(identifier)) {
      return `\`${identifier.replace(/`/g, '``')}\``
    }
    return identifier
  }

  async addComment(queryId: string, userId: string, content: string): Promise<QueryComment> {
    const comment: QueryComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      queryId,
      userId,
      content,
      createdAt: new Date().toISOString()
    }

    await this.db.connect()
    const query = `
      MATCH (q:Query {id: $queryId})
      CREATE (c:Comment {
        id: $id,
        queryId: $queryId,
        userId: $userId,
        content: $content,
        createdAt: $createdAt
      })
      CREATE (c)-[:COMMENTED_ON]->(q)
      RETURN c
    `

    await this.db.execute(query, {
      id: comment.id,
      queryId,
      userId,
      content,
      createdAt: comment.createdAt
    })

    return comment
  }

  async getComments(queryId: string): Promise<QueryComment[]> {
    await this.db.connect()
    
    const query = `
      MATCH (c:Comment {queryId: $queryId})
      OPTIONAL MATCH (u:User {id: c.userId})
      RETURN c, u.name as userName
      ORDER BY c.createdAt DESC
    `

    const results = await this.db.execute(query, { queryId })
    return results.map((row: unknown) => {
      const rowData = row as { c: Record<string, unknown>; userName?: string }
      return {
        id: rowData.c.id as string,
        queryId: rowData.c.queryId as string,
        userId: rowData.c.userId as string,
        userName: rowData.userName,
        content: rowData.c.content as string,
        createdAt: rowData.c.createdAt as string,
        updatedAt: rowData.c.updatedAt as string | undefined
      }
    })
  }

  async updateComment(commentId: string, content: string): Promise<void> {
    await this.db.connect()
    
    const query = `
      MATCH (c:Comment {id: $commentId})
      SET c.content = $content, c.updatedAt = $updatedAt
    `

    await this.db.execute(query, {
      commentId,
      content,
      updatedAt: new Date().toISOString()
    })
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.db.connect()
    
    const query = `
      MATCH (c:Comment {id: $commentId})
      DETACH DELETE c
    `

    await this.db.execute(query, { commentId })
  }

  async addRating(queryId: string, userId: string, rating: number): Promise<QueryRating> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    await this.db.connect()
    
    const existingQuery = `
      MATCH (r:Rating {queryId: $queryId, userId: $userId})
      RETURN r
    `
    const existing = await this.db.execute(existingQuery, { queryId, userId })

    if (existing.length > 0) {
      const updateQuery = `
        MATCH (r:Rating {queryId: $queryId, userId: $userId})
        SET r.rating = $rating, r.updatedAt = $updatedAt
        RETURN r
      `
      await this.db.execute(updateQuery, {
        queryId,
        userId,
        rating,
        updatedAt: new Date().toISOString()
      })
    } else {
      const createQuery = `
        MATCH (q:Query {id: $queryId})
        CREATE (r:Rating {
          queryId: $queryId,
          userId: $userId,
          rating: $rating,
          createdAt: $createdAt
        })
        CREATE (r)-[:RATES]->(q)
        RETURN r
      `
      await this.db.execute(createQuery, {
        queryId,
        userId,
        rating,
        createdAt: new Date().toISOString()
      })
    }

    return {
      queryId,
      userId,
      rating,
      createdAt: new Date().toISOString()
    }
  }

  async getAverageRating(queryId: string): Promise<number> {
    await this.db.connect()
    
    const query = `
      MATCH (r:Rating {queryId: $queryId})
      RETURN avg(r.rating) as average
    `

    const results = await this.db.execute(query, { queryId })
    return ((results[0] as Record<string, unknown>)?.average as number) || 0
  }

  async createSharedCollection(
    name: string,
    ownerId: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<SharedQueryCollection> {
    const collection: SharedQueryCollection = {
      id: `collection_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      description,
      ownerId,
      queryIds: [],
      memberIds: [ownerId],
      isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await this.db.connect()
    
    const query = `
      CREATE (c:QueryCollection {
        id: $id,
        name: $name,
        description: $description,
        ownerId: $ownerId,
        queryIds: $queryIds,
        memberIds: $memberIds,
        isPublic: $isPublic,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })
      RETURN c
    `

    await this.db.execute(query, {
      id: collection.id,
      name: collection.name,
      description: collection.description || null,
      ownerId: collection.ownerId,
      queryIds: collection.queryIds,
      memberIds: collection.memberIds,
      isPublic: collection.isPublic,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt
    })

    return collection
  }

  async getSharedCollections(userId: string): Promise<SharedQueryCollection[]> {
    await this.db.connect()
    
    const query = `
      MATCH (c:QueryCollection)
      WHERE c.isPublic = true OR $userId IN c.memberIds
      OPTIONAL MATCH (u:User {id: c.ownerId})
      RETURN c, u.name as ownerName
      ORDER BY c.updatedAt DESC
    `

    const results = await this.db.execute(query, { userId })
    return results.map((row: unknown) => {
      const rowData = row as { c: Record<string, unknown>; ownerName?: string }
      return {
        id: rowData.c.id as string,
        name: rowData.c.name as string,
        description: rowData.c.description as string | undefined,
        ownerId: rowData.c.ownerId as string,
        ownerName: rowData.ownerName,
        queryIds: (rowData.c.queryIds as string[]) || [],
        memberIds: (rowData.c.memberIds as string[]) || [],
        isPublic: rowData.c.isPublic as boolean,
        createdAt: rowData.c.createdAt as string,
        updatedAt: rowData.c.updatedAt as string
      }
    })
  }

  async addQueryToCollection(collectionId: string, queryId: string): Promise<void> {
    await this.db.connect()
    
    const query = `
      MATCH (c:QueryCollection {id: $collectionId})
      SET c.queryIds = CASE WHEN $queryId IN c.queryIds THEN c.queryIds ELSE c.queryIds + $queryId END,
          c.updatedAt = $updatedAt
    `

    await this.db.execute(query, {
      collectionId,
      queryId,
      updatedAt: new Date().toISOString()
    })
  }

  async addMemberToCollection(collectionId: string, userId: string): Promise<void> {
    await this.db.connect()
    
    const query = `
      MATCH (c:QueryCollection {id: $collectionId})
      SET c.memberIds = CASE WHEN $userId IN c.memberIds THEN c.memberIds ELSE c.memberIds + $userId END,
          c.updatedAt = $updatedAt
    `

    await this.db.execute(query, {
      collectionId,
      userId,
      updatedAt: new Date().toISOString()
    })
  }
}

