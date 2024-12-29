'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chalk = require('react-dev-utils/chalk');
const paths = require('./paths');

// Ensure the certificate and key provided are valid and if not
// throw an easy to debug error
function validateKeyAndCerts({ cert, key, keyFile, crtFile }) {
  let encrypted;
  try {
    // publicEncrypt will throw an error with an invalid cert
    encrypted = crypto.publicEncrypt(cert, Buffer.from('test'));
  } catch (err) {
    throw new Error(
      `The certificate "${chalk.yellow(crtFile)}" is invalid.\n${err.message}`
    );
  }

  try {
    // privateDecrypt will throw an error with an invalid key
    crypto.privateDecrypt(key, encrypted);
  } catch (err) {
    throw new Error(
      `The certificate key "${chalk.yellow(keyFile)}" is invalid.\n${
        err.message
      }`
    );
  }
}

// Read file and throw an error if it doesn't exist
function readEnvFile(file, type) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `You specified ${chalk.cyan(
        type
      )} in your env, but the file "${chalk.yellow(file)}" can't be found.`
    );
  }
  return fs.readFileSync(file);
}

// Get the https config
// Return cert files if provided in env, otherwise just true or false
function getHttpsConfig() {
  const { SSL_CRT_FILE, SSL_KEY_FILE, HTTPS } = process.env;
  const isHttps = HTTPS === 'true';

  if (isHttps && SSL_CRT_FILE && SSL_KEY_FILE) {
    const crtFile = path.resolve(paths.appPath, SSL_CRT_FILE);
    const keyFile = path.resolve(paths.appPath, SSL_KEY_FILE);
    const config = {
      cert: readEnvFile(crtFile, 'SSL_CRT_FILE'),
      key: readEnvFile(keyFile, 'SSL_KEY_FILE'),
    };

    validateKeyAndCerts({ ...config, keyFile, crtFile });
    return config;
  }
  return isHttps;
}

module.exports = getHttpsConfig;

##模块引入：
fs：Node.js的文件系统模块，用于与文件系统进行交互。
path：Node.js的路径模块，用于处理文件路径。
crypto：Node.js的加密模块，提供了加密功能，包括对OpenSSL的哈希、HMAC、加密、解密、签名和验证功能。
chalk：一个颜色库，用于在控制台输出中添加颜色。
paths：自定义模块，可能包含了项目路径的定义。
函数validateKeyAndCerts：
这个函数用于验证提供的证书（cert）和密钥（key）是否有效。
它尝试使用公钥加密一个测试字符串，如果证书无效，publicEncrypt将抛出错误。
然后，它尝试使用私钥解密之前加密的测试字符串，如果密钥无效，privateDecrypt将抛出错误。
如果任一操作失败，函数将抛出一个包含错误信息的错误。
函数readEnvFile：
这个函数用于读取环境变量中指定的文件。
如果文件不存在，函数将抛出一个错误，指出无法找到指定的文件。
如果文件存在，它将读取文件内容并返回。
函数getHttpsConfig：
这个函数用于获取HTTPS配置。
它从环境变量中读取HTTPS、SSL_CRT_FILE和SSL_KEY_FILE。
如果HTTPS设置为true且提供了证书和密钥文件路径，函数将解析这些路径，读取文件内容，并调用validateKeyAndCerts来验证它们。
如果验证通过，函数将返回包含证书和密钥的对象。
如果没有提供证书和密钥文件，但HTTPS为true，则函数返回true。
如果HTTPS不为true，则返回false。
模块导出：
最后，模块导出了getHttpsConfig函数，使其可以被其他文件导入和使用。
如何解读这段代码：

这段代码用于配置Node.js服务以使用HTTPS。它从环境变量中读取证书和密钥文件的路径，验证这些文件是否有效，并返回配置对象或布尔值，以指示是否启用HTTPS。在Android agent（代理）的上下文中，这可能意味着这个模块是Node.js服务的一部分，该服务可能在Android设备上运行，或者与Android应用程序交互，为应用程序提供HTTPS支持。