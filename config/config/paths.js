/**
 * 'use strict' 指令用于告诉 JavaScript 解析器以严格模式执行代码。
 * 严格模式可以使得代码在执行时期有更多的限制，从而避免一些潜在的错误。
 */

/**
 * 引入 Node.js 的核心模块，用于处理文件路径和文件系统操作。
 */
const path = require('path');
const fs = require('fs');

/**
 * 引入一个工具函数，用于获取项目的公共 URL 或路径。
 * 这个函数通常用于确定在开发或生产环境中，应用程序是如何被访问的。
 */
const getPublicUrlOrPath = require('react-dev-utils/getPublicUrlOrPath');

/**
 * 确保 project 文件夹中的任何符号链接都被解析。
 * 这是为了解决 create-react-app 在某些情况下遇到的问题。
 * 使用 fs.realpathSync 方法同步解析当前工作目录的真实路径。
 */
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

/**
 * 使用环境变量 PUBLIC_URL 或 package.json 中的 "homepage" 字段来推断
 * 应用程序的 "public path"。webpack 需要知道这个路径，以便在 HTML 中
 * 插入正确的 <script> 标签，即使在单页应用中，可能也会为嵌套的 URL
 * 提供索引 HTML，如 /todos/42。
 * 不能在 HTML 中使用相对路径，因为我们不希望加载类似
 * /todos/42/static/js/bundle.7289d.js 的文件。我们需要知道根路径。
 */
const publicUrlOrPath = getPublicUrlOrPath(
  process.env.NODE_ENV === 'development',
  require(resolveApp('package.json')).homepage,
  process.env.PUBLIC_URL
);

/**
 * 定义构建路径，默认为 'user-web-extensions'，可以通过环境变量 BUILD_PATH 覆盖。
 */
const buildPath = process.env.BUILD_PATH || 'user-web-extensions';

/**
 * 定义模块文件扩展名数组，用于解析模块文件。
 */
const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx',
];

/**
 * 创建一个函数，用于解析模块文件路径，按照 webpack 的解析顺序。
 * @param {Function} resolveFn - 用于解析文件路径的函数。
 * @param {string} filePath - 要解析的文件路径。
 * @returns {string} 解析后的文件路径。
 */
const resolveModule = (resolveFn, filePath) => {
  const extension = moduleFileExtensions.find(extension =>
    fs.existsSync(resolveFn(`${filePath}.${extension}`))
  );

  if (extension) {
    return resolveFn(`${filePath}.${extension}`);
  }

  return resolveFn(`${filePath}.js`);
};

/**
 * 当 eject 配置后，我们位于 ./config/ 目录下。
 * 导出配置对象，包含各种路径和配置信息。
 */
module.exports = {
  dotenv: resolveApp('.env'), // 环境变量文件路径
  appPath: resolveApp('.'), // 应用程序根路径
  appBuild: resolveApp(buildPath), // 构建目录路径
  appPublic: resolveApp('public'), // 公共资源目录路径
  appHtml: resolveApp('public/index.html'), // HTML 文件路径
  appIndexJs: resolveModule(resolveApp, 'src/index'), // 应用程序的入口 JS 文件路径
  appPackageJson: resolveApp('package.json'), // package.json 文件路径
  appSrc: resolveApp('src'), // 源代码目录路径
  appTsConfig: resolveApp('tsconfig.json'), // TypeScript 配置文件路径
  appJsConfig: resolveApp('jsconfig.json'), // JavaScript 配置文件路径
  yarnLockFile: resolveApp('yarn.lock'), // yarn 锁文件路径
  testsSetup: resolveModule(resolveApp, 'src/setupTests'), // 测试设置文件路径
  proxySetup: resolveApp('src/setupProxy.js'), // 代理设置文件路径
  appNodeModules: resolveApp('node_modules'), // node_modules 目录路径
  appWebpackCache: resolveApp('node_modules/.cache'), // webpack 缓存目录路径
  appTsBuildInfoFile: resolveApp('node_modules/.cache/tsconfig.tsbuildinfo'), // TypeScript 构建信息文件路径
  swSrc: resolveModule(resolveApp, 'src/service-worker'), // Service Worker 源文件路径
  publicUrlOrPath, // 公共 URL 或路径
};

