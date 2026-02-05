"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator as CalculatorIcon, X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Calculator({ open, onOpenChange }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [memory, setMemory] = useState<number>(0);
  const [showMemory, setShowMemory] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Prevent body scroll when calculator is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const formatDisplay = (value: number | string): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    
    // Handle very large numbers
    if (Math.abs(num) > 999999999) {
      return num.toExponential(5);
    }
    
    // Format with appropriate decimal places
    const str = num.toString();
    if (str.includes(".")) {
      const parts = str.split(".");
      if (parts[1].length > 8) {
        return num.toFixed(8).replace(/\.?0+$/, "");
      }
    }
    
    return str;
  };

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      if (display === "0") {
        setDisplay(num);
      } else if (display.length < 15) {
        setDisplay(display + num);
      }
    }
  };

  const handleOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      setDisplay(formatDisplay(newValue));
      setPreviousValue(newValue);
    } else {
      setPreviousValue(inputValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "*":
        return firstValue * secondValue;
      case "/":
        return secondValue !== 0 ? firstValue / secondValue : 0;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const inputValue = parseFloat(display);
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(formatDisplay(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleAllClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleClear = () => {
    if (display !== "0") {
      setDisplay("0");
      setWaitingForNewValue(false);
    } else {
      handleAllClear();
    }
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay("0.");
      setWaitingForNewValue(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const handleBackspace = () => {
    if (waitingForNewValue) {
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handlePercentage = () => {
    const value = parseFloat(display);
    setDisplay(formatDisplay(value / 100));
    setWaitingForNewValue(true);
  };

  const handlePlusMinus = () => {
    const value = parseFloat(display);
    setDisplay(formatDisplay(-value));
  };

  const handleSquare = () => {
    const value = parseFloat(display);
    const result = value * value;
    setDisplay(formatDisplay(result));
    setWaitingForNewValue(true);
  };

  const handleSquareRoot = () => {
    const value = parseFloat(display);
    if (value >= 0) {
      const result = Math.sqrt(value);
      setDisplay(formatDisplay(result));
      setWaitingForNewValue(true);
    }
  };

  const handleOneOverX = () => {
    const value = parseFloat(display);
    if (value !== 0) {
      const result = 1 / value;
      setDisplay(formatDisplay(result));
      setWaitingForNewValue(true);
    }
  };

  // Memory functions
  const handleMemoryAdd = () => {
    const value = parseFloat(display);
    setMemory(memory + value);
    setShowMemory(true);
  };

  const handleMemorySubtract = () => {
    const value = parseFloat(display);
    setMemory(memory - value);
    setShowMemory(true);
  };

  const handleMemoryRecall = () => {
    setDisplay(formatDisplay(memory));
    setWaitingForNewValue(true);
  };

  const handleMemoryClear = () => {
    setMemory(0);
    setShowMemory(false);
  };

  const getDisplayText = () => {
    if (display.length > 12) {
      const num = parseFloat(display);
      if (Math.abs(num) > 999999999) {
        return num.toExponential(5);
      }
      return display.substring(0, 12);
    }
    return display;
  };

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from header, not buttons
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - 400;
      const maxY = window.innerHeight - 100;
      
      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop - removed blur as per requirement */}
      <div 
        className="fixed inset-0 z-40 pointer-events-none"
      />
      
      {/* Calculator Panel */}
      <div
        className={cn(
          "fixed z-50 bg-background border-2 border-primary/60 shadow-2xl rounded-lg transition-all duration-300",
          isMinimized 
            ? "w-64 h-14 bottom-4 right-4" 
            : "w-full max-w-sm h-auto max-h-[75vh] bottom-4 right-4"
        )}
        style={{
          transform: isMinimized ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Draggable */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b bg-muted/50 rounded-t-lg cursor-move select-none"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-base">Calculator</h3>
            {showMemory && memory !== 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                (M: {formatDisplay(memory)})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="h-7 w-7 p-0 hover:bg-muted"
            >
              {isMinimized ? (
                <Maximize2 className="h-3.5 w-3.5" />
              ) : (
                <Minimize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-2.5 overflow-hidden flex flex-col gap-1.5">
            {/* Display */}
            <div className="w-full relative mb-1">
              <Input
                value={getDisplayText()}
                readOnly
                className="text-right text-2xl font-mono h-12 bg-muted/50 border-2 pr-3 pt-1.5 pb-1.5"
              />
              {operation && previousValue !== null && (
                <div className="absolute left-2 bottom-1 text-xs text-muted-foreground">
                  {formatDisplay(previousValue)} {operation}
                </div>
              )}
            </div>

            {/* Calculator Buttons Container */}
            <div className="flex flex-col gap-1 overflow-hidden">
              {/* Memory Functions Row */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant="outline"
                  onClick={handleMemoryClear}
                  className="h-7 text-xs font-medium bg-muted/50 hover:bg-muted disabled:opacity-50 py-0"
                  disabled={memory === 0}
                >
                  MC
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMemoryRecall}
                  className="h-7 text-xs font-medium bg-muted/50 hover:bg-muted disabled:opacity-50 py-0"
                  disabled={memory === 0}
                >
                  MR
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMemorySubtract}
                  className="h-7 text-xs font-medium bg-muted/50 hover:bg-muted py-0"
                >
                  M-
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMemoryAdd}
                  className="h-7 text-xs font-medium bg-muted/50 hover:bg-muted py-0"
                >
                  M+
                </Button>
              </div>

              {/* Clear & Operations Row */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant="outline"
                  onClick={handleAllClear}
                  className="h-8 text-xs font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive py-0"
                >
                  AC
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="h-8 text-xs font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive py-0"
                >
                  C
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBackspace}
                  className="h-8 text-xs font-semibold py-0"
                >
                  ⌫
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOperation("/")}
                  className="h-8 text-sm font-semibold bg-primary/10 hover:bg-primary/20 py-0"
                >
                  ÷
                </Button>
              </div>

              {/* Scientific Functions Row */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant="outline"
                  onClick={handleSquare}
                  className="h-8 text-xs font-semibold bg-secondary/50 hover:bg-secondary py-0"
                >
                  x²
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSquareRoot}
                  className="h-8 text-xs font-semibold bg-secondary/50 hover:bg-secondary py-0"
                >
                  √
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOneOverX}
                  className="h-8 text-xs font-semibold bg-secondary/50 hover:bg-secondary py-0"
                >
                  1/x
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOperation("*")}
                  className="h-8 text-sm font-semibold bg-primary/10 hover:bg-primary/20 py-0"
                >
                  ×
                </Button>
              </div>

              {/* Percentage & Numbers Row */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant="outline"
                  onClick={handlePercentage}
                  className="h-8 text-xs font-semibold bg-secondary/50 hover:bg-secondary py-0"
                >
                  %
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("7")}
                  className="h-8 text-sm font-semibold py-0"
                >
                  7
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("8")}
                  className="h-8 text-sm font-semibold py-0"
                >
                  8
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("9")}
                  className="h-8 text-sm font-semibold py-0"
                >
                  9
                </Button>
              </div>

              {/* Sign Toggle & Numbers Row */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant="outline"
                  onClick={handlePlusMinus}
                  className="h-8 text-xs font-semibold bg-secondary/50 hover:bg-secondary py-0"
                >
                  +/-
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("4")}
                  className="h-8 text-sm font-semibold py-0"
                >
                  4
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("5")}
                  className="h-8 text-sm font-semibold py-0"
                >
                  5
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("6")}
                  className="h-8 text-sm font-semibold py-0"
                >
                  6
                </Button>
              </div>

              {/* Subtraction & Numbers Row */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant="outline"
                  onClick={() => handleOperation("-")}
                  className="h-8 text-sm font-semibold bg-primary/10 hover:bg-primary/20 py-0"
                >
                  −
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("1")}
                  className="h-8 text-sm font-semibold py-0"
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("2")}
                  className="h-8 text-sm font-semibold py-0"
                >
                  2
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("3")}
                  className="h-8 text-sm font-semibold py-0"
                >
                  3
                </Button>
              </div>

              {/* Addition, Zero & Decimal Row */}
              <div className="grid grid-cols-4 gap-1">
                <Button
                  variant="outline"
                  onClick={() => handleOperation("+")}
                  className="h-8 text-sm font-semibold bg-primary/10 hover:bg-primary/20 py-0"
                >
                  +
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNumber("0")}
                  className="h-8 text-sm font-semibold col-span-2 py-0"
                >
                  0
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDecimal}
                  className="h-8 text-sm font-semibold py-0"
                >
                  .
                </Button>
              </div>

              {/* Equals Button */}
              <div className="grid grid-cols-1">
                <Button
                  onClick={handleEquals}
                  className="h-9 text-sm font-semibold bg-primary hover:bg-primary/90 py-0"
                >
                  =
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
