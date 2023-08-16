import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

// 냉장고 화면에서 냉장고 재료 보여주는 리스트
const List = ({ key, img, com, nickName, isLoggedIn }) => {
  const navigate = useNavigate();

  const naviInfo = () => {
    navigate("/info", {
      state: {
        img,
        key,
        nickName,
        com,
        isLoggedIn,
      },
    });
  };

  return (
    <>
      <Con>
        <Des>{nickName}</Des>
      </Con>
    </>
  );
};

export default List;

let Con = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  background: #f3f3f3;
  border: 1px solid #000000;
  border-radius: 88.5px;
  width: 100%;
  height: 100%;
  background: #000000;
`;

let Des = styled.div`
  background: #f4f4f4;
  border-radius: 40px;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 2px 8px;

  width: max-content;
  height: 18px;

  font-family: "Noto Sans KR";
  font-style: normal;
  font-weight: 700;
  font-size: 8px;
  line-height: 130%;

  text-align: center;

  color: #505050;
`;
