import type { ResolverReturnType, Resolvers } from '../types'

export const resolversType = new Set<ResolverReturnType[]>()

// 挨个调用组件库解析器，
// 获得组件库解析器结果（组件库的导入导出信息），直接放在set里返回
export const getResolversResult = async (resolvers: Resolvers) => {
  if (!resolvers)
    return

  for (const item of resolvers) {
    const fn = await item
    if (typeof fn === 'function')
      resolversType.add((fn as any)())
    else
      resolversType.add(fn)
  }

  return resolversType
}

