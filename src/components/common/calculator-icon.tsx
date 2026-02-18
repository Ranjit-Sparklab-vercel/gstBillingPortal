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
        WebkitUserDrag: 'none' as any,
        WebkitUserSelect: 'none' as any,
        MozUserSelect: 'none' as any,
        msUserSelect: 'none' as any,
        touchAction: 'none',
        pointerEvents: 'auto',
      } as React.CSSProperties}
    >
      <img
        src={typeof calculatorImage === 'string' ? calculatorImage : calculatorImage.src}
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
          WebkitUserDrag: 'none' as any,
          WebkitUserSelect: 'none' as any,
          MozUserSelect: 'none' as any,
          msUserSelect: 'none' as any,
          touchAction: 'none',
        } as React.CSSProperties}
      />
    </div>
  );
};
