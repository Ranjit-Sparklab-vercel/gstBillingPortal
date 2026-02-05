"use client";

import calculatorImage from "@/image/calculator.png";

// Calculator Icon using image from src/image folder
export const CalculatorIcon = ({ className = "h-6 w-6" }: { className?: string }) => {
  return (
    <div 
      className={`${className} rounded-full overflow-hidden flex items-center justify-center bg-transparent`}
      draggable="false"
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDrag={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDragEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      style={{
        userSelect: 'none',
        WebkitUserDrag: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto',
      }}
    >
      <img
        src={calculatorImage.src || calculatorImage}
        alt="Calculator"
        className="w-full h-full object-cover rounded-full"
        draggable="false"
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onDrag={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        style={{
          imageRendering: 'crisp-edges',
          userSelect: 'none',
          pointerEvents: 'none',
          WebkitUserDrag: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          touchAction: 'none',
        }}
      />
    </div>
  );
};
