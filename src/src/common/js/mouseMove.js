// 创建并插入Canvas元素到页面


// 监听鼠标移动事件并绘制轨迹
// document.addEventListener('mousemove', (event) => {
//   // 绘制轨迹点
//   ctx.fillStyle = 'red'; // 设置轨迹点的颜色
//   ctx.beginPath();
//   ctx.arc(event.clientX, event.clientY, 5, 0, 2 * Math.PI);
//   ctx.fill();
// });

// 模拟鼠标移动到特定元素
function moveToElement(element, centerX, centerY) {
//   const element = document.querySelector(selector);
  if (element) {
    const moveEvent = new MouseEvent('mousemove', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY
    });

    // 触发鼠标移动事件
    document.dispatchEvent(moveEvent);

    // 绘制轨迹点
    ctx.fillStyle = 'blue'; // 设置轨迹点的颜色为蓝色
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

export default moveToElement;

// 调用函数移动到特定元素
// moveToElement('#your-element-id'); // 替换为你要移动到的元素选择器
