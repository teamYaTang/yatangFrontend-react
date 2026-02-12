import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/List.css";

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
      <div className="list-container">
        <div className="list-description">{nickName}</div>
      </div>
    </>
  );
};

export default List;
