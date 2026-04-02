import { useEffect, useState } from "react";

// Import all HTML animations as raw strings
const animations = import.meta.glob('../../../Animations/Cat-Animations/Image-Check/*.html', { 
  query: '?raw', 
  import: 'default',
  eager: true 
}) as Record<string, string>;

const animationHtmls = Object.values(animations);

interface CatImageCheckingAnimationProps {
  texts?: string[];
  textColor?: string;
  className?: string;
}

export function CatImageCheckingAnimation({
  className = "",
}: CatImageCheckingAnimationProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");

  useEffect(() => {
    if (animationHtmls.length > 0) {
      const randomIndex = Math.floor(Math.random() * animationHtmls.length);
      setHtmlContent(animationHtmls[randomIndex]);
    }
  }, []);

  if (!htmlContent) {
    return (
      <div className={`flex items-center justify-center min-h-[250px] ${className}`}>
        {/* Fallback while loading or if no animations found */}
      </div>
    );
  }

  // Use a wrapper with fixed compact height to prevent modal scrolling,
  // and scale down the iframe which needs more internal space (450x400) 
  // to fit nicely within the smaller wrapper.
  return (
    <div className={`relative flex flex-col items-center justify-center w-full max-w-[320px] h-[250px] overflow-hidden mx-auto ${className}`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[400px] flex items-center justify-center scale-[0.6] sm:scale-[0.65]">
        <iframe 
          srcDoc={htmlContent} 
          className="w-full h-full border-none overflow-hidden"
          scrolling="no"
          title="Cat Image Checking Animation"
        />
      </div>
    </div>
  );
}
