// src/components/CandlestickChart.tsx
import React, { useRef, useEffect } from 'react';
import * as d3 from "d3";
import type { Candlestick } from "../App"

interface CandlestickChartProps {
  data: Candlestick[];
  width: number;
  height: number;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, width, height }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // 設定圖表邊距
    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 清除先前圖表內容
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X 軸：使用 scaleBand 建立每個 K 線對應的區間
    const xScale = d3.scaleBand<Date>()
      .domain(data.map(d => d.time))
      .range([0, innerWidth])
      .padding(0.3);

    // Y 軸：價格區間，根據所有資料的 low 與 high 決定
    const yMin = d3.min(data, d => d.low) || 0;
    const yMax = d3.max(data, d => d.high) || 0;
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0])
      .nice();

    // 畫 X 軸
    const xAxis = d3.axisBottom<Date>(xScale)
      .tickFormat(d3.timeFormat("%H:%M") as (d: Date) => string);
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);

    // 畫 Y 軸
    const yAxis = d3.axisLeft(yScale);
    g.append("g").call(yAxis);

    // 繪製每一根 K 線
    data.forEach(d => {
      const x = xScale(d.time);
      if (x === undefined) return;
      const candleWidth = xScale.bandwidth();
      const openY = yScale(d.open);
      const closeY = yScale(d.close);
      const highY = yScale(d.high);
      const lowY = yScale(d.low);
      // 根據漲跌決定顏色：上漲用綠色、下跌用紅色，相等則灰色
      const color = d.close > d.open ? "green" : d.close < d.open ? "red" : "gray";

      // 畫燭台的細線 (影線)
      g.append("line")
        .attr("x1", x + candleWidth / 2)
        .attr("x2", x + candleWidth / 2)
        .attr("y1", highY)
        .attr("y2", lowY)
        .attr("stroke", color);

      // 畫燭台的矩形 (實體)
      g.append("rect")
        .attr("x", x)
        .attr("y", Math.min(openY, closeY))
        .attr("width", candleWidth)
        .attr("height", Math.abs(closeY - openY) || 1)  // 若開收盤相等則設定最小高度
        .attr("fill", color);
    });

  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
};

export default CandlestickChart;
