'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('./paths');

// Make sure that including paths.js after env.js will read .env variables.
delete require.cache[require.resolve('./paths')];

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  throw new Error(
    'The NODE_ENV environment variable is required but was not specified.'
  );
}

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== 'test' && `${paths.dotenv}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  paths.dotenv,
].filter(Boolean);

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.  Variable expansion is supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv-expand')(
      require('dotenv').config({
        path: dotenvFile,
      })
    );
  }
});

// We support resolving modules according to `NODE_PATH`.
// This lets you use absolute paths in imports inside large monorepos:
// https://github.com/facebook/create-react-app/issues/253.
// It works similar to `NODE_PATH` in Node itself:
// https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders
// Note that unlike in Node, only *relative* paths from `NODE_PATH` are honored.
// Otherwise, we risk importing Node.js core modules into an app instead of webpack shims.
// https://github.com/facebook/create-react-app/issues/1023#issuecomment-265344421
// We also resolve them to make sure all tools using them work consistently.
const appDirectory = fs.realpathSync(process.cwd());
process.env.NODE_PATH = (process.env.NODE_PATH || '')
  .split(path.delimiter)
  .filter(folder => folder && !path.isAbsolute(folder))
  .map(folder => path.resolve(appDirectory, folder))
  .join(path.delimiter);

// Grab NODE_ENV and REACT_APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in webpack configuration.
const REACT_APP = /^REACT_APP_/i;

function getClientEnvironment(publicUrl) {
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      },
      {
        // Useful for determining whether we’re running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: process.env.NODE_ENV || 'development',
        // Useful for resolving the correct path to static assets in `public`.
        // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
        // This should only be used as an escape hatch. Normally you would put
        // images into the `src` and `import` them in code to get their paths.
        PUBLIC_URL: publicUrl,
        // We support configuring the sockjs pathname during development.
        // These settings let a developer run multiple simultaneous projects.
        // They are used as the connection `hostname`, `pathname` and `port`
        // in webpackHotDevClient. They are used as the `sockHost`, `sockPath`
        // and `sockPort` options in webpack-dev-server.
        WDS_SOCKET_HOST: process.env.WDS_SOCKET_HOST,
        WDS_SOCKET_PATH: process.env.WDS_SOCKET_PATH,
        WDS_SOCKET_PORT: process.env.WDS_SOCKET_PORT,
        // Whether or not react-refresh is enabled.
        // It is defined here so it is available in the webpackHotDevClient.
        FAST_REFRESH: process.env.FAST_REFRESH !== 'false',
      }
    );
  // Stringify all values so we can feed into webpack DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}

module.exports = getClientEnvironment;


/*模块引入：
fs：Node.js的文件系统模块，用于与文件系统进行交互。
path：Node.js的路径模块，用于处理文件路径。
paths：自定义模块，可能包含了项目路径的定义。
清除缓存：
使用delete require.cache[require.resolve('./paths')]删除paths模块的缓存。这样做是为了确保每次导入env.js时都会重新读取.env文件中的变量。
设置NODE_ENV环境变量：
从process.env.NODE_ENV读取环境变量NODE_ENV。
如果NODE_ENV未设置，则抛出错误。
配置dotenv文件：
dotenvFiles数组包含了可能存在的.env文件列表，按照优先级排列，例如.env.development.local比.env.development具有更高的优先级。
对于测试环境，不包含.env.local，因为测试通常需要一致的结果。
加载环境变量：
使用dotenv库从.env*文件中加载环境变量。
使用dotenv-expand来展开变量，支持在.env文件中使用变量展开。
处理NODE_PATH：
如果设置了NODE_PATH环境变量，则解析它包含的路径，确保它们是相对路径，并将它们转换为绝对路径。
这样可以支持在大型monorepos中使用绝对路径导入模块。
获取客户端环境：
getClientEnvironment函数用于获取客户端环境变量，它将环境变量分为两部分：raw和stringified。
raw是一个对象，包含了所有以REACT_APP_开头的环境变量。
stringified是一个对象，其键为process.env，值为所有raw对象键的字符串化形式，用于Webpack的DefinePlugin。
导出函数：
模块导出了getClientEnvironment函数，使其可以被其他文件导入和使用。
如何解读这段代码：

这段代码是配置Web应用程序环境变量的关键部分。它确保了应用程序可以根据不同的环境（开发、生产、测试等）加载正确的配置。以下是代码的主要功能：

确保环境变量NODE_ENV被设置，这是许多应用程序配置的关键。
从一系列可能的.env文件中加载环境变量，这些文件可以根据不同的环境进行定制。
处理NODE_PATH环境变量，以支持在大型项目中使用绝对路径导入模块。
提供一个函数getClientEnvironment，它将收集所有以REACT_APP_开头的环境变量，并准备它们以供Webpack在构建过程中使用。
通过导出getClientEnvironment函数，允许其他模块访问和使用这些配置好的环境变量。
*/