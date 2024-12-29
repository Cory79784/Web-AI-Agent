/*global chrome*/
chrome.action.onClicked.addListener(async (tab) => {
    const tabId = tab.id;
    const regex = /^(?:https?:\/\/)?(?:www\.)?(localhost|[\w.-]+\.[a-zA-Z]{2,})(:\d+)?(\/\S*)?(#\S*)?$/;
    // const regex = /^(?:https?:\/\/)?(?:www\.)?(localhost|[\w-]+\.[\w.-]{2,})(?:\/\S*)*$/;
    if (tab.url && regex.test(tab.url)) {
        chrome.sidePanel.setOptions({
            tabId,
            path: 'index.html',
            enabled: true
        });
        chrome.sidePanel.open({ tabId });
    } else {
        // Disables the side panel on all other sites
        chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background.js:", message);

    if (message.action === "chat") {
        // console.log("Processing chat action...");
        // const instruction = message.instruction;

        // if (instruction) {
        //     console.log("Instruction provided:", instruction);
        //     // processChatInstruction(instruction, sendResponse);
        //     return true;
        // } else {
        //     console.log("No instruction provided.");
        //     sendResponse({ status: "failure", message: "No instruction provided" });
        //     return true;
        // }
    } else if (message.action === 'changeUrl') {
        // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        //     if (chrome.runtime.lastError) {
        //         console.error("chrome.tabs.query error:", chrome.runtime.lastError);
        //         sendResponse({ status: "failure", message: chrome.runtime.lastError.message });
        //         return;
        //     }

        //     if (!tabs.length) {
        //         console.error("No active tabs found.");
        //         sendResponse({ status: "failure", message: "No active tabs found" });
        //         return;
        //     }

        //     const currentTab = tabs[0];
        //     const currentTabId = currentTab.id;
        //     const currentTabUrl = currentTab.url;

        //     if (!currentTabUrl || currentTabUrl.startsWith('devtools://')) {
        //         console.error("Cannot access devtools URL.");
        //         sendResponse({ status: "failure", message: "Cannot access devtools URL" });
        //         return;
        //     }

        //     chrome.scripting.executeScript({
        //         target: { tabId: currentTabId },
        //         func: changeUrl,
        //         args: [message.url]
        //     }, (results) => {
        //         if (results && results[0] && results[0].result) {
        //             sendResponse({ status: "success", message: "Change Url successfully" });
        //         } else {
        //             console.log("Failed to execute script.");
        //             sendResponse({ status: "failure", message: "Failed to execute script" });
        //         }
        //     });
        // });
        // return true;
    } else {
        sendResponse({ status: "failure", message: "Unknown action" });
        return true;
    }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "webact-summary-all",
      title: "打开插件总结全文",
      contexts: ["all"]
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "webact-summary-all") {
        chrome.runtime.sendMessage("webact-summary-all", { tabId: tab.id });
        // const tabId = tab.id;
        // const regex = /^(?:https?:\/\/)?(?:www\.)?(localhost|[\w.-]+\.[a-zA-Z]{2,})(:\d+)?(\/\S*)?(#\S*)?$/;
        // // const regex = /^(?:https?:\/\/)?(?:www\.)?(localhost|[\w-]+\.[\w.-]{2,})(?:\/\S*)*$/;
        // if (tab.url && regex.test(tab.url)) {
        //      chrome.sidePanel.setOptions({
        //         tabId,
        //         path: 'index.html',
        //         enabled: true
        //     });
        //     chrome.sidePanel.open({ tabId });
        // } else {
        //     // Disables the side panel on all other sites
        //     chrome.sidePanel.setOptions({
        //         tabId,
        //         enabled: false
        //     });
        // }
    }
  });