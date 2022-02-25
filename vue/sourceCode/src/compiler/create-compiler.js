/* @flow */

import { extend } from 'shared/util'
import { detectErrors } from './error-detector'
import { createCompileToFunctionFn } from './to-function'

/**
 * 
 * @param {Function} baseCompile 核心编译器
 * @returns 
 */
export function createCompilerCreator (baseCompile: Function): Function {
  /**
   * 根据传递进来的 baseOptions 创建平台编译器
   * @param {CompilerOptions} baseOptions 平台特有的配置，比如 web 平台
   */
  return function createCompiler (baseOptions: CompilerOptions) {
    /**
     * 编译函数，做了两件事：
     *   1、选项合并，将 options 配置项 合并到 finalOptions(baseOptions) 中，得到最终的编译配置对象
     *   2、调用核心编译器 baseCompile 得到编译结果
     *   3、将编译期间产生的 error 和 tip 挂载到编译结果上，返回编译结果
     * @param {*} template 模版
     * @param {*} options 配置项
     * @returns 
     */
    function compile (
      template: string,
      options?: CompilerOptions
    ): CompiledResult {
      // 以平台特有的编译配置为原型创建编译选项对象
      const finalOptions = Object.create(baseOptions)
      const errors = []
      const tips = []

      // 日志，负责记录将 error 和 tip
      let warn = (msg, range, tip) => {
        (tip ? tips : errors).push(msg)
      }

      // 如果存在编译选项，合并 options 和 baseOptions
      if (options) {
        // 开发环境走
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          // $flow-disable-line
          const leadingSpaceLength = template.match(/^\s*/)[0].length

          // 增强 日志 方法
          warn = (msg, range, tip) => {
            const data: WarningMessage = { msg }
            if (range) {
              if (range.start != null) {
                data.start = range.start + leadingSpaceLength
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength
              }
            }
            (tip ? tips : errors).push(data)
          }
        }

        /**
         * 将 options 中的配置项合并到 finalOptions
         */

        // 合并自定义 module
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules)
        }
        // 合并自定义指令
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          )
        }
        // 拷贝其它配置项
        for (const key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key]
          }
        }
      }

      // 日志
      finalOptions.warn = warn

      // 到这里为止终于到重点了，调用核心编译函数，传递模版字符串和最终的编译选项，得到编译结果
      // 前面做的所有事情都是为了构建平台最终的编译选项
      const compiled = baseCompile(template.trim(), finalOptions)
      if (process.env.NODE_ENV !== 'production') {
        detectErrors(compiled.ast, warn)
      }
      // 将编译期间产生的错误和提示挂载到编译结果上
      compiled.errors = errors
      compiled.tips = tips
      return compiled
    }

    return {
      compile,
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}
