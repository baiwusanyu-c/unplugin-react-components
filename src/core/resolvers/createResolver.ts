import { importModule } from 'local-pkg'
import { isCapitalCase } from '../utils'
import type { BaseResolverOptions, ResolverReturnType } from '../../types'

interface CreateResolverOptions {
  prefix: string // 组件名称前缀，例如antd，你在业务代码中 使用 <AntButton />,这里就要传入 'Ant'
  module: string // 模块名称（pkg中的包名）
  exclude?: (name: string) => boolean // 排除函数
}

export function createResolver<T extends BaseResolverOptions>(
  _options: CreateResolverOptions,
) {
  return async (options: T = {} as T) => {
    const { prefix = 'Ant' } = options

    // 获取包模块信息
    const pkgs = await importModule(_options.module)

    const components: ResolverReturnType[] = Object.keys(pkgs)
      .filter((item) => {
        if (_options.exclude)
          return isCapitalCase(item) && _options.exclude(item)

        return isCapitalCase(item)
      })
      .map(item => ({
        name: `${typeof prefix === 'string' ? prefix : ''}${item}`, // 组件标签名称
        originalName: typeof prefix === 'string' ? item.replace(prefix, '') : item, // 组件原始名称
        from: _options.module, // 组件包路径 'ant'、'@mui/material'
        type: 'Export',
      }))

    return () => {
      return components
    }
  }
}
