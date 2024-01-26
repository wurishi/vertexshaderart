let index = 0;
let nums: number[] = [];
export default function drawSoundTexture(
  c: CanvasRenderingContext2D,
  arr: Uint8Array
) {
  const len = arr.length;
  if (index >= len) {
    index = 0;
  }
  if (index == 0) {
    for (let i = 0; i < len; i++) {
      nums[i] = arr[i] * 2;
      nums[i] = Math.min(nums[i], 255);
      nums[i] = Math.max(nums[i], 0);
    }
  }
  const lg = c.createLinearGradient(0, 0, 32, 1);
  c.clearRect(0, 0, 32, 32);
  const r = nums[index];
  const g = nums[index + 1];
  const b = nums[index + 2];
  const a = nums[index + 3] / 255;

  lg.addColorStop(0, `rgba(${r},${g},${b},${a})`);
  lg.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = lg;
  for (let i = 0; i < 32; i++) {
    c.fillRect(0, i, 32, 1);
  }
  index += 4;
  // c.lineWidth = 32;
  // c.strokeStyle = lg;
  // c.beginPath();
  // c.moveTo(0, 16);
  // c.lineTo(32, 16);
  // c.stroke();

  // ctx.beginPath();
  // //线段的起点坐标为(50,50)
  // ctx.moveTo(50, 50);
  // //线段的终点坐标为(250,50)
  // ctx.lineTo(250, 50);
  // //设置线条宽度为20px
  // ctx.lineWidth = 20;

  // //创建一个表示线性颜色渐变的CanvasGradient对象，并设置该对象的作用区域就是线段所在的区域
  // var canvasGradient = ctx.createLinearGradient(50, 50, 250, 50);
  // //在offset为0的位置(即起点位置)添加一个蓝色的渐变
  // canvasGradient.addColorStop(0, "blue");
  // //在offset为0.2的位置(线段左起20%的位置)添加一个绿色的渐变
  // canvasGradient.addColorStop(0.2, "green");
  // //在offset为0的位置(即终点位置)添加一个红色的渐变
  // canvasGradient.addColorStop(1, "red");
  // //将strokeStyle的属性值设为该CanvasGradient对象
  // ctx.strokeStyle = canvasGradient;

  // //最后，绘制出当前绘制路径的图形效果
  // ctx.stroke();
}
