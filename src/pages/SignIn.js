import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import LogoImg from "../assets/LogoImg.png";
import { signin } from "../api/auth";
import { setAuthorization } from "../api/apiClient";

const SignIn = () => {
  const navigate = useNavigate();

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

  const naviSignUp = () => {
    navigate("/signup");
  };

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const [isId, setIsId] = useState(false);
  const [isPassword, setIsPassword] = useState(false);

  const [isResult, setIsResult] = useState(false);

  const onChange = (e) => {
    console.log("click");
    const {
      target: { name, value },
    } = e;
    if (name === "id") {
      setId(value);
      if (id.length >= 6) {
        setIsId(true);
      } else {
        setIsId(false);
      }
    } else if (name === "password") {
      setPassword(value);
      if (password.length >= 8) {
        setIsPassword(true);
      } else {
        setIsPassword(false);
      }
    }

    if (isPassword) {
      setIsResult(true);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/todo");
    }
  }, []);

  return (
    <>
      <Logo src={LogoImg} />
      <form>
        <Title>아이디</Title>
        <IdPass
          name="id"
          placeholder="아이디"
          required
          minLength={6}
          maxLength={10}
          value={id}
          onChange={onChange}
          onKeyUp={onChange}
        ></IdPass>
        {isId ? (
          <Valid className="validTrue"></Valid>
        ) : (
          <Valid>
            6자 이상 10자 이하 영문, 숫자조합의 아이디를 입력해주세요.
          </Valid>
        )}
        <Title>비밀번호</Title>

        <IdPass
          data-testid="password-input"
          name="password"
          type="password"
          placeholder="비밀번호"
          required
          minLength={8}
          maxLength={15}
          value={password}
          onChange={onChange}
          onKeyUp={onChange}
        ></IdPass>
        {isPassword ? (
          <Valid className="validTrue"></Valid>
        ) : (
          <Valid>8자 이상 15자 이하의 비밀번호를 입력해주세요.</Valid>
        )}
      </form>
      <Blank></Blank>
      {isResult ? (
        <Auth date-testid="signin-button" onClick={onSubmit}>
          로그인
        </Auth>
      ) : (
        <Auth date-testid="signin-button" className="disabled" disabled>
          로그인
        </Auth>
      )}
      <Auth onClick={naviSignUp}>회원가입</Auth>
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

let Blank = styled.div`
  margin: 3vh;
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

let Valid = styled.div`
  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 13px;
  line-height: 135%;
  align-item: left;

  padding: 0.5vh 0 1.5vh 0.5vh;
  color: #6b6b6b;

  &.validTrue {
    height: 18px;
  }
`;

export default SignIn;
