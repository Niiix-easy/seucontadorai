import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionState, setTransitionState] = useState<"enter" | "exit">("enter");
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      setTransitionState("exit");

      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionState("enter");
        prevPathRef.current = location.pathname;
      }, 150);

      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  }, [location.pathname, children]);

  return (
    <div
      className={`transition-all duration-200 ease-out ${
        transitionState === "enter"
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2"
      }`}
    >
      {displayChildren}
    </div>
  );
}
