import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { AiOutlineLeft } from "react-icons/ai";

const Ingredient = () => {
  const navigate = useNavigate();

  const naviRefrigerator = () => {
    //조건문 추가해서 냉장고로 갈지 닉네임으로 갈지 결정
    navigate("/refrigerator");
  };

  const naviUndo = () => {
    navigate(-1);
  };

  const [ingredient, setIngredient] = useState("");

  const [isResult, setIsResult] = useState(false);

  const onChange = (e) => {
    const {
      target: { name, value },
    } = e;
    if (name === "ingredient") {
      setIngredient(value);
    }
  };

  useEffect(() => {
    // if (localStorage.getItem("accessToken")) {
    //   navigate("/todo");
    // }
  }, []);

  return (
    <>
      <RefrigeratorDes>
        <AiOutlineLeft onClick={naviUndo} />
        <Title>${}의 냉장고</Title>
      </RefrigeratorDes>

      <form>
        <Add
          name="ingredient"
          placeholder="넣을 재료를 입력하세요!"
          required
          maxLength={6}
          value={ingredient}
          onChange={onChange}
          onKeyUp={onChange}
        ></Add>
      </form>
      <Blank></Blank>

      <Btn onClick={naviRefrigerator}>냉장고 재료 저장</Btn>
    </>
  );
};

let RefrigeratorDes = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-content: flex-start;
  justify-content: space-between;
  align-items: center;

  margin: 2vh;

  width: 38vh;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 700;
  font-size: 15px;
  line-height: 135%;

  color: #000000;
`;

let Title = styled.div`
  margin-bottom: 4px;
  padding: 0 0 0 0.5vh;
  align-item: left;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 15px;
  line-height: 135%;
`;

let Add = styled.input`
  padding: 12px 12px;

  box-sizing: border-box;

  width: 342px;
  height: 50px;

  border: 1px solid #6b6b6b;
  border-radius: 6px;
  background-color: #fff062;

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

let Blank = styled.div`
  margin: 3vh;
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

export default Ingredient;
