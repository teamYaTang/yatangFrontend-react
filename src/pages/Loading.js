import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import LogoImg from "../assets/LogoImg.png";

const Loading = () => {
  const navigate = useNavigate();

  const naviComplete = () => {
    navigate("/complete");
  };

  return (
    <>
      <Logo src={LogoImg} />
      <Title>yatang이는 요리 생각중...</Title>
    </>
  );
};

let Logo = styled.img`
  width: 257px;
  height: 260px;

  margin-bottom: 10vh;
`;

let Title = styled.div`
  margin-bottom: 4px;
  padding: 0 0 0 0.5vh;
  align-item: left;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 18px;
  line-height: 135%;
`;

export default Loading;
