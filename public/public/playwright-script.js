const { chromium } = require('playwright');

const initPlaywright = async () => {
    // 用户数据路径
    const userDataDir = 'chrome';

    // 是否无头模式
    const headless = false;

    // 启动持久的浏览器上下文
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: headless,
      acceptDownloads: true,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    return context;
}

const runPlayWright = async (data) => {
    console.log("data: ", data);
    const context = initPlaywright();
    const page = await context.newPage();
    page.goto("https://www.baidu.com/");
    page.mouse.move(100, 100);

    await page.close();
}

(runPlayWright)();