/* global chrome */
import React, { useEffect, useState } from 'react';
import { Tooltip, Divider, Dropdown, Modal, Card, Input, Popover, Menu, Space } from 'antd';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // 你可以选择其他的主题
import { MessageOutlined, TranslationOutlined, PlusSquareOutlined, ReadOutlined, QuestionCircleOutlined, QuestionOutlined, ReadFilled } from '@ant-design/icons';

import './index.less';
import '@/common/styles/index.less'
import fetchChat from '../../../common/js/fetchChat';

const SelectedIcon = (props) => {
  const { selectedText, position } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [popVisible, setPopVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const markdownStyles = {
    ul: {
      listStyleType: 'square',
      // marginLeft: '10px',
    },
    ol: {
      listStyleType: 'square',
      // marginLeft: '10px',
    },
    li: {
      listStyleType: 'square',
      marginBottom: '10px',
    },
    code: {
      fontWeight: 900,
      wordBreak: 'break-word',
      borderRadius: '2px',
      overflowX: 'auto',
      fontSize: '.87em',
      padding: '.065em .4em',
      backgroundColor: '#fbe5e1',
      color:'#c0341d',
    }
  };

  const handleVisibleChange = (newVisible) => {
    setPopVisible(newVisible);
  };

  const handleDropdownVisibleChange = (newVisible) => {
    setDropdownVisible(newVisible);
  }

  const items = [
    {
      label: '解释',
      key: '1',
      icon: <QuestionCircleOutlined />,
      onClick: () => handleAction("explain") && handleDropdownVisibleChange(!dropdownVisible)
    },
    {
      type: 'divider'
    },
    {
      label: '总结内容',
      key: '2',
      icon: <ReadOutlined />,
      onClick: () => handleAction("summary") && handleDropdownVisibleChange(!dropdownVisible)
    },
    {
      type: 'divider'
    },
    {
      label: '翻译',
      key: '3',
      icon: <TranslationOutlined />,
      onClick: () => handleAction("translate") && handleDropdownVisibleChange(!dropdownVisible)
    },
    {
      type: 'divider'
    },
    {
      label: '聊天',
      key: '4',
      disabled: true,
      icon: <MessageOutlined />
    },
    {
      type: 'divider'
    },
    {
      label: '添加指令',
      key: '5',
      disabled: true,
      icon: <PlusSquareOutlined />,
      onClick: () => handleAction("addAction") && handleDropdownVisibleChange(!dropdownVisible)
    },
  ]

  const quickItems = [
    {
      label: '快速提问',
      key: '1',
      icon: <QuestionOutlined />,
      onClick: () => handleAction("quickAsk") && handleVisibleChange(!popVisible)
    },
    {
      type: 'divider'
    },
    {
      label: '总结全文',
      key: '2',
      icon: <ReadFilled />,
      onClick: () => handleAction("summaryAll") && handleVisibleChange(!popVisible),
    }
  ]

  useEffect(() => {
    return () => {
      console.log('unmount');
    }
  }, []);

  async function getStreamCompletion(prompt, glm4Key) {
    let tools = [{
      "type": "web_search",
      "web_search": {
        "enable": false  // Disable: False, Enable: True, default is True.
      }
    }];
    async function postData(url = "", data = {}, glm4Key) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${glm4Key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data) // body data type must match "Content-Type" header
        });

        return response // parses JSON response into native JavaScript objects
      } catch (error) {
        console.error(error);
        alert(`网络请求失败，请检查网络连接或稍后重试。${error}`);
        return;
      }
    }

    const res = await postData('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      model: "glm-4-0520",  // 填写需要调用的模型名称
      messages: [
        { "role": "user", "content": prompt },
      ],
      stream: true,
      tools: tools
    }, glm4Key);

    return res;
  }

  const fetchActionOperator = async (selectedText, actionType) => {
    // const url = "http://36.103.203.22:24080/v1/chat";
    let prompt = '';

    const actionPrompts = {
      '全文总结': `请详细阅读正文并按照下面要求的格式返回笔记。\n全文总结应提供一个宏观的视角，概括文章的主题和主要观点，而不涉及具体的细节，字数不超过200字。全文总结的标题单独成行。\n重要亮点则应专注于文章的关键细节、独特见解或数据点。重要亮点的标题单独成行。\n请使用 Markdown 语法来格式化输出。\n\n全文总结：\n{你对文章主题和主要观点的概括性描述}\n\n重要亮点：\n{请用bullet point的形式列出文章中的关键细节、独特见解或数据点} \n\n 全文内容: \n ${selectedText.bodyContent}`,
      '翻译': `请翻译以下内容并按照下面要求进行翻译\n\n1.如果检测到是其他语言，请翻译为中文。 \n2.如果检测到是日文，请翻译为中文。\n3.如果检测到是中文，请翻译为英文。\n4.只返回翻译的内容。\n内容:\n${selectedText}`
    };

    if (actionType && actionPrompts[actionType]) {
      prompt = actionPrompts[actionType];
    } else if (actionType && actionType !== '翻译' && actionType !== '全文总结') {
      prompt = `请帮忙${actionType}内容${selectedText}`;
    } else {
      prompt = `请根据以下内容：${selectedText}回答`;
    }

    let glm4Response = await getStreamCompletion(prompt, "b524933e39f7ab81a6ab1ed986d0ab7d.uf0nNYsUGiEHlD12");

    return glm4Response;
  }

  const handleResponseResult = async (response) => {
    const reader = response.body.getReader();
    let decoder = new TextDecoder('utf-8');

    let done = false
    let buffer = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      const text = decoder.decode(value, { stream: true });
      buffer += text;

      let boundary = buffer.indexOf('\n'); // 假设每条消息以换行符结束
      const message = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);

      if (message) {
        if (message.slice("data: ".length).includes("[DONE]")) {
          break;
        }
        let jsonMessage = JSON.parse(message.slice("data: ".length));
        if (jsonMessage.choices && jsonMessage.choices[0].delta && jsonMessage.choices[0].delta.content) {
          setModalContent(prevModalContent => (prevModalContent + jsonMessage.choices[0].delta.content));
        }
      }
    }
  };

  const handleAction = async (actionType) => {
    console.log(actionType);
    if (actionType === "explain") {
      setModalTitle('解释');
      setIsModalOpen(true);

      const response = await fetchActionOperator(selectedText, '解释');
      if (response) {
        handleResponseResult(response);
      }
    } else if (actionType === "summary") {
      setModalTitle('总结');
      setIsModalOpen(true);
      const response = await fetchActionOperator(selectedText, '总结');
      if (response) {
        handleResponseResult(response);
      }
    } else if (actionType === "translate") {
      setModalTitle('翻译');
      setIsModalOpen(true);
      const response = await fetchActionOperator(selectedText, '翻译');
      if (response) {
        handleResponseResult(response);
      }
    } else if (actionType === "quickAsk") {

      setModalTitle('快速提问');
      setIsModalOpen(true);

      const response = await fetchActionOperator(selectedText);
      if (response) {
        handleResponseResult(response);
      }
    } else if (actionType === "addAction") {
      // setModalTitle('添加指令');
      // setModalContent('添加指令内容');
      // setIsModalOpen(true);
    } else if (actionType === "summaryAll") {
      setModalTitle('全文总结');
      setIsModalOpen(true);
      const htmlText = await getSummaryHtmlInfo();
      console.log("htmlText: ", htmlText);
      const response = await fetchActionOperator(htmlText, '全文总结');
      if (response) {
        handleResponseResult(response);
      }
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false);
  }

  const getSummaryHtmlInfo = () => {
    return new Promise((resolve, reject) => {
      function ctx2tree(ctx) {
        // Remove unnecessary tags like style and script
        ctx = ctx.replace(/<!--[\s\S]*?-->/g, '');
        ctx = ctx.replace(/<style[\s\S]*?<\/style>/g, '');
        ctx = ctx.replace(/<script[\s\S]*?<\/script>/g, '');
        ctx = ctx.replace(/<link[\s\S]*?>/g, '');
        ctx = ctx.replace(/<noscript[\s\S]*?<\/noscript>/g, '');
        ctx = ctx.replace(/<plasmo-csui[\s\S]*?<\/plasmo-csui>/g, '');
        ctx = ctx.replace(/<svg\b[^>]*>(.*?)<\/svg>/g, '<svg></svg>');
        ctx = ctx ? ctx.replace(/\s+/g, ' ').trim() : '';

        // Find <meta charset="..."> tag
        const charsetMatch = ctx.match(/<meta charset="([^"]*)">/);
        let parser = new DOMParser({
          explicitDocumentType: true,
          proxyDocument: {
            encoding: 'utf-8'
          }
        });

        if (charsetMatch) {
          const charset = charsetMatch[1];
          parser = new DOMParser({
            explicitDocumentType: true,
            proxyDocument: {
              encoding: charset
            }
          });
          console.log('Charset:', charset);
        } else {
          console.log('Charset not found');
        }

        // Parse HTML string into DOM tree
        let doc = parser.parseFromString(ctx, 'text/html');

        // Function to remove elements with display: none in inline style
        function removeHiddenElements(doc) {
          const elements = doc.querySelectorAll('*');
          elements.forEach(el => {
            const style = el.getAttribute('style');
            if (style && (
              style.includes('display: none') ||
              style.includes('display:none') ||
              style.includes('visibility: hidden') ||
              style.includes('visibility:hidden') ||
              style.includes('opacity: 0') ||
              style.includes('opacity:0') ||
              style.includes('position: absolute') && style.includes('left: -9999px') ||
              style.includes('clip: rect(0, 0, 0, 0)') ||
              style.includes('clip-path: inset(100%)') ||
              style.includes('height: 0') ||
              style.includes('height:0') ||
              style.includes('width: 0') ||
              style.includes('width:0')
            )) {
              el.remove();
            }
            let attributes = el.attributes;

            while (attributes.length > 0) {
              el.removeAttribute(attributes[0].name);
            }
          });
        }

        removeHiddenElements(doc);

        // Extract title from <head>
        let title = doc.querySelector('title') ? doc.querySelector('title').textContent : 'No Title Found';

        // Function to get content from body with newline separation
        function getContentWithNewLines(doc) {
          let bodyContent = '';
          const bodyElements = doc.querySelector('body').children;

          for (let element of bodyElements) {
            bodyContent += element.textContent.trim() + '\n';
          }

          return bodyContent.trim();
        }

        let bodyContent = getContentWithNewLines(doc);

        return { title, bodyContent };
      }

      let { title, bodyContent } = ctx2tree(document.querySelector('body').outerHTML);

      if (bodyContent) {
        resolve({ title, bodyContent });
      } else {
        console.log("Failed to get html body");
        reject(new Error("Failed to execute script"));
      }
    });
  }

  return (
    <>
      <Modal title={modalTitle} open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div className="selected-modal-main" style={{
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'default',
        }}>
          <div className="selected-modal-content" style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1',
            minHeight: '100px',
            maxHeight: '400px',
            height: '300px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            scrollbarColor: 'auto',
          }}>
            <Card style={{ width: '100%', padding: '12px' }} bodyStyle={{ padding: 0 }} className="selected-modal-card" styles={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '0',
            }}>
              {
                selectedText && <div className="selected-modal-qutoa" style={{
                  position: 'relative',
                  padding: '4px 0',
                  borderRadius: '6px',
                  background: 'rgba(79,89,102,0.08)',
                }}>
                  <div className="content" style={{
                    padding: '0 12px',
                    color: 'rgba(134,134,146,1)',
                    fontSize: '14px',
                    fontStyle: 'normal',
                    fontWeight: '400',
                    lineHeight: '22px',
                    maxHeight: '44px',
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordWrap: 'break-word',
                    display: '-webkit-box',
                  }}>{modalTitle && modalTitle === '全文总结' ? modalTitle : selectedText}</div>
                </div>
              }
              <div>
                {
                  modalContent && <div className="selected-modal-result" style={{
                    marginTop: '10px',
                    maxHeight: '100%',
                  }}>
                    <div>
                      <div className="content-box" style={{
                        position: 'relative',
                        height: '100%',
                        padding: '0 12px',
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        overflow: "hidden"                      
                      }}>
                        <ReactMarkdown components={{
                          ul: ({node, ...props}) => <ul style={markdownStyles.ul} {...props} />,
                          ol: ({node, ...props}) => <ul style={markdownStyles.ol} {...props} />,
                          li: ({node, ...props}) => <li style={markdownStyles.li} {...props} />,
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                children={String(children).replace(/\n$/, '')}
                                style={solarizedlight}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              />
                            ) : (
                              <code style={markdownStyles.code} className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}  remarkPlugins={[gfm]}>{modalContent}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                } <div className="flex w-full flex-row">
                  <div className="flex-1">
                    <div className='loading'>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                </div>
                </div>
            </Card>
          </div>
          {/* <div className="selected-modal-footer">
            <Input.TextArea placeholder="继续问我任何问题" autoSize={{ minRows: 2, maxRows: 6 }} disabled></Input.TextArea>
          </div> */}
        </div>
      </Modal>
      {/* <div className="selected-icon-root"> */}
      <div className="selected-icon-main" >
        {selectedText && (
          <div
            className="selected-icon-container"
            style={{
              left: `${position.x + 10}px`,
              top: `${position.y}px`,
            }}>
            <div className="selected-box">
              <div className="selected-inner">
                <div className="left">
                  {/* <Dropdown key="answer" menu={{
                quickItems,
                selectable: true
              }}> */}
                  {/* <Tooltip title="快速提问"> */}
                  <Popover arrow={false} trigger="hover" open={popVisible} onOpenChange={handleVisibleChange} style={{ padding: 0 }} placement="bottomLeft" overlayStyle={{ padding: 0 }} overlayInnerStyle={{ padding: 0 }} content={<Menu itemHeight={30} items={quickItems} selectable={true} style={{ borderRadius: '8px' }} />}>
                    <div className="shortcut-action">
                      <img
                        src="data:image/png;base64,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"
                        alt="answer" />
                    </div>
                  </Popover>
                  {/* </Tooltip> */}
                  {/* </Dropdown> */}
                </div>
                <Dropdown open={dropdownVisible} onOpenChange={handleDropdownVisibleChange} destroyPopupOnHide={true} key="action" menu={{
                  items,
                  selectable: true,
                  itemHeight: 30
                }}>
                  <div
                    className="right"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    {/* <Tooltip title="操作指令"> */}
                    <div className="action">指令</div>
                    {/* </Tooltip> */}
                  </div>
                </Dropdown>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* </div> */}
    </>
  );
};

export default SelectedIcon;
