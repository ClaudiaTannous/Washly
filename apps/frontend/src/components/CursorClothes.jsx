"use client";

import { useEffect } from "react";

export default function CursorClothes() {
  useEffect(() => {
    const clothes = ["👕", "🧦", "👖", "🧥"];

    function handleMouseMove(e) {
      const span = document.createElement("span");

      span.innerText = clothes[Math.floor(Math.random() * clothes.length)];
      span.style.position = "fixed";
      span.style.left = e.clientX + "px";
      span.style.top = e.clientY + "px";
      span.style.fontSize = "20px";
      span.style.pointerEvents = "none";
      span.style.zIndex = 9999;
      span.style.transition = "all 1s ease-out";
      span.style.opacity = "1";

      document.body.appendChild(span);

      // animate
      requestAnimationFrame(() => {
        span.style.transform = "translateY(-30px) scale(1.4)";
        span.style.opacity = "0";
      });

      // cleanup
      setTimeout(() => {
        span.remove();
      }, 1000);
    }

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return null;
}
