// src/components/ResponsiveContainer.tsx
import React, { useRef, useState, useEffect } from "react";

interface ResponsiveContainerProps {
  // children: (dimensions: { width: number; height: number }) => JSX.Element;
  children: (dimensions: { width: number; height: number }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  resizingFallback?: React.ReactNode | undefined;
}

export default function ResponsiveContainer({
  children,
  className,
  style,
  resizingFallback,
}: ResponsiveContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    }
    handleResize(); // 初次設定
    function delayResize() {
      setIsResizing(true);
      clearTimeout(resizeTimeout.current);

      resizeTimeout.current = setTimeout(() => {
        handleResize();
        setIsResizing(false);
      }, 1000);
    }
    window.addEventListener("resize", resizingFallback ? delayResize : handleResize);
    return () => window.removeEventListener("resize", resizingFallback ? delayResize : handleResize);
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ ...style, width: "100%", height: "100%" }}>
      {resizingFallback ? 
        dimensions.width && dimensions.height && !isResizing ? children(dimensions) : ( resizingFallback )
       : 
        dimensions.width && dimensions.height ? children(dimensions) : null
      }
    </div>
  );
}
