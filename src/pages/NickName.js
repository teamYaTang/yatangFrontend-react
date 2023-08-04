import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const NickName = () => {
  const navigate = useNavigate();
  /*
  const onSubmit = () => {
    signin({ id, password })
      .then((data) => {
        localStorage.setItem("accessToken", data.accessToken);
        setAuthorization(data);
      })
      .catch((error) => alert(error.message));

    //조건문 추가해서 냉장고로 갈지 닉네임으로 갈지 결정
    navigate("/refrigerator");
  };
  */

  const naviRefrigerator = () => {
    navigate("/refrigerator");
  };

  const [nickName, setNickName] = useState("");

  const [isNickName, setIsNickName] = useState(false);

  const [isResult, setIsResult] = useState(false);

  const onChange = (e) => {
    console.log("click");
    const {
      target: { name, value },
    } = e;
    if (name === "nickName") {
      setNickName(value);
      if (nickName.length >= 6) {
        setIsNickName(true);
      } else {
        setIsNickName(false);
      }
    }

    if (isNickName) {
      setIsResult(true);
    }
  };

  /*
  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/todo");
    }
  }, []);
  */

  return (
    <>
      <form>
        <Title>냉장고의 닉네임을 정해주세요!</Title>
        <IdPass
          name="nickName"
          placeholder="2-10자리 이내 영문 또는 한글"
          required
          minLength={2}
          maxLength={10}
          value={nickName}
          onChange={onChange}
          onKeyUp={onChange}
        ></IdPass>
      </form>
      {isResult ? (
        <Auth date-testid="signin-button" onClick={naviRefrigerator}>
          냉장고 채울게요
        </Auth>
      ) : (
        <Auth date-testid="signin-button" className="disabled" disabled>
          냉장고 채울게요
        </Auth>
      )}
    </>
  );
};

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

let IdPass = styled.input`
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

let Auth = styled.button`
  margin-top: 1vh;
  width: 342px;
  height: 56px;

  border: none;
  background: #b5eaff;
  border-radius: 6px;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 700;
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

export default NickName;
