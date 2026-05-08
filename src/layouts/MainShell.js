import React, { useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppBottomNav from "../components/AppBottomNav";
import { mainNavIndex } from "../shared/mainNavConfig";
import "../styles/MainShell.css";

export default function MainShell() {
  const location = useLocation();
  const { pathname } = location;

  const navRef = useRef({ lastMain: null });
  const [slideClass, setSlideClass] = useState("");

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
