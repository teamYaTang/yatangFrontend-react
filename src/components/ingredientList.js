import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

import { deleteIngredientApi } from "../api/refrigerator";

// Ingredient 페이지에서 재료 보여주는 List
const IngredientList = ({ id, todo, isCompleted, userId, todoList }) => {
  const [isEdit, setIsEdit] = useState(false);

  const todoUpdateInput = useRef();

  useEffect(() => {}, []);

  const onClickDelete = (e) => {
    e.preventDefault();

    deleteIngredientApi(id)
      .then((res) => {})
      .catch((err) => {
        throw new Error(err);
      });
  };

  return (
    <>
      {id ? (
        isEdit ? (
          <Sec>
            <Li>
              <input
                type="checkbox"
                id="check"
                // onChange={isCheck}
                checked={isCompleted}
              />
              <input
                data-testid="modify-input"
                placeholder={todo}
                defaultValue={todo}
                ref={todoUpdateInput}
              ></input>
              <Edit data-testid="submit-button" onClick={onClickUpdate}>
                제출
              </Edit>
              <Delete data-testid="cancel-button" onClick={onClickCancel}>
                취소
              </Delete>
            </Li>
          </Sec>
        ) : (
          <Sec>
            <Li>
              <input type="checkbox" onChange={isCheck} checked={isCompleted} />
              <Text>{todo}</Text>
              <Edit data-testid="modify-button" onClick={onClickEdit}>
                수정
              </Edit>
              <Delete data-testid="delete-button" onClick={onClickDelete}>
                삭제
              </Delete>
            </Li>
          </Sec>
        )
      ) : (
        <Sec>
          <div>재료를 추가해보세요!</div>
        </Sec>
      )}
    </>
  );
};

export default IngredientList;

let Sec = styled.div`
  width: 342px;

  display: flex;
  margin-bottom: 1vh;
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

let Li = styled.li``;

let Text = styled.span``;

let Edit = styled.button`
  margin: 0 0.5vh 0 2vh;

  background: #272a33;
  border-radius: 6px;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 700;
  font-size: 15px;
  line-height: 135%;

  text-align: center;

  color: #ff6953;

  &:hover {
    cursor: pointer;
  }
`;

let Delete = styled.button`
  background: #272a33;
  border-radius: 6px;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 700;
  font-size: 15px;
  line-height: 135%;

  text-align: center;

  color: #ff6953;

  &:hover {
    cursor: pointer;
  }
`;
