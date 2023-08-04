import React from "react";
import styled from "styled-components";

export default function Button(props) {
  return <ButtonContainer>{props.title}</ButtonContainer>;
}

let ButtonContainer = styled.button`
  margin-top: 1vh;
  width: 342px;
  height: 56px;

  background: #b5eaff;
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
