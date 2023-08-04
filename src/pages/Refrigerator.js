import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { AiOutlineLogout } from "react-icons/ai";

import {
  createIngredientApi,
  getIngredientApi,
  deleteIngredientApi,
} from "../api/refrigerator";

import ListItem from "../components/list";
import Pagination from "../components/pagination";

const Todo = () => {
  const navigate = useNavigate();

  const naviIngredient = () => {
    navigate("/ingredient");
  };

  const naviComplete = () => {
    navigate("/complete");
  };

  // token 리셋 안함. only page redirect
  const naviLogout = () => {
    navigate("/");
  };

  const [todoData, setTodoData] = useState();

  const todoInput = useRef();

  const onClickCreate = (e) => {
    e.preventDefault();
    if (!todoInput.current.value) {
      return;
    }

    createIngredientApi(todoInput.current.value)
      .then((res) => {
        todoInput.current.value = "";
      })
      .catch((err) => {
        throw new Error(err);
      });
  };

  useEffect(() => {
    // if (!localStorage.getItem("accessToken")) {
    //   navigate("/signin");
    // }
    // const getData = () => {
    //   getIngredientApi()
    //     .then((res) => {
    //       setTodoData(res.data);
    //     })
    //     .catch((err) => {
    //       throw new Error(err);
    //     });
    // };
    // getData();
  }, [todoData]);

  return (
    <>
      <RefrigeratorDes>
        <Blank />${}의 냉장고 <AiOutlineLogout onClick={naviLogout} />
      </RefrigeratorDes>

      {/* <Pagination avata={avata} myAvata={myAvata} isLoggedIn={isLoggedIn} /> */}
      <Pagination />

      <List>
        {todoData?.length === 0 ? (
          <IngredientDes>선택된 재료 : 재료를 선택해주세요!</IngredientDes>
        ) : (
          <>
            <IngredientDes>선택된 재료 : </IngredientDes>
            {todoData?.length &&
              todoData.map((todo) => (
                <ListItem
                  todoList={todo}
                  key={todo.id}
                  id={todo.id}
                  todo={todo.todo}
                  isCompleted={todo.isCompleted}
                  userId={todo.userId}
                />
              ))}
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

export default Todo;
