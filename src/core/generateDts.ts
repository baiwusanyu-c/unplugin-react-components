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

export async function generateDts(options: GenerateDtsOptions) {
  const {
    components,
    rootPath = process.cwd(),
    filename = 'components',
    resolvers,
    local,
  } = options

  const resolversResult = await getResolversResult(resolvers)

  let dts = '/* generated by unplugin-react-components */\nexport {}\ndeclare global{\n'
  if (local) {
    components.forEach((component) => {
      dts += `\tconst ${component.name}: ${stringifyComponent(rootPath, component)}`
    })
  }
  resolversResult?.forEach((resolver) => {
    resolver.forEach((item) => {
      dts += `\tconst ${item.name}: ${stringifyResolver(item)}`
    })
  })

  writeFileSync(`${rootPath}/${filename}.d.ts`, `${dts}}`, { encoding: 'utf-8' })
}
