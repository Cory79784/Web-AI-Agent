/* global chrome */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
// 引入Ant Design中文语言包
import zhCN from 'antd/locale/zh_CN';
// 全局样式
import SelectedIcon from './components/SelectedIcon';

let shadowRoot = null;

document.addEventListener('mousedown', async () => {
    if (shadowRoot) {
        let rootContainer = shadowRoot.getElementById('webact-shortcut-container');
        if (rootContainer) {
            rootContainer.innerHTML = '';
        }
    }
}, true);

document.addEventListener('mouseup', async (event) => {
    try {
        const copiedText = await window.getSelection().toString().trim();
        if (copiedText) {
            let selectedElementRange = window.getSelection().getRangeAt(0).getBoundingClientRect();
            console.log("selectedElementRange: ", selectedElementRange);
            if (shadowRoot) {
                let rootContainer = shadowRoot.getElementById('webact-shortcut-container');
                const shortcutRoot = ReactDOM.createRoot(rootContainer);

                shortcutRoot.render(
                    <ConfigProvider theme={{
                        components: {
                          Menu: {
                            itemHeight: 30
                          },
                        },
                      }} locale={zhCN}>
                        <SelectedIcon
                            selectedText={copiedText}
                            position={{
                                x: selectedElementRange.right,
                                y: selectedElementRange.top,
                            }}
                        />
                    </ConfigProvider>
                )
                return;
            }
        }
    } catch (err) {
        console.error("Failed to read clipboard contents: ", err);
    }
}, true);

function hasAncestorWithClassName(element, className) {
    if (element === document.documentElement) {
        return false;
    }

    if (element.parentElement && element.parentElement.classList.contains(className)) {
        return element.parentElement;
    }

    return hasAncestorWithClassName(element.parentElement, className);
}

window.addEventListener('resize', () => {
    const getWindow = () => {
        let x = window.screenX;
        let y = window.screenY;
        let w = window.innerWidth;
        let h = window.innerHeight;

        return [x, y, w, h];
    }
    console.log("[screenX, screenY, innerWidth, innnerHeight]:", getWindow());
});

document.addEventListener('click', function (event) {
    // 检查点击的元素是否是一个链接
    let link = event.target.closest('a');

    console.log('触发的点击click事件对象是：', event);
    console.log('触发的点击click target 事件对象是：', event.target);

    const invalidLinkPatterns = [
        /^#/, // Starts with '#'
        /^javascript:;/,
        /^javascript:void\(0\);?$/,
        /^javascript: void\(0\);?$/,
        /#$/ // Ends with '#'
    ];

    const isInvalidLink = (href) => {
        return invalidLinkPatterns.some(pattern => pattern.test(href));
    };

    // 检查 link.href 是否等于当前页面的根路径
    if (link && link.href && (link.href === '/' || link.href === window.location.origin + '/') && !(link.hasAttribute('target') && (link.target === '_blank' || link.target === '_black'))) {
        return; // 直接返回，不进行任何操作
    }

    if (link && link.href && !isInvalidLink(link.href)) {
        if (link.hasAttribute('target') && (link.target === '_blank' || link.target === '_black')) {
            // 阻止默认行为（打开链接）
            event.preventDefault();
            event.stopPropagation();

            // 将链接的目标设置为当前标签页
            link.target = '_self';
            console.log("window.location: ", window.location);

            window.location.href = link.href;
        } else if (!link.hasAttribute('target') && (!link.hasAttribute('tabindex') || !link.hasAttribute('aria-controls'))) {
            console.log("link.href: ", link.href);
            event.preventDefault();
            event.stopPropagation();

            // 将链接的目标设置为当前标签页
            link.target = '_self';
            console.log("window.location: ", window.location);

            window.location.href = link.href;
        }
    }
    let operationElement = hasAncestorWithClassName(event.target, 'Popover-content');
    if (operationElement) {
        operationElement.remove();
    }
}, true);

try {
    let shadowTreeContainer = document.createElement('div');
    shadowTreeContainer.id = 'webact-main-content';
    shadowTreeContainer.className = 'webact-main-content';
    shadowRoot = shadowTreeContainer.attachShadow({ mode: 'open' });
    // 添加样式main css style css
    let mainStyle = document.createElement('link');
    mainStyle.rel = 'stylesheet';
    mainStyle.href = chrome.runtime.getURL('static/css/main.css');

    let contentStyle = document.createElement('link');
    contentStyle.rel = 'stylesheet';
    contentStyle.href = chrome.runtime.getURL('antd.min.css');

    let selectedStyle = document.createElement('link');
    selectedStyle.rel = 'stylesheet';
    selectedStyle.href = chrome.runtime.getURL('selected.css');

    shadowRoot.appendChild(mainStyle);
    shadowRoot.appendChild(contentStyle);
    shadowRoot.appendChild(selectedStyle);

    let shortcutContainer = document.createElement('div');
    shortcutContainer.id = 'webact-shortcut-container';
    shortcutContainer.className = 'webact-shortcut-container';
    shadowRoot.appendChild(shortcutContainer);
    document.body.appendChild(shadowTreeContainer);
} catch (err) {
    console.log("create shadow dom container error info:", err);
}

try {
    let htmlParseScript = document.createElement('script');
    htmlParseScript.setAttribute('type', 'text/javascript');
    htmlParseScript.src = chrome.runtime.getURL('windowOpen.js');
    document.body.appendChild(htmlParseScript);
} catch (err) {
    console.log("insert script error info: ", err);
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background.js:", message);

    if (message.action === "webact-summary-all") {
        if (shadowRoot) {
            console.log("shadowRoot is not null");
        }
    }
})