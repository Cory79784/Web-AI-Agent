function specialActionName(response) {
    if (response.includes("go_backward()")) {
        return "Go Backward";
    }

    if (response.includes("go_forward()")) {
        return "Go Forward";
    }

    if (response.includes("refresh()")) {
        return "Refresh";
    }

    return null;
}

async function doAction(currentTabUrl, response, element_id, element_bbox, viewport_size, observation) {
    if (response) {
        console.log("Response:", response);
        let actionMatch = response.match(/action="([^"]*)"/);
        const argumentMatch = response.match(/argument="([^"]*)"/);
        const instructionMatch = response.match(/instruction="((?:\\"|[^"])*)"/);
        const queryMatch = response.match(/query="([^"]*)"/);
        const withScreenInfoMatch = response.match(/with_screen_info="([^"]*)"/);

        let actionName = actionMatch ? actionMatch[1] : specialActionName(response);
        

        const argument = argumentMatch ? argumentMatch[1] : null;
        const instruction = instructionMatch ? instructionMatch[1].replace(/\\"/g, '"') : null;
        const query = queryMatch ? queryMatch[1] : null;
        const withScreenInfo = withScreenInfoMatch ? withScreenInfoMatch[1] : null;

        let center_x = element_bbox['x'] + element_bbox['width'] / 2;
        let center_y = element_bbox['y'] + element_bbox['height'] / 2;

        let result = '';

        const waitForTimeout = (timeout) => {
            return new Promise((resolve) => {
                setTimeout(resolve, timeout);
            });
        };

        function simulateMouseClick(element, x, y, button = 'left') {
            if (element) {
                // 创建并触发 mousedown 事件
                const mousedownEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: button === 'right' ? 2 : 0,
                    // clientX: x,
                    // clientY: y
                });
                element.dispatchEvent(mousedownEvent);

                // 创建并触发 mouseup 事件
                const mouseupEvent = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: button === 'right' ? 2 : 0,
                    // clientX: x,
                    // clientY: y
                });
                element.dispatchEvent(mouseupEvent);

                // 创建并触发 click 事件
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: button === 'right' ? 2 : 0,
                    // clientX: x,
                    // clientY: y
                });
                element.dispatchEvent(clickEvent);
            }
        }

        function simulateKeyPress(element, key, isKeyDown = true) {
            const event = new KeyboardEvent(isKeyDown ? 'keydown' : 'keyup', {
                bubbles: true,
                cancelable: true,
                key: key,
                code: `Key${key.toUpperCase()}`,
                location: window.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
                view: window
            });
            element.dispatchEvent(event);
        }

        async function simulateTyping(element, text) {
            element.value = '';
            for (let i = 0; i < text.length; i++) {
                const char = text[i];

                simulateKeyPress(element, char, true); // keydown
                await new Promise(resolve => setTimeout(resolve, 50));

                element.value = element.value + char;

                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    data: char
                });
                element.dispatchEvent(inputEvent);

                simulateKeyPress(element, char, false); // keyup
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        async function simulateCombinationKeyPress(element, key1, key2) {
            simulateKeyPress(element, key1, true); // keydown key1
            await new Promise(resolve => setTimeout(resolve, 50));
            simulateKeyPress(element, key2, true); // keydown key2
            await new Promise(resolve => setTimeout(resolve, 50));
            simulateKeyPress(element, key2, false); // keyup key2
            await new Promise(resolve => setTimeout(resolve, 50));
            simulateKeyPress(element, key1, false); // keyup key1
        }

        function simulateMouseOver(element, x, y) {
            const mouseMoveEvent = new MouseEvent('mouseover', {
                // clientX: x,
                // clientY: y,
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(mouseMoveEvent);
        }

        function simulateMouseMove(element, x, y) {
            const mouseMoveEvent = new MouseEvent('mousemove', {
                // clientX: x,
                // clientY: y,
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(mouseMoveEvent);
        }

        function simulateMouseEnter(element, x, y) {
            const mouseMoveEvent = new MouseEvent('mouseenter', {
                // clientX: x,
                // clientY: y,
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(mouseMoveEvent);
        }

        async function simulateMouseWheel(deltaX, deltaY) {
            const wheelEvent = new WheelEvent('wheel', {
                deltaX: deltaX,
                deltaY: deltaY,
                bubbles: true
            });
            document.dispatchEvent(wheelEvent);
        }

        const simulateEnterKey = (searchElement) => {
            let focusInEvent = new FocusEvent('focusin', {
                bubbles: true,
                cancelable: false,
                type: 'focusin',
                composed: true,
                defaultPrevented: false,
                detail: 0,
                returnValue: true,
                view: window
            });
            searchElement.dispatchEvent(focusInEvent);

            let clickEvent = new PointerEvent('click', {
                bubbles: true,
                cancelable: true,
                cancelBubble: false,
                composed: true,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                button: 0,
                buttons: 0,
                pointerId: 1,
                pointerType: 'mouse',
                view: window,
                which: 1
            });

            searchElement.dispatchEvent(clickEvent);

            const keydownEvent = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13
            });
            searchElement.dispatchEvent(keydownEvent);

            const keypressEvent = new KeyboardEvent('keypress', {
                bubbles: true,
                cancelable: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13
            });
            searchElement.dispatchEvent(keypressEvent);

            const keyupEvent = new KeyboardEvent('keyup', {
                bubbles: true,
                cancelable: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13
            });
            searchElement.dispatchEvent(keyupEvent);
        };

        function simulateGoBack(timeout = 6000) {
            return new Promise(resolve => {
                setTimeout(() => {
                    window.history.back();
                    resolve();
                }, timeout);
            });
        }

        function simulateGoForward(timeout = 6000) {
            return new Promise(resolve => {
                setTimeout(() => {
                    window.history.forward();
                    resolve();
                }, timeout);
            });
        }

        if (actionName === 'Click') {
            // await page.mouse.click(center_x, center_y);
            // moveToElement(element, center_x, center_y);
            let element = await document.querySelector(`[data-label-id='${element_id}']`) || document.querySelector(`[data-bbox='${element_bbox.x, element_bbox.y, element_bbox.width, element_bbox.height}']`) || document.querySelector(`[data-backend-node-id='${element_id}']`);;
            if (element) {
                // if (element && !element.classList.contains('doaction-mouse-pointer')) {
                //   element.classList.remove('doaction-mouse-pointer');
                // }
                // await moveToElementAndDrawPointer(canvas, ctx, element, center_x, center_y);
                element.style.setProperty('border', '4px solid green', 'important');
                await waitForTimeout(1500);
                element.style.border = '';
                console.log("click element", element);

                // 模拟点击
                await simulateMouseClick(element, center_x, center_y, 'left')
                // let clickEvent = new MouseEvent('click', {
                //   view: window,
                //   bubbles: true,
                //   cancelable: true
                // });
                // await element.dispatchEvent(clickEvent);
            }
            result = { "operation": "do", "action": actionName, "kwargs": { "instruction": instruction }, "bbox": element_bbox };
            // if (element && element.classList.contains('doaction-mouse-pointer')) {
            //   element.classList.remove('doaction-mouse-pointer');
            // }
        } else if (actionName === 'Right Click') {
            let element = await document.querySelector(`[data-label-id='${element_id}']`) || document.querySelector(`[data-bbox='${element_bbox.x, element_bbox.y, element_bbox.width, element_bbox.height}']`) || document.querySelector(`[data-backend-node-id='${element_id}']`);;
            if (element) {
                console.log("Right element", element);

                // if (element && !element.classList.contains('doaction-mouse-pointer')) {
                //   element.classList.add('doaction-mouse-pointer');
                // }
                element.style.setProperty('border', '4px solid green', 'important');
                await waitForTimeout(1500);
                element.style.border = '';
                await element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, view: window }));
            }
            // await page.mouse.click(center_x, center_y, { button: 'right' });
            result = { "operation": "do", "action": actionName, "kwargs": { "instruction": instruction }, "bbox": element_bbox };
            // if (element && element.classList.contains('doaction-mouse-pointer')) {
            //   element.classList.remove('doaction-mouse-pointer');
            // }
        } else if (actionName === 'Type') {
            // if (element.parentElement && element.parentElement.classList.contains('doaction-mouse-pointer')) {
            //   element.parentElement.classList.remove('doaction-mouse-pointer');
            // }
            // await page.mouse.click(center_x, center_y, button='left');
            // await page.keyboard.press(matchKey('Meta+A'));
            // await page.keyboard.press('Backspace');
            // await page.keyboard.type(matchKey(argument));
            let element = await document.querySelector(`[data-label-id='${element_id}']`) || document.querySelector(`[data-bbox='${element_bbox.x, element_bbox.y, element_bbox.width, element_bbox.height}']`) || document.querySelector(`[data-backend-node-id='${element_id}']`);;
            if (element) {
                element.style.setProperty('border', '4px solid green', 'important');
                await waitForTimeout(1500);
                element.style.border = '';
            }
            if (element && element.tagName.toLowerCase() !== 'input') {
                for (var i = 0; i < element.childNodes.length; i++) {
                    if (element.childNodes[i].nodeType === Node.ELEMENT_NODE && element.childNodes[i].tagName.toLowerCase() === 'input') {
                        element = element.childNodes[i];
                        break;
                    }
                }
                if (element.parentElement.tagName.toLowerCase() === 'input') {
                    element = element.parentElement;
                }
            }
            if (element && element.tagName.toLowerCase() === 'iframe') {
                var iframe = element;
                var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                if (!iframeDocument) {
                    console.error('No document found in iframe');
                    return;
                }

                // 修改目标元素为 iframe 内部的实际输入区域
                // let iframeXpath = "//body[@class='cke_editable cke_editable_themed cke_contents_ltr cke_show_borders']"; // 修改为你具体的内部元素 xpath
                let iframeXpath = "//html/body"
                let iframeElement = iframeDocument.evaluate(iframeXpath, iframeDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (iframeElement && (iframeElement.tagName.toLowerCase() === 'input' || iframeElement.tagName.toLowerCase() === 'textarea' || iframeElement.classList.contains('cke_editable'))) {
                    await waitForTimeout(500);
                    iframeElement.focus();
                    iframeElement.innerHTML = ''; // 清空内容
                    await simulateInputInIframe(iframeDocument, iframeElement, argument);
                }
                return;
            }
            async function simulateInputInIframe(iframeDocument, element, text) {
                // Helper function to trigger keyboard events in the iframe document
                function triggerKeyEvent(eventType, key, code) {
                    const event = new KeyboardEvent(eventType, {
                        bubbles: true,
                        cancelable: true,
                        key: key,
                        code: code,
                        charCode: key.charCodeAt(0),
                        keyCode: key.charCodeAt(0),
                    });
                    element.dispatchEvent(event);
                }

                element.focus();

                let index = 0;
                while (index < text.length) {
                    const char = text[index];
                    const code = `Key${char.toUpperCase()}`;

                    // Trigger keyboard events for the current character
                    triggerKeyEvent('keydown', char, code);
                    triggerKeyEvent('keypress', char, code);

                    // Insert the text using document.execCommand
                    iframeDocument.execCommand('insertText', false, char);

                    // Trigger input and keyup events
                    const inputEvent = new Event('input', { bubbles: true });
                    element.dispatchEvent(inputEvent);

                    triggerKeyEvent('keyup', char, code);

                    // Type the next character after a short delay
                    await waitForTimeout(100);
                    // Refocus the editor and set the cursor position
                    element.focus();
                    const selection = iframeDocument.getSelection();
                    const range = iframeDocument.createRange();
                    range.selectNodeContents(element);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    index++;
                }
            }
            if (element && element.isContentEditable && (window.location.href.includes('.baidu.com') || window.location.href.includes('.douban.com'))) {
                // 清除现有内容
                element.innerHTML = '';

                // 模拟逐字符输入内容
                async function simulateEditableInput(content, el) {
                    for (let char of content) {
                        let textNode = document.createTextNode(char);
                        el.appendChild(textNode);
                        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                        el.dispatchEvent(inputEvent);
                        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
                        el.dispatchEvent(changeEvent);
                        await waitForTimeout(100); // 可调整间隔时间
                    }
                }

                element.focus();
                await simulateEditableInput(argument, element);
                console.log("input completed for contenteditable element: ", element);
            } else {
                console.log("The element could not be found or is not contenteditable.");
            }
            if (element && (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea')) {
                await waitForTimeout(500);
                // element.style.border = '';
                element.focus();
                element.value = argument;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                console.log("type element: ", element);
            }

            function clearDraftEditorContent() {
                const editorContent = document.querySelector('.public-DraftEditor-content');
                if (!editorContent) {
                    console.error('Editor content not found');
                    return;
                }

                // Focus the editor
                editorContent.focus();

                // Create a range to select all content
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(editorContent);
                selection.removeAllRanges();
                selection.addRange(range);

                // Simulate the delete key press
                const deleteEvent = new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelBubble: false,
                    cancelable: true,
                    defaultPrevented: true,
                    key: 'Delete',
                    code: 'Delete',
                    keyCode: 46,
                    which: 46,
                    view: window
                });
                editorContent.dispatchEvent(deleteEvent);

                // Trigger input event to notify Draft.js of the change
                const inputEvent = new Event('input', { bubbles: true });
                editorContent.dispatchEvent(inputEvent);
                let clearElement = editorContent.querySelector('.public-DraftStyleDefault-block.public-DraftStyleDefault-ltr');
                if (!window.location.href.includes('.zhihu.com') && clearElement) {
                    console.log("element.isContentedEditable: ", editorContent.isContentedEditable);

                    waitForTimeout(500);
                    // element.style.border = '';
                    clearElement.innerHTML = '';
                }
            }

            async function simulateInput(text) {
                const editorContent = document.querySelector('.public-DraftEditor-content');
                if (!editorContent) {
                    console.error('Editor content not found');
                    return;
                }

                // Helper function to trigger keyboard events
                function triggerKeyEvent(eventType, key, code) {
                    const event = new KeyboardEvent(eventType, {
                        bubbles: true,
                        cancelable: true,
                        key: key,
                        code: code,
                        charCode: key.charCodeAt(0),
                        keyCode: key.charCodeAt(0),
                    });
                    editorContent.dispatchEvent(event);
                }

                // Focus the editor
                editorContent.focus();

                // Simulate typing each character
                let index = 0;

                while (index < text.length) {
                    const char = text[index];
                    console.log("char: ", char)
                    console.log("index: ", index)
                    const code = `Key${char.toUpperCase()}`;
                    console.log("code: ", code)

                    // Trigger keyboard events for the current character
                    triggerKeyEvent('keydown', char, code);
                    triggerKeyEvent('keypress', char, code);
                    // Clear existing content (if any)

                    // Insert the text using document.execCommand
                    document.execCommand('insertText', false, char);

                    // Trigger input and keyup events
                    const inputEvent = new Event('input', { bubbles: true });
                    editorContent.dispatchEvent(inputEvent);

                    triggerKeyEvent('keyup', char, code);

                    // Type the next character after a short delay
                    await waitForTimeout(100);
                    // Refocus the editor and set the cursor position
                    editorContent.focus();
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(editorContent);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    index++;
                }
            }
            // 知乎发布文章的type 不是textarea也不是input, 而是一个draft-x插件，所以需要满足draft-x插件的输入方式
            console.log("Type Element: ", element);
            if (element && (element.classList.contains('public-DraftStyleDefault-block') || element.classList.contains('public-DraftEditor-content') || element.classList.contains('DraftEditor-editorContainer')) && (element.tagName.toLowerCase() === "div") && !window.location.href.includes('.douban.com')) {
                if (window.location.href.includes('.zhihu.com')) {
                    clearDraftEditorContent();
                    simulateInput(argument[0]);
                    clearDraftEditorContent();
                    simulateInput(argument);
                } else {
                    clearDraftEditorContent();
                    simulateInput(argument);
                }
            }

            result = { "operation": "do", "action": actionName, "kwargs": { "instruction": instruction, "argument": argument }, "bbox": element_bbox };
            // await waitForTimeout(1000);
            // if (element && element.classList.contains('doaction-mouse-pointer')) {
            //   element.classList.remove('doaction-mouse-pointer');
            // }
        } else if (actionName === 'Search') {
            // await page.mouse.click(center_x, center_y, button='left');
            let element = await document.querySelector(`[data-label-id='${element_id}']`) || document.querySelector(`[data-bbox='${element_bbox.x, element_bbox.y, element_bbox.width, element_bbox.height}']`) || document.querySelector(`[data-backend-node-id='${element_id}']`);;
            if (element) {
                // if (element.parentElement && !element.parentElement.classList.contains('doaction-mouse-pointer')) {
                //   element.parentElement.classList.add('doaction-mouse-pointer');
                // }
                element.style.setProperty('border', '4px solid green', 'important');
                await waitForTimeout(1500);
                element.style.border = '';
                let form = element.closest('form');
                var submitButton = form && form.querySelector('button[type="submit"]');
                var inputSubmitButton = form && form.querySelector('input[type="submit"]');
                if (form && form.checkValidity() && submitButton && !submitButton.disabled) {
                    console.log("button form: ", form);
                    element.value = argument;
                    form.target = '_self';
                    await waitForTimeout(500);
                    form.submit();
                } else if (form && form.checkValidity() && inputSubmitButton && !inputSubmitButton.disabled) {
                    element.value = argument;
                    form.target = '_self';
                    await waitForTimeout(500);
                    inputSubmitButton.click();
                } else {
                    // 模拟按键组合（例如：Meta+A）
                    await simulateCombinationKeyPress(element, 'Meta', 'A');

                    // 模拟删除（Backspace）
                    await simulateKeyPress(element, 'Backspace');

                    // 模拟输入（例如：输入字符串）
                    await simulateTyping(element, argument);
                    // await page.keyboard.press(matchKey('Meta+A'));
                    // await page.keyboard.press('Backspace');
                    // await page.keyboard.type(matchKey(argument));
                    await waitForTimeout(2000);
                    // await page.keyboard.press('Enter');

                    // await simulateKeyPress(element, 'Enter', true);
                    await simulateEnterKey(element);
                    // await page.waitForTimeout(500);
                    // weibo由于自己的搜索点击搜索事件有问题，这里做了特殊处理，后期weibo点击搜索事件修复了就可以去掉了
                    if ((window.location.href.includes('.baidu.com') || window.location.href.includes('x.com')) && form && form.checkValidity()) {
                        if (window.location.href.includes('tieba.baidu.com')) {
                            window.location.href = `https://tieba.baidu.com/f?ie=utf-8&kw=${encodeURIComponent(argument)}&fr=search`;
                        } else if (window.location.href.includes('x.com')) {
                            window.location.href = `https://x.com/search?q=${encodeURIComponent(argument)}`;
                        } else {
                            form.submit();
                        }
                    }

                    if (window.location.href.includes('https://arxiv.org/') && form && form.checkValidity()) {
                        form.submit();
                    }

                    // weibo由于自己的搜索点击搜索事件有问题，这里做了特殊处理，后期weibo点击搜索事件修复了就可以去掉了
                    if ((window.location.href.includes('https://www.weibo.com') || window.location.href.includes('https://weibo.com') || window.location.href.includes('https://s.weibo.com')) && argument) {
                        window.location.href = `https://s.weibo.com/weibo?q=${encodeURIComponent(argument)}`;
                    }
                }
            }
            result = { "operation": "do", "action": actionName, "kwargs": { "instruction": instruction, "argument": argument }, "bbox": element_bbox };

            // await waitForTimeout(1000);
            // if (element.parentElement && element.parentElement.classList.contains('doaction-mouse-pointer')) {
            //   element.parentElement.classList.remove('doaction-mouse-pointer');
            // }
        } else if (actionName === 'Hover') {
            let element = await document.querySelector(`[data-label-id='${element_id}']`) || document.querySelector(`[data-bbox='${element_bbox.x, element_bbox.y, element_bbox.width, element_bbox.height}']`) || document.querySelector(`[data-backend-node-id='${element_id}']`);
            if (element) {
                element.style.setProperty('border', '4px solid green', 'important');
                await waitForTimeout(1500);
                element.style.border = '';
                // if (!element.classList.contains('doaction-mouse-pointer')) {
                //   element.classList.add('doaction-mouse-pointer');
                // }
                await simulateMouseMove(element, center_x, center_y);
                await simulateMouseMove(element, center_x, center_y);
                await simulateMouseEnter(element, center_x, center_y);
                // await waitForTimeout(1000);
                // await page.mouse.move(center_x, center_y);
                // if (element.classList.contains('doaction-mouse-pointer')) {
                //   element.classList.remove('doaction-mouse-pointer');
                // }

            }
            // await page.mouse.move(center_x, center_y);
            // await page.waitForTimeout(500);
            result = { "operation": "do", "action": actionName, "kwargs": { "instruction": instruction }, "bbox": element_bbox };
        } else if (actionName === 'Scroll Down') {
            // await page.mouse.wheel(0, -(viewport_size['viewport_height'] * 2.0 / 3));
            const htmlElement = document.documentElement;
            const bodyElement = document.body;

            const removeOverflowHidden = (element) => {
                if (window.getComputedStyle(element).overflow === 'hidden') {
                    element.style.overflow = '';
                }
            };

            removeOverflowHidden(htmlElement);
            removeOverflowHidden(bodyElement);

            // function simulateWheel(element, deltaX, deltaY) {
            //   const event = new WheelEvent('wheel', {
            //     deltaX: deltaX,
            //     deltaY: deltaY,
            //     bubbles: true,
            //     cancelable: true,
            //     view: window
            //   });
            //   element.dispatchEvent(event);
            // }
            // await simulateWheel(document, 0, (viewport_size['viewport_height'] * 2.0 / 3));
            window.scrollBy(0, (viewport_size['viewport_height'] * 2.0 / 3));
            console.log("(viewport_size['viewport_height'] * 2.0 / 3): ", (viewport_size['viewport_height'] * 2.0 / 3));
            // window.scrollTo(0, (viewport_size['viewport_height'] * 2.0 / 3));
            result = { "operation": "do", "action": actionName };
        } else if (actionName === 'Scroll Up') {
            const htmlElement = document.documentElement;
            const bodyElement = document.body;

            const removeOverflowHidden = (element) => {
                if (window.getComputedStyle(element).overflow === 'hidden') {
                    element.style.overflow = '';
                }
            };

            removeOverflowHidden(htmlElement);
            removeOverflowHidden(bodyElement);
            // await page.mouse.wheel(0, (viewport_size['viewport_height'] * 2.0 / 3));
            window.scrollBy(0, -(viewport_size['viewport_height'] * 2.0 / 3));
            // window.scrollTo(0, -(viewport_size['viewport_height'] * 2.0 / 3));
            // window.scrollBy(0, (viewport_size['viewport_height'] * 2.0 / 3));
            result = { "operation": "do", "action": actionName };
        } else if (actionName === 'Press Enter') {
            let element = await document.querySelector(`[data-label-id='${element_id}']`) || document.querySelector(`[data-bbox='${element_bbox.x, element_bbox.y, element_bbox.width, element_bbox.height}']`) || document.querySelector(`[data-backend-node-id='${element_id}']`);;
            // if (!element.classList.contains('doaction-mouse-pointer')) {
            //   element.classList.add('doaction-mouse-pointer');
            // }
            if (element) {
                element.style.setProperty('border', '4px solid green', 'important');
                await waitForTimeout(1500);
                element.style.border = '';
                // await page.keyboard.press('Enter');
                await simulateKeyPress(element, 'Enter');
                console.log("Press Enter element: ", element);
            }

            result = { "operation": "do", "action": actionName, "kwargs": { "instruction": instruction } };
        } else if (actionName === 'Select Dropdown Option') {
            let element = await document.querySelector(`[data-label-id='${element_id}']`) || document.querySelector(`[data-bbox='${element_bbox.x, element_bbox.y, element_bbox.width, element_bbox.height}']`) || document.querySelector(`[data-backend-node-id='${element_id}']`);;
            // if (!element.classList.contains('doaction-mouse-pointer')) {
            //   element.classList.add('doaction-mouse-pointer');
            // }
            if (element) {
                element.style.setProperty('border', '4px solid green', 'important');
                await waitForTimeout(1500);
                element.style.border = '';
                if (element.tagName.toLowerCase() === 'select') {
                    let optionFound = false;
                    for (let option of element.options) {
                        if (option.text === argument || option.value === argument) {
                            element.value = option.value;
                            option.selected = true;
                            element.dispatchEvent(new Event('change', { bubbles: true }));
                            optionFound = true;
                            console.log(`Selected option: ${option.text}`);
                            break;
                        }
                    }
                    if (!optionFound) {
                        console.error(`Option "${argument}" not found in <select> element.`);
                    }
                } else if (element.tagName.toLowerCase() === 'input' && element.type === 'radio') {
                    // 处理 radio 按钮
                    let radioGroup = document.getElementsByName(element.name);
                    let optionFound = false;
                    for (let radio of radioGroup) {
                        if (radio.value === argument || radio.id === argument) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                            optionFound = true;
                            console.log(`Selected radio button: ${radio.value}`);
                            break;
                        }
                    }
                    if (!optionFound) {
                        console.error(`Radio button with value or id "${argument}" not found.`);
                    }
                } else if (element.tagName.toLowerCase() === 'input' && element.type === 'checkbox') {
                    // 处理 checkbox
                    if (argument.toLowerCase() === 'true' || argument === '1') {
                        element.checked = true;
                    } else if (argument.toLowerCase() === 'false' || argument === '0') {
                        element.checked = false;
                    }
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Checkbox ${argument.toLowerCase() === 'true' ? 'checked' : 'unchecked'}`);
                } else {
                    console.warn(`Element is not a <select>, radio button, or checkbox and cannot handle argument "${argument}".`);
                }
            }
            result = { "operation": "do", "action": "Select Dropdown Option", "kwargs": { "instruction": instruction } };
            // if (lastTurnElementTagName !== 'SELECT') {
            //     await page.mouse.click(center_x, center_y);
            // } else {
            //     const options = await getSelectElementOptions(lastTurnElement, lastTurnElementExtraInfo);
            //     const selectorOptionDict = {};
            //     for (const option of options) {
            //         selectorOptionDict[option.text.toLowerCase()] = option.value;
            //     }
            //     let flag = false;
            //     let value = null;
            //     for (const key in selectorOptionDict) {
            //         if (key.includes(argument.toLowerCase())) {
            //             flag = true;
            //             value = selectorOptionDict[key];
            //             break;
            //         }
            //     }

            //     if (!flag) {
            //         await page.mouse.click(center_x, center_y);
            //     }
            //     await lastTurnElement.selectOption({ value });
            //     lastTurnElementExtraInfo = { selected_value: value, selected_text: argument };
            //     result = {"operation": "do", "action": 'Select Dropdown Option', "kwargs": {"instruction": instruction}};
            // }
        } else if (actionName === 'Wait') {
            // await page.waitForTimeout(5000);
            await waitForTimeout(5000);
            result = { "operation": "do", "action": 'Wait' };
        } else if (actionName === 'Go Backward') {
            // await page.go_back(timeout=6000)
            await simulateGoBack();
            await waitForTimeout(6000);
            // await page.wait_for_load_state("load",timeout=60000)
            result = { "operation": "do", "action": 'Go Backward' };
        } else if (actionName === 'Go Forward') {
            // await page.go_forward()
            await simulateGoForward();
            await waitForTimeout(6000);
            // await page.wait_for_load_state("networkidle")
            result = { "operation": "do", "action": 'Go Forward' };
        } else if (actionName === 'Refresh') {
            // await page.waitForTimeout(2000);
            // await page.reload();
            // await page.waitForTimeout(2000);
            await waitForTimeout(2000);
            await window.location.reload();
            await waitForTimeout(2000);
            result = { "operation": "do", "action": 'Refresh' };
        } else if (actionName === 'Call_API') {
            result = { "operation": "do", "action": "Call API", "kwargs": { "argument": query, "with_screen_info": withScreenInfo, "instruction": observation } }
        } else if (actionName === 'Quote') {
            await waitForTimeout(500);
            result = { "operation": "do", "action": "Quote", "kwargs": { "query": query, "with_screen_info": withScreenInfo } }
        } else {
            result = '';
            throw new Error(`Unsupported action: ${actionName}`);
        }

        return result
    }
}

export default doAction;