/**
 * 导出 moduleFileExtensions 数组，以便其他模块可以访问。
 */
module.exports.moduleFileExtensions = moduleFileExtensions;


/*这个文件通常是作为 Create React App (CRA) 项目的配置文件而存在的。Create React App 是一个流行的命令行工具，用于快速搭建 React 应用程序。这个文件（通常命名为 paths.js）的必要性在于以下几个方面：

路径解析：JavaScript 应用程序需要知道各种文件和目录的位置，例如源代码、HTML 文件、构建输出等。这个文件定义了所有这些路径，以便在整个项目中可以一致地引用它们。
可扩展性：通过提供这些路径的配置，paths.js 允许开发者在不同的环境中（开发、测试、生产）使用不同的配置，或者根据需要自定义构建路径。
可维护性：将所有路径集中在一个文件中，可以更容易地管理和更新路径，而不必在项目的多个地方进行修改。
框架集成：这个文件还负责集成一些框架级别的工具和配置，比如 Webpack 的配置文件，它需要知道如何处理源文件和资源。
关于是否每个 web 应用都需要使用这个文件，答案是：

对于使用 Create React App 的项目：是的，这个文件是 CRA 的一部分，用于管理路径和配置。大多数情况下，开发者不需要手动编辑这个文件，因为 CRA 提供了一套默认的配置，足以应对大多数项目需求。
对于不使用 Create React App 的项目：不一定。如果你正在构建一个自定义的构建系统，或者使用其他框架（如 Next.js、Vue CLI、Angular CLI 等），那么你可能不需要这个文件，或者需要一个类似的但针对你的框架定制的配置文件。
对于自定义配置：如果你需要从 CRA 中“弹出”（eject）以自定义构建过程，那么这个文件将变得重要，因为它包含了所有构建路径和配置，你需要根据你的需求来修改它。
总之，这个文件是 CRA 提供的一个框架性文件，大多数情况下，开发者不需要自己编写，而是依赖于 CRA 的默认配置。如果你确实需要自定义配置，那么这个文件提供了一个起点，让你可以根据自己的需求进行修改。


/*JavaScript 应用程序需要知道各种文件和目录的位置的原因是多方面的，以下是一些主要的理由以及它们通常被引用的地方：

为什么需要知道文件和目录的位置：
构建过程：在构建过程中，例如使用 Webpack 或其他打包工具时，需要指定源代码的位置以及输出文件的位置。这些路径用于配置打包工具，以便正确地编译、打包和优化应用程序。
服务器配置：如果应用程序运行在一个服务器上，服务器配置需要知道静态资源（如 HTML、CSS、JavaScript 文件）的位置，以便正确地提供这些资源。
开发环境：在开发环境中，开发者可能需要引用特定的文件或目录，例如配置文件、入口文件、测试文件等。
路径引用：在代码中，可能会引用静态资源（如图片、字体、数据文件等），需要正确的路径才能访问这些资源。
插件和中间件：某些插件或中间件可能需要知道特定的文件或目录位置来执行它们的任务。
文件和目录位置通常被引用的地方：
Webpack 配置：
entry：指定应用程序的入口文件。
output.path：指定打包后的文件存放的位置。
resolve.alias：配置模块解析的别名，简化模块引用。
HTML 文件：
<script src="...">：在 HTML 文件中引用打包后的 JavaScript 文件。
<link href="...">：在 HTML 文件中引用 CSS 文件。
JavaScript 代码：
导入模块：import ... from '...'，可能需要相对路径或配置的别名。
引用资源：如图片、字体等，例如 background-image: url('path/to/image')。
环境配置文件：
.env 文件：可能包含指向特定目录或文件的路径。
服务器配置：
比如在 Node.js 服务器中配置静态文件服务器的路径。
测试配置：
指定测试文件的位置，例如在 Jest 配置文件中。
构建脚本：
在构建脚本中，可能需要引用特定的文件或目录来执行任务。
通过集中管理这些路径，应用程序变得更加灵活和可维护。如果路径需要更改，只需在一个地方更新，而不必在项目的多个地方进行修改。这有助于减少错误和提高开发效率。

