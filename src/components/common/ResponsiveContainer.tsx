import { useRef, useState, useEffect, ReactNode, CSSProperties } from "react";

interface ResponsiveContainerProps {
  children: (dimensions: { width: number; height: number }) => ReactNode;
  className?: string;
  style?: CSSProperties;
  resizingFallback?: ReactNode;
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

  // 封裝更新容器尺寸
  const updateDimensions = () => {
    try {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    } catch (error) {
      console.error("Error updating dimensions:", error);
    }
  };

  useEffect(() => {
    // 初次更新尺寸
    updateDimensions();

    // 定義直接更新的 handler
    const handleResize = () => {
      updateDimensions();
    };

    // 定義 debounce 的 handler
    const handleResizeDebounced = () => {
      setIsResizing(true);
      if (resizeTimeout.current !== null) {
        clearTimeout(resizeTimeout.current);
        resizeTimeout.current = undefined;
      }

      resizeTimeout.current = window.setTimeout(() => {
        updateDimensions();
        setIsResizing(false);
      }, 1000);
    };

    // 根據是否提供 resizingFallback 來決定使用 debounce 還是立即更新
    const resizeHandler = resizingFallback ? handleResizeDebounced : handleResize;

    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
      if (resizeTimeout.current !== null) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, []);

  const hasValidDimensions = dimensions.width > 0 && dimensions.height > 0;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...style, width: "100%", height: "100%" }}
    >
      {resizingFallback ? (
        hasValidDimensions && !isResizing ? (
          children(dimensions)
        ) : (
          resizingFallback
        )
      ) : hasValidDimensions ? (
        children(dimensions)
      ) : null}
    </div>
  );
}
