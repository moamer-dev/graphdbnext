import { prisma } from '@/lib/prisma'

export class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected modelDelegate: any) {}

  async findAll(params: {
    where?: any
    orderBy?: any
    skip?: number
    take?: number
    include?: any
    select?: any
  }) {
    const { where, orderBy, skip, take, include, select } = params
    
    const [data, total] = await Promise.all([
      this.modelDelegate.findMany({
        where,
        orderBy,
        skip,
        take,
        include,
        select,
      }),
      this.modelDelegate.count({ where }),
    ])

    return { data, total }
  }

  async findById(id: string, params?: { include?: any, select?: any }) {
    return this.modelDelegate.findUnique({
      where: { id },
      include: params?.include,
      select: params?.select,
    })
  }

  async create(data: CreateInput) {
    return this.modelDelegate.create({ data })
  }

  async update(id: string, data: UpdateInput) {
    return this.modelDelegate.update({
      where: { id },
      data,
    })
  }

  async delete(id: string) {
    return this.modelDelegate.delete({
      where: { id },
    })
  }

  async deleteMany(where: any) {
    return this.modelDelegate.deleteMany({ where })
  }
}
