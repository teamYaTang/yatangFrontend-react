import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { AiOutlineLogout } from "react-icons/ai";

import {
  getMainFridgeApi,
  getFridgeItemsApi,
  getFreezerItemsApi,
} from "../api/refrigerator";
import { getUserProfile } from "../api/auth";
import { getUserIdFromToken } from "../utils/jwt";
import Pagination from "../components/pagination";

const Refrigerator = () => {
  const navigate = useNavigate();

  const naviIngredient = () => {
    navigate("/ingredient");
  };

  const naviComplete = () => {
    navigate("/complete");
  };

  const naviLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  const [userNickname, setUserNickname] = useState("");
  const [fridgeId, setFridgeId] = useState(null);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [freezerItems, setFreezerItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      try {
        const userId = getUserIdFromToken();
        if (!userId) {
          navigate("/");
          return;
        }

        // 사용자 정보 조회
        const userProfile = await getUserProfile(userId);
        setUserNickname(userProfile.nickname || "");

        // 메인 냉장고 조회
        const mainFridge = await getMainFridgeApi();
        setFridgeId(mainFridge.data.id);

        // 냉장실 아이템 조회
        const fridgeItemsData = await getFridgeItemsApi(mainFridge.data.id);
        setFridgeItems(fridgeItemsData.data || []);

        // 냉동실 아이템 조회
        const freezerItemsData = await getFreezerItemsApi(mainFridge.data.id);
        setFreezerItems(freezerItemsData.data || []);
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  if (loading) {
    return <LoadingText>로딩 중...</LoadingText>;
  }

  const totalItems = fridgeItems.length + freezerItems.length;

  return (
    <>
      <RefrigeratorDes>
        <Blank />
        {userNickname}의 냉장고 <AiOutlineLogout onClick={naviLogout} />
      </RefrigeratorDes>

      <Pagination />

      <List>
        {totalItems === 0 ? (
          <IngredientDes>냉장고가 비어있습니다. 재료를 추가해주세요!</IngredientDes>
        ) : (
          <>
            <IngredientDes>
              냉장실: {fridgeItems.length}개 | 냉동실: {freezerItems.length}개
            </IngredientDes>
          </>
        )}
      </List>
      <Btn onClick={naviIngredient}>냉장고 재료 수정</Btn>
      <Btn onClick={naviComplete}>요리하러가기</Btn>
    </>
  );
};

let RefrigeratorDes = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin: 2vh;

  width: 38vh;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 700;
  font-size: 15px;
  line-height: 135%;

  text-align: center;

  color: #00000099;
`;

let Blank = styled.div``;

let Sec = styled.div`
  display: flex;
  width: 342px;
`;

let Input = styled.input`
  padding: 12px 12px;

  box-sizing: border-box;

  width: 80%;
  height: 50px;

  border: 1px solid #b1b1b1;
  border-radius: 6px;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 15px;
  line-height: 135%;

  align-item: center;

  &:focus {
    border: none;
  }

  color: #b7b7b7;
`;

let Submit = styled.button`
  width: 20%;

  background: #272a33;
  border-radius: 6px;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 700;
  font-size: 15px;
  line-height: 135%;

  text-align: center;

  color: #ff6953;

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    cursor: pointer;
  }

  &.disabled {
    color: #ffffff;
  }
`;

let IngredientDes = styled.div`
  align-items: left;
  justify-items: left;
  text-align: left;
`;

let List = styled.div`
  margin-top: 1vh;
`;

let Btn = styled.button`
  margin-top: 1vh;
  width: 342px;
  height: 56px;

  border: none;
  background: #b5eaff;
  border-radius: 6px;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 15px;
  font-color: #000000;
  line-height: 135%;

  text-align: center;

  color: #000000;

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    cursor: pointer;
  }

  &.disabled {
    color: #d9d9d9;
  }
`;

let LoadingText = styled.div`
  text-align: center;
  padding: 50px;
  font-family: "Noto Sans KR", sans-serif;
`;

export default Refrigerator;
