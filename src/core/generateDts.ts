import { writeFileSync } from 'fs'
import { relative } from 'path'
import type { ComponentsContext, GenerateDtsOptions } from '../types'
import { isExportComponent, slash } from './utils'
import { getResolversResult } from './resolvers'

function stringifyComponent(rootPath: string, component: ComponentsContext) {
  const related = `./${relative(rootPath, component.path)}`
  return `typeof import('${slash(related).replace(/\.[tj]sx$/, '')}')['${isExportComponent(component) ? component.name : 'default'}']\n`
}

function stringifyResolver(resolver: any) {
  return `typeof import('${resolver.from}')['${isExportComponent(resolver.type) ? resolver.originalName : 'default'}']\n`
}

// 生成组件类型文件，components.d.ts
export async function generateDts(options: GenerateDtsOptions) {
  const {
    components, // 项目内组件的导入导出信息
    rootPath = process.cwd(), // 生成路径
    filename = 'components', // 文件名
    resolvers, // 传入的解析器
    local, // 是否只需要解析项目内组件，为false 则只生成组件库的
  } = options

  // 调用解析器生成组件库的导入导出信息对象
  const resolversResult = await getResolversResult(resolvers)

  let dts = '/* generated by unplugin-react-components */\nexport {}\ndeclare global{\n'
  // 根据项目内组件的导入导出信息对象，拼接生成项目内的组件信息
  if (local) {
    components.forEach((component) => {
      dts += `\tconst ${component.name}: ${stringifyComponent(rootPath, component)}`
    })
  }
  // 根据组件库的导入导出信息对象，拼接生成项目组件库的组件信息
  resolversResult?.forEach((resolver) => {
    resolver.forEach((item) => {
      dts += `\tconst ${item.name}: ${stringifyResolver(item)}`
    })
  })

  writeFileSync(`${rootPath}/${filename}.d.ts`, `${dts}}`, { encoding: 'utf-8' })
}
