import React from "react";

import "../styles/Loading.css";

import LogoImg from "../assets/LogoImg.png";

const Loading = () => {


  return (
    <>
      <img src={LogoImg} className="loading-logo" alt="logo" />
      <div className="loading-title">yatang이는 요리 생각중...</div>
    </>
  );
};

export default Loading;
