import type { ExportType, TransformOptions } from '../types'
import { isExportComponent, stringifyImport } from './utils'
import { getResolversResult } from './resolvers'

// 初次解析后 jsx 中的组件使用 会以jsxDEV开通头_jsxDEV(App,....)
// 或者内置组件 React.xx 用这个正则匹配
const reactComponentRE = /_jsxDEV\(([^"][^React\.]\w+)/g

export async function transform(options: TransformOptions) {
  let index = 0
  const { code, id, components, resolvers, local } = options

  // 匹配文件编译后源码，得出这个文件比如 app.tsx,编译后代码中在 jsx 模板中使用了哪些组件
  // main.tsx ,使用了 App组件
  //  {
  //     name: 'App',
  //     path: 'D:/project/unplugin-react-components/playground/src/main.tsx',
  //     original: '_jsxDEV(App'
  //   }
  const matches = Array.from(code.original.matchAll(reactComponentRE)).map(item => ({
    name: item[1],
    path: id,
    original: item[0],
  }))

  const importsName: string[] = [] // 导入组件缓存
  const imports: string[] = [] // 导入组件代码列表

  const resolveImports = (name: string, type: ExportType, path: string, original: string) => {
    // 缓存导入模块名，避免重复导入
    if (importsName.includes(name))
      return

    // 需要加入的组件名称
    const replacedName = `_unplugin_react_${name}_${index}`
    index++

    // 替换jsx编译结果的组件使用部分
    code.replaceAll(original, `_jsxDEV(${replacedName}`)

    const importedPath = path

    // 生成 import 组件代码
    if (isExportComponent(type)) {
      imports.push(stringifyImport({
        name,
        as: replacedName,
        from: importedPath,
      }))
    }
    else {
      imports.push(stringifyImport({
        default: replacedName,
        from: importedPath,
      }))
    }

    // 缓存导入模块名，避免重复导入
    importsName.push(name)
  }

  // 调用解析器生成组件库的导入导出信息对象
  const resolversResult = await getResolversResult(resolvers)

  for (const matched of matches) {
    // 滤出本文件使用的组件库组件 模块信息
    resolversResult?.forEach((resolver) => {
      resolver.forEach((item) => {
        if (item.name === matched.name)
          resolveImports(item.originalName, item.type, item.from, matched.original)
      })
    })

    // 转换项目内的组件
    if (local) {
      // 数组化后过滤出本文件使用的组件模块信息
      const component = Array.from(components).find(item => item.name === matched.name)
      if (!component)
        continue
      // 根据信息转换代码
      resolveImports(component.name, component.type as ExportType, component.path, matched.original)
    }
  }
  // 代码顶部将导入信息拼接
  code.prepend(`${imports.join('\n')}\n`)
  return code.toString()
}
