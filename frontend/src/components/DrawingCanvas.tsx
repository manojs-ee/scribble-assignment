import { useEffect, useRef, useState } from "react";
import type { Point } from "../services/api";

interface DrawingCanvasProps {
  strokes: Point[][];
  isDrawer: boolean;
  onStroke: (points: Point[]) => void;
  onClear: () => void;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

function replayStrokes(ctx: CanvasRenderingContext2D, strokes: Point[][]) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }
}

function getCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const rect = canvas.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function DrawingCanvas({ strokes, isDrawer, onStroke, onClear }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const [isDrawingState, setIsDrawingState] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    replayStrokes(ctx, strokes);
  }, [strokes]);

  function startStroke(x: number, y: number) {
    if (!isDrawer) return;
    isDrawingRef.current = true;
    setIsDrawingState(true);
    currentStrokeRef.current = [{ x, y }];

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function continueStroke(x: number, y: number) {
    if (!isDrawer || !isDrawingRef.current) return;
    currentStrokeRef.current.push({ x, y });

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endStroke() {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawingState(false);

    const points = currentStrokeRef.current;
    currentStrokeRef.current = [];
    if (points.length >= 2) {
      onStroke(points);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          cursor: isDrawer ? (isDrawingState ? "crosshair" : "crosshair") : "default",
          touchAction: isDrawer ? "none" : "auto"
        }}
        onMouseDown={isDrawer ? (e) => {
          const pt = getCanvasPoint(e.currentTarget, e.clientX, e.clientY);
          startStroke(pt.x, pt.y);
        } : undefined}
        onMouseMove={isDrawer ? (e) => {
          const pt = getCanvasPoint(e.currentTarget, e.clientX, e.clientY);
          continueStroke(pt.x, pt.y);
        } : undefined}
        onMouseUp={isDrawer ? () => endStroke() : undefined}
        onMouseLeave={isDrawer ? () => endStroke() : undefined}
        onTouchStart={isDrawer ? (e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const pt = getCanvasPoint(e.currentTarget, touch.clientX, touch.clientY);
          startStroke(pt.x, pt.y);
        } : undefined}
        onTouchMove={isDrawer ? (e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const pt = getCanvasPoint(e.currentTarget, touch.clientX, touch.clientY);
          continueStroke(pt.x, pt.y);
        } : undefined}
        onTouchEnd={isDrawer ? () => endStroke() : undefined}
      />
      {isDrawer && (
        <button className="button button--secondary" type="button" onClick={onClear}>
          Clear Canvas
        </button>
      )}
    </div>
  );
}
