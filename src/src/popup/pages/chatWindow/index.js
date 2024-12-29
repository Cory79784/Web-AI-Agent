/* global chrome */
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Avatar, TextArea, Tag, Spin, Collapse, Divider, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { MessageFilled, PlayCircleFilled, EditFilled } from "@ant-design/icons";
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // 你可以选择其他的主题

import GlobalInput from "../../components/GlobalInput";
import Answer from '../../components/Answer';
import UserSvg from '@/assets/user.svg';
import AnswerSvg from "@/assets/answer.png";
import getHtmlInfo from '../../../common/js/getHtmlInfo';
import doAction from '../../../common/js/doAction';
import fetchChat from '../../../common/js/fetchChat';
import DislikeSvg from "@/assets/dislike.svg";
import LikeSvg from "@/assets/like.svg";
import './index.less';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(true);
  const [round, setRound] = useState(0);
  const [exit, setExit] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [renderMessages, setRenderMessages] = useState([]);
  const [parseJsonl, setParseJsonl] = useState([]);
  const [isSummary, setIsSummary] = useState(false);
  // const [isPaused, setIsPaused] = useState(false);
  const isPaused = useRef(false);
  const chatWindowRef = useRef(null);
  const gref = useRef(null);

  // useEffect(() => {
  // 当消息列表更新时,自动滚动到最新消息
  //   chatWindowRef.current.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  useEffect(() => {
    // console.log("测试");
    console.log("isFinished: ", isFinished);
  }, [isFinished]);

  useEffect(() => {
    // This effect will run every time the messages state changes
    // console.log('Messages updated:', messages);
  }, [messages]);

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
      marginLeft: '20px',
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

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() !== '') {
      setMessages([...messages, { content: inputValue, sender: 'me' }]);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const runChat = async () => {

  }

  const waitForTimeout = (timeout) => {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  };

  const sendMessageToBackground = (message) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  };

  const fetchDataAndDecode = async (data, sessionId) => {
    const url = 'http://36.103.203.22:24080/v1/controller';
    const res = await fetchChat(url, {
      "session_id": sessionId,
      ...data
    });

    if (res.status !== 200 || !res.ok) {
      console.error("Fetch failed:", res);
      return null;
    }

    const contentType = res.headers.get('content-type');
    console.log('Content-Type:', contentType);
    const reader = res.body.getReader();
    let decoder = new TextDecoder('utf-8');
    let done = false;
    let observation = '';
    let result_buffer = '';

    if (contentType && contentType.includes('text/event-stream')) {
      let buffer = '';
      
      let isBreak = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        if (value) {

          const text = decoder.decode(value, { stream: true });
          
          buffer += text;

          // if (index > 0) {
            let boundary = buffer.indexOf('\n');
            while (boundary !== -1) {
              const message = buffer.slice(0, boundary).trim();
              buffer = buffer.slice(boundary + 1);

              if (message) {
                const parsedMessage = JSON.parse(message);
                if (parsedMessage['response']) {
                  result_buffer = message;
                  isBreak = true;
                  break;
                } else if (parsedMessage['finish_reason'] && parsedMessage['finish_reason'] === 'sensitive') {
                  observation += "对不起，您提供的页面信息涉及到了敏感词汇！";
                  isBreak = true;
                  break;
                } else {
                  const jsonMessage = parsedMessage;
                  observation += jsonMessage['message_delta'];
                  boundary = buffer.indexOf('\n');
                }
              }
            }
          // } else {
          //   result_buffer = buffer;
          // }

          if (isBreak) {
            break;
          }
        }

        done = doneReading;
      }
      console.log("result buffer: ", result_buffer);
      console.log("observation: ", observation);
      return {
        ...JSON.parse(result_buffer), 
        observation: observation
      };
    } else {
      let actionDone = false;
      let actionResultBuffer = '';
      const { value, actionDone: doneReading } = await reader.read();
      while (!actionDone) {
        if (value) {
          const text = decoder.decode(value, { stream: true });
          actionResultBuffer += text;
          if (actionResultBuffer.includes("response")) {
            break;
          }
        }
        actionDone = doneReading;
      }
      console.log("result_buffer: ", actionResultBuffer);
      return {
        ...JSON.parse(actionResultBuffer)
      }
    }
  };

  const fetchSummaryPage = async (pageHtml) => {
    const url = "http://36.103.203.22:24080/v1/chat";
    const res = await fetchChat(url, {
      type: 'summary',
      html_text: pageHtml,
      stream: true,
    });

    if (res.status !== 200 || !res.ok) {
      console.error("Fetch failed:", res);
      return null;
    }

    return res;
  }

  const onReadPage = async () => {
    setIsSummary(true);
    if (loading) return;
    let value = "请帮我总结全文";
    if (value) {
      if (isPaused.current) {
        isPaused.current = false;
      }
      setMessages(prevMessages => [
        ...prevMessages,
        { id: uuidv4(), role: 'Human', parts: [{ content: value, type: 'text' }], stop: true }
      ]);
      setLoading(true);
      setIsFinished(false);

      try {
        const pageHtml = await getSummaryPageHtml();
        if (pageHtml) {
          const response = await fetchSummaryPage(pageHtml);
          if (response) {
            const reader = response.body.getReader();
            let decoder = new TextDecoder('utf-8');

            let done = false
            let buffer = '';
            setLoading(false);
            while (!done) {
              const { value, done: doneReading } = await reader.read();
              const text = decoder.decode(value, { stream: true });
              buffer += text;

              let boundary = buffer.indexOf('\n'); // 假设每条消息以换行符结束
              const message = buffer.slice(0, boundary).trim();
              buffer = buffer.slice(boundary + 1);
              if (message) {
                if (JSON.parse(message)['finish_reason'] && JSON.parse(message)['finish_reason'] === 'stop') {
                  setMessages(prevMessages => {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[updatedMessages.length - 1].stop = true;
                    return updatedMessages;
                  })
                  setIsFinished(true);
                  break;
                } else if (JSON.parse(message)['finish_reason'] && JSON.parse(message)['finish_reason'] === 'sensitive') {
                  setMessages(prevMessages => {
                    // 如果不存在相同的id，插入新的消息对象
                    return [
                      ...prevMessages,
                      { id: JSON.parse(message)['session_id'], role: 'Bot', parts: [{ content: "对不起，您提供的页面信息涉及到了敏感词汇！", type: 'text' }], stop: true, messageType: 'summary' }
                    ];
                  });
                  setIsFinished(true);
                  break;
                } else {
                  const jsonMessage = JSON.parse(message);
                  setMessages(prevMessages => {
                    // 找到是否已经存在相同的id
                    const existingMessageIndex = prevMessages.findIndex(msg => msg.id === jsonMessage.session_id);

                    if (existingMessageIndex !== -1) {
                      // 如果存在相同的id，将新的内容合并到parts中
                      const updatedMessages = [...prevMessages];
                      updatedMessages[existingMessageIndex].parts = [
                        ...updatedMessages[existingMessageIndex].parts,
                        { content: jsonMessage['message_delta'], type: 'text' }
                      ];
                      return updatedMessages;
                    } else {
                      // 如果不存在相同的id，插入新的消息对象
                      return [
                        ...prevMessages,
                        { id: jsonMessage.session_id, role: 'Bot', parts: [{ content: jsonMessage['message_delta'], type: 'text' }], messageType: 'summary' }
                      ];
                    }
                  });
                  boundary = buffer.indexOf('\n');
                }
              }
            }
          }
        }
      } catch (error) {
        console.log("Error fetching summary page or reading response:", error);
      } finally {
        setLoading(false);
      }
    }
  }

  const handleCleanMessages = (value) => {
    isPaused.current = true;
    setMessages(value);
  }

  const onPressEnter = async (value) => {
    setIsSummary(false);
    if (loading) return;
    if (value) {
      setLoading(true);
      setExit(false);
      setSessionId(null);
      setIsFinished(false);
      if (isPaused.current) {
        isPaused.current = false;
      }
      setMessages(prevMessages => [
        ...prevMessages,
        { id: uuidv4(), role: 'Human', parts: [{ content: value, type: 'text' }], stop: true }
      ]);
      let localSessionId = null;

      const chatLoop = async () => {
        let currentRound = 1;
        let currentExit = false;

        while (currentRound <= 30 && !currentExit) {
          console.log("isPaused current: ", isPaused.current);
          if (isPaused.current) {
            setLoading(false);
            setIsFinished(true);
            setMessages(prevMessages => {
              const updatedMessages = [...prevMessages];
              updatedMessages[updatedMessages.length - 1].stop = true;
              updatedMessages[updatedMessages.length - 1].paused = true;
              return updatedMessages;
            })
            message.success("已暂停");
            break;
          }

          try {
            const response = await processChatInstruction(value);
            if (isPaused.current) break;
            if (response && response.status === 'success') {
              const responseData = await fetchDataAndDecode(response.data, localSessionId);
              if (isPaused.current) {
                setLoading(false);
                setIsFinished(true);
                setMessages(prevMessages => {
                  const updatedMessages = [...prevMessages];
                  updatedMessages[updatedMessages.length - 1].stop = true;
                  updatedMessages[updatedMessages.length - 1].paused = true;
                  return updatedMessages;
                })
                message.success("已暂停");
                break;
              };
              if (!responseData) continue;

              console.log('Response Data:', responseData);
              console.log('localSessionId: ', localSessionId);
              setRound(responseData.round);
              localSessionId = responseData.session_id;
              setSessionId(responseData.session_id);

              // const action = await parseAction(responseData.response);
              if (responseData.response && responseData.response.includes('exit')) {
                setExit(true);
                setLoading(false);
                setIsFinished(true);

                let messsageMatch = responseData.response.match(/message="([^"]*)"/);
                let message = messsageMatch ? messsageMatch[1] : null;
                let content = {
                  "operation": "do",
                  "action": "exit",
                  "round": responseData.round,
                  "kwargs": { "instruction": message }
                };
                setMessages(prevMessages => {
                  // 找到是否已经存在相同的id
                  const existingMessageIndex = prevMessages.findIndex(msg => msg.id === responseData.session_id);

                  if (existingMessageIndex !== -1) {
                    // 如果存在相同的id，将新的内容合并到parts中
                    const updatedMessages = [...prevMessages];
                    updatedMessages[existingMessageIndex].parts = [
                      ...updatedMessages[existingMessageIndex].parts,
                      { content: content, type: 'text' }
                    ];
                    updatedMessages[existingMessageIndex].stop = true;
                    return updatedMessages;
                  } else {
                    // 如果不存在相同的id，插入新的消息对象
                    return [
                      ...prevMessages,
                      { id: responseData.session_id, role: 'Bot', parts: [{ content: content, type: 'text' }], stop: true }
                    ];
                  }
                });
                currentExit = true;
                break;
              }

              console.log("response.data.viewport_size: ", response.data.viewport_size);
              const result = await executeScriptOnActiveTab(
                responseData.response,
                responseData.element_id ? responseData.element_id : 0,
                responseData.element_bbox ? responseData.element_bbox : { "height": 0, "width": 0, "x": 0, "y": 0 },
                response.data.viewport_size,
                responseData.observation ? responseData.observation : ''
              );
              if (isPaused.current) {
                setLoading(false);
                setIsFinished(true);
                setMessages(prevMessages => {
                  const updatedMessages = [...prevMessages];
                  updatedMessages[updatedMessages.length - 1].stop = true;
                  updatedMessages[updatedMessages.length - 1].paused = true;
                  return updatedMessages;
                })
                message.success("已暂停");
                break;
              };
              if (result) {
                await addBotMessage(responseData.session_id, responseData.round, result);
                setLoading(false);
              }

            } else {
              console.log("No response from background.js.");
              setLoading(false);
              setIsFinished(true);
              message.error(`Request Error ${response.status}`);
              break;
            }
          } catch (error) {
            console.error("Error during chat loop:", error);
            setLoading(false);
            setIsFinished(true);
            message.error(`Error during chat loop: ${error}`);
            break;
          } finally {
            setLoading(false);
          }
          currentRound = currentRound + 1;
          await waitForTimeout(2000);
        }
      }
      await chatLoop();
      setIsFinished(true);
      setLoading(false);
    }
  };

  const onPauseChat = async () => {
    console.log("onPauseChat")
    // setIsPaused(true);
    isPaused.current = true;
  }

  const onStopPauseChat = async () => {
    console.log("onStopPauseChat");
    isPaused.current = false;
  }

  const parseJsonlContent = (content) => {
    return content.trim().split('\n').map((line) => JSON.parse(line));
  }

  const onJsonlFileRead = async (content) => {
    const parseJsonlData = parseJsonlContent(content);
    setParseJsonl(parseJsonlData);
    if (parseJsonlData && parseJsonlData.length > 0) {
      for (const parseJsonlItem of parseJsonlData) {
        console.log("parseJsonlItem url: ", parseJsonlItem.url);
        console.log("parseJsonlItem task: ", parseJsonlItem.task);
        if (parseJsonlItem && parseJsonlItem.url) {
          const changeUrlRes = await changeUrl(parseJsonlItem.url);
          if (changeUrlRes) {
            await waitForTimeout(7000);
            await onPressEnter(parseJsonlItem.task);
            console.log("success");
          } else {
            console.log("error");
          }
        }
      }
    }
    console.log("parseJsonlData", parseJsonlData);
  }

  const handleRunPlaywright = (data) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: "doAction", actionData: data }, (response) => {
        if (response && response.status && response.status === 'success') {
          resolve(response);
        } else {
          reject(new Error("Failed to execute doAction"));
        }
      });
    });
  }
  // 尝试api调入
  // const handleRunPlaywright = async (data) => {
  //   console.log("playwright data: ", data);
  //   try {
  //     const res = await fetch('http://localhost:3000/v1/playwright/doaction', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(data),
  //     });
  //     const result = await res.json();
  //     return result;
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // }

  // useEffect(async () => {

  // }, [parseJsonl]);

  const changeUrl = async (url) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error("chrome.tabs.query error:", chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }

        if (!tabs.length) {
          console.error("No active tabs found.");
          return reject(new Error("No active tabs found"));
        }

        const currentTab = tabs[0];
        const currentTabId = currentTab.id;
        const currentTabUrl = currentTab.url;

        if (!currentTabUrl || currentTabUrl.startsWith('devtools://')) {
          console.error("Cannot access devtools URL.");
          return reject(new Error("Cannot access devtools URL"));
        }

        chrome.scripting.executeScript({
          target: { tabId: currentTabId, },
          func: (url) => {
            window.location.href = url;
            return true;
          },
          args: [url]
        }, (results) => {
          if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            console.log("Request Failed to execute script.");
            reject(new Error("Request Failed to execute script"));
          }
        });
      });
    });
  }

  const processChatInstruction = (instruction) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        console.log("Captured visible tab.");
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.error("chrome.tabs.query error:", chrome.runtime.lastError);
            return reject(chrome.runtime.lastError);
          }

          if (!tabs.length) {
            console.error("No active tabs found.");
            return reject(new Error("No active tabs found"));
          }

          const currentTab = tabs[0];
          const currentTabId = currentTab.id;
          const currentTabUrl = currentTab.url;

          if (!currentTabUrl || currentTabUrl.startsWith('devtools://')) {
            console.error("Cannot access devtools URL.");
            return reject(new Error("Cannot access devtools URL"));
          }

          chrome.scripting.executeScript({
            target: { tabId: currentTabId, },
            func: getHtmlInfo,
          }, (results) => {
            if (results && results[0] && results[0].result) {
              const { html_text, viewport_size } = results[0].result;

              const image = dataUrl;
              resolve({
                status: "success",
                data: {
                  instruction,
                  html_text,
                  image,
                  url: currentTabUrl,
                  viewport_size,
                }
              });
            } else {
              console.log("Request Failed to execute script.");
              reject(new Error("Request Failed to execute script"));
            }
          });
        });
      });
    });
  }

  const executeScriptOnActiveTab = async (response, element_id, element_bbox, viewport_size, observation) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error("chrome.tabs.query error:", chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }

        if (!tabs.length) {
          console.error("No active tabs found.");
          return reject(new Error("No active tabs found"));
        }

        const currentTab = tabs[0];
        const currentTabId = currentTab.id;
        const currentTabUrl = currentTab.url;

        if (!currentTabUrl || currentTabUrl.startsWith('devtools://')) {
          console.error("Cannot access devtools URL.");
          return reject(new Error("Cannot access devtools URL"));
        }

        chrome.scripting.executeScript({
          target: { tabId: currentTabId },
          func: doAction,
          args: [currentTabUrl, response, element_id, element_bbox, viewport_size, observation]
        }, (results) => {
          if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            console.log("Failed to execute script.");
            reject(new Error("Failed to execute script"));
          }
        });
      });
    });
  };

  const addBotMessage = (sessionId, round, result) => {
    // setMessages(prevMessages => [
    //   ...prevMessages,
    //   { id: sessionId, role: 'Bot', parts: [{ content: { round, ...result }, type: 'text' }] }
    // ]);
    setMessages(prevMessages => {
      // 找到是否已经存在相同的id
      const existingMessageIndex = prevMessages.findIndex(msg => msg.id === sessionId);

      if (existingMessageIndex !== -1) {
        // 如果存在相同的id，将新的内容合并到parts中
        const updatedMessages = [...prevMessages];
        updatedMessages[existingMessageIndex].parts = [
          ...updatedMessages[existingMessageIndex].parts,
          { content: { round, ...result }, type: 'text' }
        ];
        return updatedMessages;
      } else {
        // 如果不存在相同的id，插入新的消息对象
        return [
          ...prevMessages,
          { id: sessionId, role: 'Bot', parts: [{ content: { round, ...result }, type: 'text' }] }
        ];
      }
    });
  };

  const renderMessage = (message, index) => {
    if (message.role === 'Human') {
      return (
        <div key={index} className="flex w-full gap-[4px] flex-col">
          <div className="flex items-center gap-[8px] height-[20px]">
            <img src={UserSvg} className="w-[20px] h-[20px] mr-[4px] rounded-[20px]" alt="User" />
            <span className="text-[14px] color-[#000] font-weight-600 line-height-[22px] overflow-hidden text-ellipsis break-all">您</span>
          </div>
          <div className="max-w-[95%] overflow-auto text-[16px] mt-[4px] pl-[28px]">
            <div className="text-[15px]" style={{ whiteSpace: 'pre-wrap' }}>
              {
                message.parts && message.parts.length && message.parts[0].type === 'text' ? message.parts[0].content : ''
              }
            </div>
          </div>
        </div>
      )
    }
  }

  const renderStepContent = (message) => {
    if (message && message.messageType === 'summary') {
      let resultContent  = '';
      message.parts && message.parts.length > 0 && message.parts.map((part, index) => {
          resultContent += part.content
      });
      return <ReactMarkdown components={{
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
      }}  remarkPlugins={[gfm]}>{resultContent}</ReactMarkdown>
    } else {
      let part = message && message.parts && message.parts.length > 0 && message.parts[message.parts.length - 1];
      return <div className='mt-[4px]'><Tag style={{ backgroundColor: 'transparent' }} bordered={false} className="multiline-tag tag-small" icon={<PlayCircleFilled />} color="#2db7f5">{part.content.action}</Tag>
        {part && part.content && part.content.kwargs && part.content.kwargs.argument ? <Tag style={{ backgroundColor: 'transparent' }} bordered={false} className="multiline-tag tag-small" icon={<EditFilled />} color="#2db7f5">{part.content.kwargs.argument}</Tag> : null}
        {part && part.content && part.content.kwargs && part.content.kwargs.instruction ? <Tag style={{ backgroundColor: 'transparent' }} bordered={false} className="multiline-tag tag-small" icon={<MessageFilled />} color="#2db7f5">{part.content.kwargs.instruction}</Tag> : null}
      </div>
    }
  }

  const renderStepItems = (message) => {
    return (
      <div className="w-full">
        <div className="flex">
          <div className="rounded-b-xl rounded-tr-xl flex-1 text-[16px] overflow-hidden">
            {
              message.parts.map((part, index) => (
                <>
                  <div key={index} className="text-[16px] flex flex-col mt-[4px]">
                    {/* <div>Step: {part.content.round}</div> */}
                    <div className="flex flex-row w-full">
                      <Tag style={{ backgroundColor: 'transparent' }} bordered={false} className="multiline-tag tag-small" icon={<PlayCircleFilled />} color="#2db7f5">{part.content.action}</Tag>
                      {part && part.content && part.content.kwargs && part.content.kwargs.argument ? <Tag style={{ backgroundColor: 'transparent' }} bordered={false} className="multiline-tag tag-small" icon={<EditFilled />} color="#2db7f5">{part.content.kwargs.argument}</Tag> : null}
                    </div>
                    {part && part.content && part.content.kwargs && part.content.kwargs.instruction ? <div className='mt-[1px]'><Tag style={{ backgroundColor: 'transparent' }} bordered={false} className="multiline-tag tag-small" icon={<MessageFilled />} color="#2db7f5">{part.content.kwargs.instruction}</Tag></div> : null}
                  </div>
                  {index !== message.parts.length - 1 && <Divider style={{ borderColor: 'white' }} className="my-[6px]" key={index} />}
                </>
              ))
            }
            {/* <div className="mt-[8px]">{renderBtn(actions)}</div> */}
          </div>
        </div>
        <div className="flex w-full">
          {!loading && (
            <div className="flex w-full flex-row-reverse">
              <img src={DislikeSvg} alt="dislike" width={24} />
              <img src={LikeSvg} alt="like" width={24} />
            </div>
          )}
        </div>
      </div>
    )
  };

  const getSummaryPageHtml = () => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error("chrome.tabs.query error:", chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }

        if (!tabs.length) {
          console.error("No active tabs found.");
          return reject(new Error("No active tabs found"));
        }

        const currentTab = tabs[0];
        const currentTabId = currentTab.id;
        const currentTabUrl = currentTab.url;

        if (!currentTabUrl || currentTabUrl.startsWith('devtools://')) {
          console.error("Cannot access devtools URL.");
          return reject(new Error("Cannot access devtools URL"));
        }

        chrome.scripting.executeScript({
          target: { tabId: currentTabId },
          func: getSummaryHtmlInfo,
        }, (results) => {
          console.log("results: ", results);
          if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            console.log("Failed to execute script.");
            reject(new Error("Failed to execute script"));
          }
        });
      });
    });
  }

  const getSummaryHtmlInfo = () => {
    function ctx2tree(ctx) {
      // 移除无用的标签,如 style 和 script
      ctx = ctx.replace(/<!--[\s\S]*?-->/g, '');
      ctx = ctx.replace(/<style[\s\S]*?<\/style>/g, '');
      ctx = ctx.replace(/<script[\s\S]*?<\/script>/g, '');
      ctx = ctx.replace(/<link[\s\S]*?>/g, '');
      ctx = ctx.replace(/<noscript[\s\S]*?<\/noscript>/g, '');
      ctx = ctx.replace(/<plasmo-csui[\s\S]*?<\/plasmo-csui>/g, '');
      ctx = ctx.replace(/<svg\b[^>]*>(.*?)<\/svg>/g, '<svg></svg>');
      ctx = ctx ? ctx.replace(/\s+/g, ' ').trim() : '';

      // 查找 <meta charset="..."> 标签
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

      // 解析 HTML 字符串为 DOM 树
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
      // function removeEmptyElements(doc) {
      //   const elements = doc.querySelectorAll('*');
      //   elements.forEach(el => {
      //     if (el.textContent.trim() === '' && el.tagName !== 'IMG' && el.tagName !== 'TEXTAREA' && el.tagName !== 'BR') {
      //       el.remove();
      //     }
      //   })
      // }
      removeHiddenElements(doc);
      // removeEmptyElements(doc);

      return doc.documentElement.outerHTML;
    }
    let bodyContent = ctx2tree(document.querySelector('body').outerHTML);
    return bodyContent;
  }

  return (
    <div className="flex-1 h-full w-full flex flex-col relative padding-0" style={{ minHeight: 0, textAlign: 'left' }}>
      <div style={{ zIndex: 4999 }}></div>
      <div className="flex-1 flex flex-col w-full items-center" style={{ minHeight: 0 }}>
        <div id="chat-messages-scroll" ref={chatWindowRef} className="flex-1 overflow-y-scroll w-full flex flex-col items-center" style={{
          overscrollBehavior: "contain"
        }}>
          <div className="message-items">
            {messages.map((message, index) => (<div key={index}>
              {message.role === 'Human' &&
                <div className="text-base w-full flex flex-wrap lg:px-0 m-auto items-start">{renderMessage(message, index)}</div>
              }
              {message.role === 'Bot' &&
                <div className="flex w-full gap-[4px] flex-col ">
                  <div className="flex gap-[8px] items-center height-[28px]">
                    <img src={AnswerSvg} className="w-[24px] h-[24px] mr-[4px] rounded-[24px]" alt="answer" />
                    <span className="text-[14px] font-weight-600 line-height-[22px] overflow-hidden text-ellipsis break-all">Web ACT</span>
                  </div>
                  <div className="flex flex-col max-w-[95%] bg-customPurple ml-[28px] px-[14px] py-[10px] rounded text-white shadow-[0_4px_8px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col">
                      {!message.stop && (!loading && isFinished ? <div>Request Exits Abnormally</div> : <div className="flex flex-row"><Spin className="custom-spin" /> <div className='ml-[8px]'>{isSummary && message.messageType === 'summary' ? 'Page Summary' : 'Generate'} Processing</div> </div>)}
                      {message.stop && <div>{isSummary && message.messageType === 'summary' ? 'Page Summary' : 'Generate'} {message.paused ? "Paused" : "Finished"}</div>}
                      {message && renderStepContent(message)}
                    </div>
                    {message.messageType !== 'summary' &&
                      <div className="flex flex-col w-full">
                        <Divider style={{ borderColor: 'white' }} className="my-[8px]"></Divider>
                        <Collapse style={{ backgroundColor: 'transparent' }} expandIconPosition="end" bordered={false}>
                          <Collapse.Panel className="history-panel" header="history" key="1">
                            {renderStepItems(message)}
                          </Collapse.Panel>
                        </Collapse>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
            ))}

            {loading && <div className="flex w-full gap-[4px] flex-col ">
              <div className="flex gap-[8px] items-center height-[28px]">
                <img src={AnswerSvg} className="w-[24px] h-[24px] mr-[4px] rounded-[24px]" alt="answer" />
                <span className="text-[14px] color-[#000] font-weight-600 line-height-[22px] overflow-hidden text-ellipsis break-all">Web ACT</span>
              </div>
              <div className="flex flex-col max-w-[95%] text-white bg-customPurple ml-[28px] px-[14px] py-[10px] rounded shadow-[0_4px_8px_rgba(0,0,0,0.05)]">
                <div className="flex items-center">
                  <Spin className="custom-spin" />
                  <div className='ml-[8px]'>{isSummary ? 'Page Summary' : 'Generate'} Processing</div>
                </div>
              </div>
            </div>
            }
          </div>
        </div>
        <div className="bg-second-color w-full" style={{ padding: '0 16px' }}>
          <GlobalInput
            gref={gref}
            isFinished={isFinished}
            onPressEnter={onPressEnter}
            handleCleanMessages={handleCleanMessages}
            onPauseChat={onPauseChat}
            pausedValue={isPaused.current}
            onStopPauseChat={onStopPauseChat}
            onJsonlFileRead={onJsonlFileRead}
            onReadPage={onReadPage}
          />
        </div>
      </div>
    </div>
    // <div className="chat-window">
    //   <div className="bot-dialog-root"></div>
    //   <div className="chat-box">
    //     {/* <div ref={chatWindowRef} /> */}
    //     <div></div>
    //     <div ref={chatWindowRef} className="scroll-view">
    //       <List
    //         className="chat-list"
    //         itemLayout="horizontal"
    //         dataSource={messages}
    //         renderItem={(item) => (
    //           <List.Item>
    //             <List.Item.Meta
    //               avatar={<Avatar>{item.sender === 'me' ? 'Me' : 'Other'}</Avatar>}
    //               title={item.sender}
    //               description={item.content}
    //             />
    //           </List.Item>
    //         )}
    //     />
    //     </div>

    //     <div className="chat-input">
    //       <div className="chat-toolbar"></div>
    //       <div className="input-wrapper" style={{ height: '118px', maxHeight: 'min(50vh, -580px + 100vh)', minHeight: '124px'}}>
    //         <div className="chat-input-header"></div>
    //         <div className="input-box">
    //           {/* <div className="textarea-mentions"> */}
    //             <Input.TextArea
    //               placeholder="问我任何问题"
    //               value={inputValue}
    //               onChange={handleInputChange}
    //               onKeyPress={handleKeyPress}
    //               autosize={true}
    //               bordered={false}
    //               style={{resize: 'none', height: 48, minHeight: 48, maxHeight: 144}}
    //             />
    //           {/* </div> */}
    //         </div>
    //         <div className="sender"></div>
    //       </div>

    //     </div>
    //   </div>
    // </div>
  );
};

export default ChatWindow;