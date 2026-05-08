import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import NickName from "../pages/NickName";
import Refrigerator from "../pages/Refrigerator";
import Ingredient from "../pages/Ingredient";
import Loading from "../pages/Loading";
import AiRecipePage from "../pages/AiRecipePage";
import CartPage from "../pages/CartPage";
import RecipeBookPage from "../pages/RecipeBookPage";
import Settings from "../pages/Settings";
import OAuthCallback from "../pages/OAuthCallback";
import MainShell from "../layouts/MainShell";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/nickname" element={<NickName />} />
        <Route path="/loading" element={<Loading />} />

        <Route element={<MainShell />}>
          <Route path="/" element={<Navigate to="/refrigerator" replace />} />
          <Route path="/refrigerator" element={<Refrigerator />} />
          <Route path="/ingredient" element={<Ingredient />} />
          <Route path="/ai-recipe" element={<AiRecipePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/recipe-book" element={<RecipeBookPage />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/complete" element={<Navigate to="/ai-recipe" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
