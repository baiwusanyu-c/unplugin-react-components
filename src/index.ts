import { createUnplugin } from 'unplugin'
import MagicString from 'magic-string'
import { createFilter } from '@rollup/pluginutils'
import type { GenerateDtsOptions, Options, TransformOptions } from './types'
import { transform } from './core/transformer'
import { searchGlob } from './core/searchGlob'
import { generateDts } from './core/generateDts'
import { resolveOptions } from './core/utils'

export * from './core/resolvers'
export * from './core/generateDts'
export * from './core/resolvers/index'
export * from './core/searchGlob'
export * from './core/transformer'

export default createUnplugin<Options>((options = {}) => {
  // 初始化与默认配置合并
  options = resolveOptions(options)
  // 创建过滤器，包括哪些后缀，不包括哪些文件夹
  const filter = createFilter(
    options.include || [/\.[j|t]sx$/],
    options.exclude || [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
  )
  // 从根目录搜索获得组件模块对象（这里是为了得到项目内组件的 导出导入信息，只是项目内，没有到组件库依赖）
  const searchGlobResult = searchGlob({ rootPath: (options.dts as any)?.rootPath || options.rootDir! })

  // 设置 dts 的option
  const dtsOptions = {
    components: searchGlobResult,
    filename: (options.dts as GenerateDtsOptions)?.filename || 'components',
    rootPath: (options.dts as GenerateDtsOptions)?.rootPath || options.rootDir!,
    local: options.local,
    resolvers: options.resolvers,
  } as GenerateDtsOptions

  // 生成 dts -> component.d.ts
  if (options.dts === true)
    generateDts({ ...dtsOptions })
  else if (typeof options.dts === 'object')
    generateDts({ ...dtsOptions, ...options.dts })

  return {
    name: 'unplugin-react-components',
    // 过滤模块
    transformInclude(id) {
      return filter(id)
    },
    // 转换编译结果,在 vite 编译阶段 转换组件引用代码
    async transform(code, id) {
      const context: TransformOptions = {
        code: new MagicString(code), // 轻量的处理源码的库，能够生成一个对象，里面有一些方便的方法处理字符串
        components: searchGlobResult,
        rootDir: options.rootDir!,
        resolvers: options.resolvers!,
        local: options.local!,
        id,
      }
      return await transform(context)
    },
  }
})
