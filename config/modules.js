'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('./paths');
const chalk = require('react-dev-utils/chalk');
const resolve = require('resolve');

/**
 * Get additional module paths based on the baseUrl of a compilerOptions object.
 *
 * @param {Object} options
 */
function getAdditionalModulePaths(options = {}) {
  const baseUrl = options.baseUrl;

  if (!baseUrl) {
    return '';
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

  // We don't need to do anything if `baseUrl` is set to `node_modules`. This is
  // the default behavior.
  if (path.relative(paths.appNodeModules, baseUrlResolved) === '') {
    return null;
  }

  // Allow the user set the `baseUrl` to `appSrc`.
  if (path.relative(paths.appSrc, baseUrlResolved) === '') {
    return [paths.appSrc];
  }

  // If the path is equal to the root directory we ignore it here.
  // We don't want to allow importing from the root directly as source files are
  // not transpiled outside of `src`. We do allow importing them with the
  // absolute path (e.g. `src/Components/Button.js`) but we set that up with
  // an alias.
  if (path.relative(paths.appPath, baseUrlResolved) === '') {
    return null;
  }

  // Otherwise, throw an error.
  throw new Error(
    chalk.red.bold(
      "Your project's `baseUrl` can only be set to `src` or `node_modules`." +
        ' Create React App does not support other values at this time.'
    )
  );
}

/**
 * Get webpack aliases based on the baseUrl of a compilerOptions object.
 *
 * @param {*} options
 */
function getWebpackAliases(options = {}) {
  const baseUrl = options.baseUrl;

  if (!baseUrl) {
    return {};
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

  if (path.relative(paths.appPath, baseUrlResolved) === '') {
    return {
      src: paths.appSrc,
    };
  }
}

/**
 * Get jest aliases based on the baseUrl of a compilerOptions object.
 *
 * @param {*} options
 */
function getJestAliases(options = {}) {
  const baseUrl = options.baseUrl;

  if (!baseUrl) {
    return {};
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

  if (path.relative(paths.appPath, baseUrlResolved) === '') {
    return {
      '^src/(.*)$': '<rootDir>/src/$1',
    };
  }
}

function getModules() {
  // Check if TypeScript is setup
  const hasTsConfig = fs.existsSync(paths.appTsConfig);
  const hasJsConfig = fs.existsSync(paths.appJsConfig);

  if (hasTsConfig && hasJsConfig) {
    throw new Error(
      'You have both a tsconfig.json and a jsconfig.json. If you are using TypeScript please remove your jsconfig.json file.'
    );
  }

  let config;

  // If there's a tsconfig.json we assume it's a
  // TypeScript project and set up the config
  // based on tsconfig.json
  if (hasTsConfig) {
    const ts = require(resolve.sync('typescript', {
      basedir: paths.appNodeModules,
    }));
    config = ts.readConfigFile(paths.appTsConfig, ts.sys.readFile).config;
    // Otherwise we'll check if there is jsconfig.json
    // for non TS projects.
  } else if (hasJsConfig) {
    config = require(paths.appJsConfig);
  }

  config = config || {};
  const options = config.compilerOptions || {};

  const additionalModulePaths = getAdditionalModulePaths(options);

  return {
    additionalModulePaths: additionalModulePaths,
    webpackAliases: getWebpackAliases(options),
    jestAliases: getJestAliases(options),
    hasTsConfig,
  };
}

module.exports = getModules();


/*模块引入：
fs：Node.js的文件系统模块，用于与文件系统进行交互。
path：Node.js的路径模块，用于处理文件路径。
paths：自定义模块，可能包含了项目路径的定义。
chalk：一个颜色库，用于在控制台输出中添加颜色。
resolve：一个模块解析库，用于解析模块路径。

函数getAdditionalModulePaths：
这个函数用于获取额外的模块路径，基于compilerOptions对象中的baseUrl。
如果baseUrl未设置，则返回空字符串。
如果baseUrl设置为node_modules（默认行为），则不返回额外路径。
如果baseUrl设置为src，则返回包含src目录的数组。
如果baseUrl设置为项目根目录，则抛出错误，因为通常不允许直接从根目录导入源文件。
如果baseUrl是其他值，则抛出错误，因为Create React App目前不支持其他值。

函数getWebpackAliases：
这个函数用于获取Webpack别名，基于compilerOptions对象中的baseUrl。
如果baseUrl未设置，则返回空对象。
如果baseUrl设置为项目根目录，则返回一个别名对象，将src映射到项目的src目录。

函数getJestAliases：
这个函数用于获取Jest别名，基于compilerOptions对象中的baseUrl。
如果baseUrl未设置，则返回空对象。
如果baseUrl设置为项目根目录，则返回一个别名对象，用于在Jest测试中重写src目录的导入。

函数getModules：
这个函数用于检查项目是否设置了TypeScript配置文件（tsconfig.json）或JavaScript配置文件（jsconfig.json）。
如果同时存在tsconfig.json和jsconfig.json，则抛出错误。
如果存在tsconfig.json，则使用TypeScript解析器读取配置文件。
如果存在jsconfig.json，则直接读取配置文件。
如果两者都不存在，则将配置设置为空对象。
从配置中获取compilerOptions，并使用前面定义的函数来获取额外的模块路径、Webpack别名和Jest别名。
返回一个包含这些信息的对象。
模块导出：
最后，模块导出了getModules函数，使其可以被其他文件导入和使用。
如何解读这段代码：

这段代码是项目配置的一部分，用于设置与项目构建和测试相关的路径和别名。它确保了项目可以正确地解析模块路径，特别是在使用Webpack和Jest时。以下是代码的主要功能：

根据项目的配置文件（tsconfig.json或jsconfig.json）来获取编译器选项。
根据编译器选项中的baseUrl来设置额外的模块路径、Webpack别名和Jest别名。
通过检查配置文件的存在，确保项目配置的一致性。
将配置信息导出，以便在构建和测试过程中使用。
