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
  const prevLatestPriceRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // 畫軸的函式
  const drawAxes = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleBand<Date>,
    yScale: d3.ScaleLinear<number, number>,
    innerWidth: number,
    innerHeight: number
  ) => {
    try {
      // 依據資料計算時間範圍
      const [minTime, maxTime] = d3.extent(data, d => d.time) as [Date, Date];
      const timeDiff = maxTime.getTime() - minTime.getTime();
      // 如果時間範圍小於一天，顯示「小時:分鐘」，否則顯示「年月日」
      const formatStr = timeDiff > 6 * 24 * 60 * 60 * 1000 ? "%Y/%m/%d" : timeDiff > 6 * 60 * 60 * 1000 ? "%m/%d %H" : "%H:%M";
      const tickFormat = d3.timeFormat(formatStr) as (d: Date) => string;
    
      const interval = Math.max(1, Math.floor(data.length / 10));
      const tickValues = xScale.domain().filter((_d, i) => i % interval === 0);
      const xAxis = d3
        .axisBottom<Date>(xScale)
        .tickValues(tickValues)
        .tickFormat(tickFormat);
      g.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(xAxis);
    } catch (error) {
      console.error("Error drawing X axis:", error);
    }
    

    try {
      const yAxis = d3.axisRight(yScale);
      g.append("g")
        .attr("transform", `translate(${innerWidth}, 0)`)
        .call(yAxis);
    } catch (error) {
      console.error("Error drawing Y axis:", error);
    }
  };

  // 畫 candlestick 的函式
  const drawCandlesticks = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: Candlestick[],
    xScale: d3.ScaleBand<Date>,
    yScale: d3.ScaleLinear<number, number>
  ) => {
    try {
      data.forEach((d) => {
        const x = xScale(d.time);
        if (x === undefined) return;
        const candleWidth = xScale.bandwidth();
        const openY = yScale(d.open);
        const closeY = yScale(d.close);
        const highY = yScale(d.high);
        const lowY = yScale(d.low);
        const color =
          d.close > d.open ? "green" : d.close < d.open ? "red" : "gray";

        // 畫影線
        g.append("line")
          .attr("x1", x + candleWidth / 2)
          .attr("x2", x + candleWidth / 2)
          .attr("y1", highY)
          .attr("y2", lowY)
          .attr("stroke", color);

        // 畫實體矩形
        g.append("rect")
          .attr("x", x)
          .attr("y", Math.min(openY, closeY))
          .attr("width", candleWidth)
          .attr("height", Math.abs(closeY - openY) || 1)
          .attr("fill", color);
      });
    } catch (error) {
      console.error("Error drawing candlesticks:", error);
    }
  };

  // 畫即時價格與 tooltip 的函式
  const drawRealtimePrice = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    yScale: d3.ScaleLinear<number, number>,
    innerWidth: number,
    innerHeight: number
  ) => {
    const tooltipWidth = 50,
      tooltipHeight = 20;
    try {
      const latest = data[data.length - 1];
      const latestPrice = latest.close;
      const priceY = yScale(latestPrice);

      let realTimeColor = "gray";
      if (prevLatestPriceRef.current !== null) {
        if (latestPrice > prevLatestPriceRef.current) {
          realTimeColor = "green";
        } else if (latestPrice < prevLatestPriceRef.current) {
          realTimeColor = "red";
        }
      }
      prevLatestPriceRef.current = latestPrice;

      // 畫水平線
      g.append("line")
        .attr("class", "realtime-line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", priceY)
        .attr("y2", priceY)
        .attr("stroke", realTimeColor)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,2");

      // 畫即時價格 tooltip
      let rtTooltipY = priceY - tooltipHeight / 2;
      rtTooltipY = Math.max(
        0,
        Math.min(rtTooltipY, innerHeight - tooltipHeight)
      );
      const rtPriceGroup = g
        .append("g")
        .attr("class", "realtime-price")
        .attr("transform", `translate(${innerWidth}, ${rtTooltipY})`);
      rtPriceGroup
        .append("rect")
        .attr("width", tooltipWidth)
        .attr("height", tooltipHeight)
        .attr("fill", realTimeColor)
        .attr("rx", 4)
        .attr("ry", 4);
      rtPriceGroup
        .append("text")
        .attr("x", tooltipWidth / 2)
        .attr("y", tooltipHeight / 2)
        .attr("dy", ".35em")
        .style("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(`${latestPrice}`);
    } catch (error) {
      console.error("Error drawing realtime price:", error);
    }
  };

  // 綁定 pointer tooltip 與 crosshair
  const bindPointerTooltip = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    yScale: d3.ScaleLinear<number, number>,
    innerWidth: number,
    innerHeight: number
  ) => {
    const tooltipWidth = 50,
      tooltipHeight = 20;
    try {
      const crosshair = g
        .append("g")
        .attr("class", "crosshair")
        .style("display", "none");
      // 垂直線
      crosshair
        .append("line")
        .attr("class", "crosshair-vertical")
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "3,3");
      // 水平線
      crosshair
        .append("line")
        .attr("class", "crosshair-horizontal")
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "3,3");

      const pointerTooltip = g
        .append("g")
        .attr("class", "pointer-tooltip")
        .style("display", "none");
      pointerTooltip
        .append("rect")
        .attr("width", tooltipWidth)
        .attr("height", tooltipHeight)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", "none");
      const pointerText = pointerTooltip
        .append("text")
        .attr("x", tooltipWidth / 2)
        .attr("y", tooltipHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .attr("fill", "#000");

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
          try {
            const [mx, my] = d3.pointer(event, this);
            crosshair
              .select(".crosshair-vertical")
              .attr("x1", mx)
              .attr("x2", mx)
              .attr("y1", 0)
              .attr("y2", innerHeight);
            crosshair
              .select(".crosshair-horizontal")
              .attr("x1", 0)
              .attr("x2", innerWidth)
              .attr("y1", my)
              .attr("y2", my);

            const pointerPrice = yScale.invert(my);
            const formattedPrice = pointerPrice.toFixed(2);
            pointerText.text(`${Number(formattedPrice).toFixed(1)}`);

            let pointerTooltipY = my - tooltipHeight / 2;
            pointerTooltipY = Math.max(
              0,
              Math.min(pointerTooltipY, innerHeight - tooltipHeight)
            );
            pointerTooltip.attr(
              "transform",
              `translate(${innerWidth}, ${pointerTooltipY})`
            );
          } catch (error) {
            console.error("Error in pointer tooltip update:", error);
          }
        });
    } catch (error) {
      console.error("Error drawing pointer tooltip and crosshair:", error);
    }
  };

  useEffect(() => {
    if (!data || data.length === 0) return;
    const margin = { top: 20, right: 50, bottom: 20, left: 0 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    try {
      d3.select(svgRef.current).selectAll("*").remove();
    } catch (error) {
      console.error("Error clearing svg content:", error);
    }

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 定義 X、Y 軸 scale
    const xScale = d3
      .scaleBand<Date>()
      .domain(data.map((d) => d.time))
      .range([0, innerWidth])
      .padding(0.3);
    const yMin = d3.min(data, (d) => d.low) ?? 0;
    const yMax = d3.max(data, (d) => d.high) ?? 0;
    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0])
      .nice();

    drawAxes(g, xScale, yScale, innerWidth, innerHeight);
    drawCandlesticks(g, data, xScale, yScale);
    drawRealtimePrice(g, yScale, innerWidth, innerHeight);
    bindPointerTooltip(g, yScale, innerWidth, innerHeight);
  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
}
