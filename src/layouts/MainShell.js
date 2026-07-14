import React, { useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppBottomNav from "../components/AppBottomNav";
import { mainNavIndex } from "../shared/mainNavConfig";
import "../styles/MainShell.css";

function scrollWindowToTop() {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  } catch {
    window.scrollTo(0, 0);
  }
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

export default function MainShell() {
  const location = useLocation();
  const { pathname } = location;

  const navRef = useRef({ lastMain: null });
  const [slideClass, setSlideClass] = useState("");

  useLayoutEffect(() => {
    scrollWindowToTop();
  }, [pathname]);

  useLayoutEffect(() => {
    const idx = mainNavIndex(pathname);
    if (idx === null) {
      setSlideClass("");
      return;
    }
    const prev = navRef.current.lastMain;
    if (prev !== null && prev !== idx) {
      setSlideClass(idx > prev ? "main-shell-outlet--right" : "main-shell-outlet--left");
    } else {
      setSlideClass("");
    }
    navRef.current.lastMain = idx;
  }, [pathname]);

  const animClass = slideClass;

  return (
    <div className="main-shell">
      <div className={`main-shell-outlet ${animClass}`} key={pathname}>
        <Outlet />
      </div>
      <AppBottomNav />
    </div>
  );
}
