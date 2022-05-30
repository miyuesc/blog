/* @flow */

import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'

// 给核型编译器传递 web 平台特有的配置（baseOptions），从而创建 web 平台的编译器
const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }
