import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import NickName from "../pages/NickName";
import Refrigerator from "../pages/Refrigerator";
import Ingredient from "../pages/Ingredient";
import Loading from "../pages/Loading";
import Complete from "../pages/Complete";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인기능 및 홈 */}
        <Route path="/" element={<SignIn />} />
        {/* 회원가입기능 */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/nickname" element={<NickName />} />
        <Route path="/refrigerator" element={<Refrigerator />} />
        <Route path="/ingredient" element={<Ingredient />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/complete" element={<Complete />} />
      </Routes>
    </BrowserRouter>
  );
}
