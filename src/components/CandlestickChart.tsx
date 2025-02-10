import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export interface Candlestick {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: Candlestick[];
  width: number;
  height: number;
}

export default function CandlestickChart ({ data, width, height }: CandlestickChartProps) {
  // 用來儲存前一次最新價格，以便比較漲跌
  const prevLatestPriceRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // 設定圖表邊距與內部尺寸
    const margin = { top: 20, right: 50, bottom: 20, left: 0 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 清除先前內容
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // 建立主要繪圖區 (已位移 margin)
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 建立 X 軸的 scale (使用 scaleBand)
    const xScale = d3.scaleBand<Date>()
      .domain(data.map(d => d.time))
      .range([0, innerWidth])
      .padding(0.3);

    // 建立 Y 軸的 scale (使用 scaleLinear)
    const yMin = d3.min(data, d => d.low) || 0;
    const yMax = d3.max(data, d => d.high) || 0;
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0])
      .nice();

    // -----------------------------
    // 畫 X 軸：為避免刻度過密，依資料筆數動態過濾 tick 值
    const interval = Math.max(1, Math.floor(data.length / 10));
    const tickValues = xScale.domain().filter((d, i) => i % interval === 0);
    const xAxis = d3.axisBottom<Date>(xScale)
      .tickValues(tickValues)
      .tickFormat(d3.timeFormat("%H:%M") as (d: Date) => string);
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);

    // -----------------------------
    // 畫 Y 軸 (放在右側)
    const yAxis = d3.axisRight(yScale);
    g.append("g")
      .attr("transform", `translate(${innerWidth},0)`)
      .call(yAxis);

    // -----------------------------
    // 繪製每一根 candlestick
    data.forEach(d => {
      const x = xScale(d.time);
      if (x === undefined) return;
      const candleWidth = xScale.bandwidth();
      const openY = yScale(d.open);
      const closeY = yScale(d.close);
      const highY = yScale(d.high);
      const lowY = yScale(d.low);
      // 根據漲跌決定顏色 (上漲: green、下跌: red、相等: gray)
      const color = d.close > d.open ? "green" : d.close < d.open ? "red" : "gray";

      // 畫影線 (最高到最低)
      g.append("line")
        .attr("x1", x + candleWidth / 2)
        .attr("x2", x + candleWidth / 2)
        .attr("y1", highY)
        .attr("y2", lowY)
        .attr("stroke", color);

      // 畫實體矩形 (開盤與收盤)
      g.append("rect")
        .attr("x", x)
        .attr("y", Math.min(openY, closeY))
        .attr("width", candleWidth)
        .attr("height", Math.abs(closeY - openY) || 1)
        .attr("fill", color);
    });

    // -----------------------------
    // 1. 畫即時更新的價格與水平線
    const latest = data[data.length - 1];
    const latestPrice = latest.close;
    const priceY = yScale(latestPrice);

    // 根據前次價格比較漲跌 (若無前值則預設 gray)
    let realTimeColor = "gray";
    if (prevLatestPriceRef.current !== null) {
      if (latestPrice > prevLatestPriceRef.current) {
        realTimeColor = "green";
      } else if (latestPrice < prevLatestPriceRef.current) {
        realTimeColor = "red";
      }
    }
    prevLatestPriceRef.current = latestPrice;

    // 劃一條水平線 (全寬)，位置根據即時價格
    g.append("line")
      .attr("class", "realtime-line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", priceY)
      .attr("y2", priceY)
      .attr("stroke", realTimeColor)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,2");

    // 定義即時更新價格 tooltip 的尺寸
    const tooltipWidth = 50, tooltipHeight = 20;
    // 計算 tooltip 垂直位置 (若超出圖表上下邊界則調整)
    let rtTooltipY = priceY - tooltipHeight / 2;
    rtTooltipY = Math.max(0, Math.min(rtTooltipY, innerHeight - tooltipHeight));
    // 將即時價格 tooltip 放在與 Y 軸同側 (即內部右邊界)
    const rtPriceGroup = g.append("g")
      .attr("class", "realtime-price")
      .attr("transform", `translate(${innerWidth}, ${rtTooltipY})`);
    rtPriceGroup.append("rect")
      .attr("width", tooltipWidth)
      .attr("height", tooltipHeight)
      .attr("fill", realTimeColor)
      .attr("rx", 4)
      .attr("ry", 4);
    rtPriceGroup.append("text")
      .attr("x", tooltipWidth / 2)
      .attr("y", tooltipHeight / 2)
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(`${latestPrice}`);

    // -----------------------------
    // 3. 改版 pointer tooltip：滑鼠移入圖表時顯示交叉線與價格
    // 建立 crosshair 群組 (包含水平與垂直線)，初始隱藏
    const crosshair = g.append("g")
      .attr("class", "crosshair")
      .style("display", "none");
    // 垂直線 (全高)
    crosshair.append("line")
      .attr("class", "crosshair-vertical")
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "3,3");
    // 水平線 (全寬)
    crosshair.append("line")
      .attr("class", "crosshair-horizontal")
      .attr("stroke", "gray")
      .attr("stroke-dasharray", "3,3");

    // 建立 pointer tooltip，用來顯示滑鼠當下的價格，顯示位置固定在右側
    const pointerTooltip = g.append("g")
      .attr("class", "pointer-tooltip")
      .style("display", "none");
    pointerTooltip.append("rect")
      .attr("width", tooltipWidth)
      .attr("height", tooltipHeight)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "none");
    const pointerText = pointerTooltip.append("text")
      .attr("x", tooltipWidth / 2)
      .attr("y", tooltipHeight / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .attr("fill", "#000");

    // 在圖表內新增一個透明 overlay（加入在 g 內，故座標已是內部座標）
    g.append("rect")
      .attr("class", "overlay")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", () => {
        crosshair.style("display", null);
        pointerTooltip.style("display", null);
      })
      .on("mouseout", () => {
        crosshair.style("display", "none");
        pointerTooltip.style("display", "none");
      })
      .on("mousemove", function (event) {
        // 取得滑鼠在內部區域的座標
        const [mx, my] = d3.pointer(event, this);
        // 更新交叉線：垂直線 x 座標；水平線 y 座標
        crosshair.select(".crosshair-vertical")
          .attr("x1", mx)
          .attr("x2", mx)
          .attr("y1", 0)
          .attr("y2", innerHeight);;
        crosshair.select(".crosshair-horizontal")
          .attr("y1", my)
          .attr("y2", my)
          .attr("x1", 0)
          .attr("x2", innerWidth);
        // 根據滑鼠 y 座標反推價格
        const pointerPrice = yScale.invert(my);
        const formattedPrice = pointerPrice.toFixed(2);
        pointerText.text(`${Number(formattedPrice).toFixed(1)}`);
        // 將 pointer tooltip 固定放在右側 (與 y 軸位置相同)
        let pointerTooltipY = my - tooltipHeight / 2;
        pointerTooltipY = Math.max(0, Math.min(pointerTooltipY, innerHeight - tooltipHeight));
        pointerTooltip.attr("transform", `translate(${innerWidth}, ${pointerTooltipY})`);
      });

  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
};
