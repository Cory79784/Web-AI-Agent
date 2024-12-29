import { useEffect, useRef, useState, useImperativeHandle, useCallback } from "react";
import ReactDOM from "react-dom";
import { Spin, Input, Tooltip, Popover, Flex, Button, message, Popconfirm, Upload } from "antd";
import Icon, { LoadingOutlined, ReadOutlined, UploadOutlined, DownCircleOutlined, UpCircleOutlined, PlusCircleOutlined, PauseCircleFilled } from "@ant-design/icons";
import { debounce } from "lodash";

import Search from "@/assets/search.svg";
import SendSvg from "../../../assets/send-icon.svg";
import StopIconSvg from "../../../assets/stop-icon.svg";
import './index.less';


const GlobalInput = (props) => {
    const { style, classname, prefix, loading, onPressEnter, mode, gref, onChange, isFinished, handleCleanMessages, onPauseChat, pausedValue, onStopPauseChat, onJsonlFileRead, onReadPage } = props;
    // const ref = useRef(null);
    const ref = useRef(null);
    const popupRef = useRef(null);
    const [popupOpen, setPopupOpen] = useState(false);
    const [isLock, setIsLock] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isDown, setIsDown] = useState(false);
    const hide = () => {
        setPopupOpen(false);
    }

    const valueChange = useCallback(
        debounce(async (e) => {
            if (onChange) onChange(e.target.value);
            if (e.target.value.length > 0) {
                setPopupOpen(true);
            } else {
                hide();
            }
        }, 300),
        [],
    );

    const focusEnd = () => {
        ref.current?.focus();
        document.execCommand('selectAll', false);
        document.getSelection()?.collapseToEnd();
    }

    const pressEnter = (e) => {
        if (loading || !isFinished) return;
        if (e.charCode === 13 && !e.shiftKey) {
            e.preventDefault();
            focusEnd();


            if (onPressEnter) {
                let text = e.target.value;

                // 过滤回车字符
                // const filteredText = text.replace(/[\r\n]+/g, '');
                const filteredText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                onPressEnter(filteredText, setInputValue(''));
            }
        }
    }

    const paste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');

        // 过滤回车字符, 但是保留Shift + Enter
        // const filteredText = text.replace(/[\r\n]+/g, '');
        const filteredText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        document.execCommand('insertText', false, filteredText);
    }

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    useEffect(() => {
        const handleTextSelection = () => {
            hide();
        };
        window.addEventListener('mouseup', handleTextSelection);
        window.addEventListener('resize', handleTextSelection);

        return () => {
            window.removeEventListener('mouseup', handleTextSelection);
            window.removeEventListener('resize', handleTextSelection);
        };
    }, []);

    useImperativeHandle(gref, () => ({
        ref: () => ref,
    }));

    useEffect(() => {

    }, []);

    const confirm = (e) => {
        handleCleanMessages([])
        message.success('确认完成');
    };
      
    const cancel = (e) => {
        message.success('取消完成');
    };

    const beforeUpload = (file) => {
        const isJsonl = file.name && file.name.includes('.jsonl');
        if (!isJsonl) {
            message.error('You can only upload JSONL file!');
        }
        return isJsonl || Upload.LIST_IGNORE;
    };

    const handleUploadChange = async (info) => {
        // if (info.file.status === 'done' || info.file.status === 'uploading') {
        if (info.file.status === 'done') {
            const file = info.file.originFileObj;
            const content = await file.text();
            onJsonlFileRead(content)
        }
    };

    return (
        <div className="w-full">
            <div className={`query-input-wrap relative`} 
                style={{ ...style }} 
                id="query-input-wrap-j">
                {prefix ? prefix : null}
                <div className="chat-input w-full">
                    <div className="chat-toolbar">
                        {/* <div className={ pausedValue && !isFinished ? "chat-toolbar-left recoverActive" : isFinished && !pausedValue ? "chat-toolbar-left active" :  "chat-toolbar-left"}> */}
                        <div className={ (isFinished || pausedValue) ? "chat-toolbar-left" :  "chat-toolbar-left active"}>
                        {/* <div className="chat-toolbar-left"> */}
                            {/* <PlusCircleOutlined /> */}
                            {/* <span className="pl-[4px]">新增指令</span> */}
                            {/* <Tooltip style={{ fontSize: 12 }} color="#108ee9" placement="top" title={pausedValue ? "点击继续" : "点击暂停"}>
                                <div className="flex items-center cusor-pointer height-[24px]" onClick={pausedValue ? () => onStopPauseChat && onStopPauseChat() : () => onPauseChat && onPauseChat()}>
                                    {pausedValue ? <svg className="w-[16px] h-[16px]" t="1719886701576" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2362"><path d="M664.8 738.7c-50.9 37.7-114 55.1-176.9 48.7-2.9-0.3-5.8-0.8-8.8-1.2-5.6-0.8-11.3-1.6-16.8-2.7-3.4-0.7-6.7-1.5-10.1-2.4-5.4-1.2-10.7-2.6-16-4.3-2.5-0.8-5-1.7-7.5-2.6-14.6-5-28.7-11.3-42.1-18.9l-0.9-0.5c-29.6-17.1-55.8-39.6-77-66.4-1-1.3-2.1-2.8-3.1-4.2-37.8-49.6-58.3-110.3-58.1-172.6H309c1.7 0 3.2-0.9 4-2.4 0.8-1.5 0.7-3.3-0.2-4.7l-103.3-162c-0.8-1.3-2.2-2.1-3.7-2.1s-2.9 0.8-3.7 2.1l-103.3 162c-0.9 1.4-1 3.2-0.3 4.7 0.8 1.6 2.3 2.4 4 2.4h61.4c0 76.8 22.9 147.9 61.8 206.6 0.5 0.9 0.8 1.7 1.3 2.5 4.1 6 8.5 11.6 12.9 17.3 1.6 2.1 3.1 4.3 4.8 6.5 6.4 8.1 13.1 15.6 20.1 23.1l1.9 2c30.2 31.8 66.2 57.4 106.1 75.7l6.4 3c7.3 3.2 15 6 22.5 8.6 3.6 1.3 7.1 2.6 10.8 3.7 6.7 2.1 13.5 3.7 20.4 5.5 4.6 1.1 9.1 2.3 13.8 3.2 1.9 0.5 3.6 1 5.6 1.4 6.5 1.2 12.9 1.9 19.5 2.7l7 1c83.3 8.6 166.9-14.2 234.2-64.2 19-14.4 23.6-41.1 10.3-60.9-6.2-9.4-16-15.9-27.1-18-11-1.8-22.4 0.8-31.4 7.4z m196.9-226.9c0.1-73.2-21.2-144.9-61.4-206.1-0.6-1-1-2-1.6-2.9-4.9-7-9.9-13.9-15.3-20.6l-1.8-2.4c-34.5-44.1-79.2-79.2-130.2-102.3-1.4-0.6-2.8-1.3-4.2-2-8.1-3.4-16.2-6.5-24.5-9.4-3.1-1-6.1-2.2-9.2-3.1-7.2-2.2-14.5-4.2-21.9-5.9-4.1-0.9-8.2-2-12.3-2.9-2-0.4-3.9-1-5.9-1.5-5.5-1-11.1-1.4-16.6-2.1-3.7-0.5-7.6-1.1-11.4-1.6-9.2-0.9-18.4-1.3-27.6-1.5-1.7 0-3.4-0.3-5.1-0.3-72 0-142.1 23.1-200 65.9-19.1 14.3-23.6 41.1-10.4 60.9 6.2 9.4 16 15.9 27.1 18 11 2 22.4-0.6 31.3-7.3 51-37.7 114.2-55.1 177.3-48.7l7 1c6.4 0.7 12.6 1.7 18.7 3 2.7 0.5 5.4 1.2 8.1 1.9 6 1.4 12.1 3 18 4.8l5.5 2c6.8 2.3 13.3 4.7 19.9 7.6l2 1c39.1 17.7 73.4 44.6 99.9 78.3l0.5 0.7c39.2 50.1 60.4 111.9 60.2 175.5h-61.4c-1.7 0-3.2 0.9-4 2.4-0.8 1.5-0.7 3.3 0.3 4.7l103.4 162c0.8 1.3 2.2 2.1 3.7 2.1s2.9-0.8 3.7-2.1L926.8 519c0.1-0.1 0.2-0.3 0.3-0.4 2.2-2.8 0.1-6.9-3.5-6.8h-61.9z" p-id="2363" fill="currentColor"></path></svg> : <svg className="w-[16px] h-[16px]" t="1719487692699" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3209" width="16" height="16"><path d="M512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024zM320 320v384h384V320H320z" fill="currentColor" p-id="3210"></path></svg>}
                                    <span className="pl-[4px]">{ pausedValue ? '继续' : '停止' }</span>
                                </div>
                            </Tooltip> */}
                            <Tooltip style={{ fontSize: 12 }} color="#108ee9" placement="top" title={"点击暂停"}>
                                <div className="flex items-center cusor-pointer height-[24px]" onClick={() => onPauseChat && onPauseChat()}>
                                    {/* <svg className="w-[16px] h-[16px]" t="1719487692699" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3209" width="16" height="16"><path d="M512 1024A512 512 0 1 1 512 0a512 512 0 0 1 0 1024zM320 320v384h384V320H320z" fill="currentColor" p-id="3210"></path></svg> */}
                                    <svg className="w-[16px] h-[16px]" t="1719907928724" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2348"><path d="M510.9 60.7c-245.6 0-446.7 199.8-446.7 446.7C64.2 753 263.9 954 510.8 954s446.6-199.7 446.6-446.6c0.1-245.6-199.6-446.7-446.5-446.7z m-24.7 574c0 8.8-7.2 16-16 16h-94.9c-8.8 0-16-7.2-16-16V389.3c0-8.8 7.2-16 16-16h94.9c8.8 0 16 7.2 16 16v245.4z m178.5 0c0 8.8-7.2 16-16 16h-94.9c-8.8 0-16-7.2-16-16V389.3c0-8.8 7.2-16 16-16h94.9c8.8 0 16 7.2 16 16v245.4z" fill="currentColor" p-id="2349"></path></svg>
                                    <span className="pl-[4px]">停止</span>
                                </div>
                            </Tooltip>
                            <Popconfirm
                                title="确定清空聊天吗"
                                description="清空聊天将开启新聊天，请知晓！"
                                onConfirm={confirm}
                                onCancel={cancel}
                                okText="Yes"
                                cancelText="No"
                            >
                                <div className={isFinished ? "input-instruction active" : "input-instruction"} disabled={!isFinished}>
                                    <svg className="w-[16px] h-[16px]" t="1719907987231" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3343"><path d="M736 128l-32-64H320l-32 64H128v128h768V128H736zM192 896a64 64 0 0 0 64 64h512a64 64 0 0 0 64-64V320H192z" fill="currentColor" p-id="3344"></path></svg>
                                    <span className="pl-[4px]">清空聊天</span>
                                </div>
                            </Popconfirm>
                        </div>
                        <div className="chat-toolbar-right">
                            <Upload
                                beforeUpload={beforeUpload}
                                onChange={handleUploadChange}
                                showUploadList={false}
                                accept=".jsonl"
                                className="flex">
                                <div className="input-instruction active">
                                    <UploadOutlined />
                                    <span className="pl-[4px]">批量任务</span>
                                </div>
                            </Upload>
                            <div className={isFinished ? "input-instruction active" : "input-instruction" } onClick={() => onReadPage && onReadPage()} disabled={isFinished}>
                                <ReadOutlined />
                                <span className="pl-[4px]">总结全文</span>
                            </div>
                            {/* <Tooltip style={{ fontSize: 12 }} color="#108ee9" placement="top" title="收藏">
                                <span className="chat-toolbar-item">
                                    <svg t="1717575594718" class="icon" width="24" height="24" viewBox="0 0 1024 1024" style={{minHeight: 24, minWidth: 24}} version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="20465">
                                        <path fill="currentColor" d="M902.211 410.358a31.766 31.766 0 0 0-25.644-21.62L644.34 354.994 540.485 144.561a31.765 31.765 0 0 0-56.971 0L379.659 354.995l-232.227 33.744a31.768 31.768 0 0 0-17.606 54.183l168.042 163.8-39.669 231.288a31.765 31.765 0 0 0 46.091 33.487L512 762.298l207.71 109.199c6.915 3.65 22.854 4.496 33.454-2.418 10.086-6.579 14.681-19.151 12.637-31.069l-39.669-231.288 168.041-163.8a31.765 31.765 0 0 0 8.038-32.564zM669.827 572.885a31.766 31.766 0 0 0-9.136 28.117l31.611 184.31-165.521-87.02a31.746 31.746 0 0 0-14.782-3.648 31.755 31.755 0 0 0-14.782 3.648l-165.521 87.02 31.611-184.31a31.766 31.766 0 0 0-9.135-28.117l-133.91-130.53 185.058-26.89a31.765 31.765 0 0 0 23.918-17.377L512 230.396l82.761 167.691a31.765 31.765 0 0 0 23.917 17.377l185.059 26.89-133.91 130.531z" p-id="20466">
                                    </path></svg>       
                                </span>                     
                            </Tooltip>
                            <Tooltip style={{ fontSize: 12 }} color="#108ee9" placement="top" title="历史记录">
                            <span className="chat-toolbar-item">
                                <svg class="icon" width="20" height="20" fill="none" viewBox="0 0 20 20" style={{minHeight: 20, minWidth: 20}}><g><path fill="currentColor" d="M2.89 2.89c.432 0 .782.35.782.782v1.875h1.875a.781.781 0 1 1 0 1.562H2.89a.781.781 0 0 1-.782-.78V3.671c0-.432.35-.781.782-.781Z" clip-rule="evenodd" fill-rule="evenodd" data-follow-fill="#545C66"></path><path fill="currentColor" d="M2.828 5.858A8.281 8.281 0 1 1 1.719 10a.781.781 0 0 1 1.562 0 6.719 6.719 0 1 0 .899-3.36.781.781 0 0 1-1.352-.782Z" clip-rule="evenodd" fill-rule="evenodd" data-follow-fill="#545C66"></path><path fill="currentColor" d="M10.079 5.703c.431 0 .78.35.78.781v3.83l2.091 1.969a.781.781 0 1 1-1.07 1.137l-2.092-1.968a1.563 1.563 0 0 1-.491-1.138v-3.83c0-.431.35-.78.782-.78Z" clip-rule="evenodd" fill-rule="evenodd" data-follow-fill="#545C66"></path></g></svg>
                            </span>
                            </Tooltip> */}
                        </div>
                    </div>
                    <div className="input-wrapper" style={{ height: '118px', maxHeight: 'min(50vh, -580px + 100vh)', minHeight: '124px'}}>
                        <div className="chat-input-header"></div>
                        <div className="input-box">
                            <div className="textarea-mentions">
                                <Input.TextArea
                                    placeholder="在此输入或者粘贴内容"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyPress={pressEnter}
                                    autosize="true"
                                    variant={false}
                                    style={{resize: 'none', height: 48, minHeight: 48, maxHeight: 144}}
                                    suppressContentEditableWarning
                                    onCompositionStart={() => setIsLock(true)} // 防止中文输入法时光标偏移
                                    onCompositionEnd={(e) => {
                                        setIsLock(false);
                                        valueChange(e);
                                    }}x
                                    onPaste={paste}
                                    ref={ref}
                                    disabled={!isFinished}
                                />
                            </div>
                        </div>
                    <div className="sender">
                        {/* <Popover placement="rightBottom" title="选择下方动作，填写操作对象" content={instructionButton} trigger="click"> */}
                        {/* </Popover>  */}
                        <div className="input-inside-actions">
                            <Tooltip style={{ fontSize: 12 }} color="#108ee9" placement="top" title="发送(↵)">
                                <div className={(inputValue && inputValue.length > 0 && isFinished)  ? `input-msg-btn active` : `input-msg-btn`} onClick={() => onPressEnter && onPressEnter(inputValue || '', setInputValue(''))}>
                                    <svg class="icon" width="20" height="20" fill="none" viewBox="0 0 20 20" style={{ width: 20, height: 20 }}><g><path fill="currentColor" d="M14.006 3.162 4.157 6.703c-1.504.541-2.256.812-2.282 1.332-.025.52.697.864 2.14 1.55l3.991 1.897c.242.115.363.172.457.264.094.092.153.213.272.453l1.924 3.878c.698 1.408 1.047 2.112 1.564 2.082.516-.03.78-.771 1.307-2.252l3.477-9.753c.721-2.023 1.082-3.034.556-3.558-.525-.524-1.536-.16-3.557.566Z" data-follow-fill="#C0C5CC"></path></g></svg>
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                </div>
          
             </div>
                {/* <div ref={ref} 
                    className="query-input text-[14px]"
                    id="query-input-id"
                    contentEditable={loading ? 'false' : 'true'}
                    onInput={(e) => {
                        if (popupOpen) hide();
                        if (!isLock) valueChange(e);
                    }}
                    onKeyDown={pressEnter}
                    suppressContentEditableWarning
                    onCompositionStart={() => setIsLock(true)} // 防止中文输入法时光标偏移
                    onCompositionEnd={(e) => {
                        setIsLock(false);
                        valueChange(e);
                    }}
                    onPaste={paste}
                ></div> */}
                {ReactDOM.createPortal(
                    <div
                        ref={popupRef}
                        style={{
                            position: 'absolute',

                        }}>

                    </div>,
                    document.body,
                )}
            </div>
            {loading ? (
                <Spin indictor={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            ) : (
                <>
                {mode === 'query' ? (
                    <img src={Search} 
                        className="w-24[px] mx=[8px]" 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => onPressEnter && onPressEnter(ref?.current?.innerText?.replace(/[\r\n]+/g, '') || '', ref)} />
                ) : (
                    <span className="ml-[8px] bg-secondPrimaryColor rounded-3xl cursor-pointer w-[74px] h-[48px] flex items-center justify-center"
                        onClick={() => onPressEnter && onPressEnter(ref?.current?.innerText?.replace(/[\r\n]+/g, '') || '', ref)}>
                        <img src={SendSvg} className="w-[20px]" />
                    </span>
                )}
                </>
            )}
        </div>
    );
};

export default GlobalInput;