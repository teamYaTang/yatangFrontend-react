import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { signup } from "../api/auth";

const SignUp = () => {
  const navigate = useNavigate();

  const onSubmit = () => {
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    signup({ 
      email: email,
      username: id, 
      password: password,
      confirmPassword: confirmPassword
    })
      .then((response) => {
        alert("성공적으로 가입 되었습니다.");
        navigate("/");
      })
      .catch((error) => alert(error.message));
  };

  const naviSignIn = () => {
    navigate("/");
  };

  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isEmail, setIsEmail] = useState(false);
  const [isId, setIsId] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [isConfirmPassword, setIsConfirmPassword] = useState(false);

  const [isResult, setIsResult] = useState(false);

  const onChange = (e) => {
    const {
      target: { name, value },
    } = e;
    if (name === "email") {
      setEmail(value);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsEmail(emailRegex.test(value));
    } else if (name === "id") {
      setId(value);
      if (value.length >= 6 && value.length <= 10) {
        setIsId(true);
      } else {
        setIsId(false);
      }
    } else if (name === "password") {
      setPassword(value);
      if (value.length >= 8 && value.length <= 15) {
        setIsPassword(true);
      } else {
        setIsPassword(false);
      }
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
      const currentPassword = password; // 현재 password 값 사용
      if (value === currentPassword && value.length >= 8) {
        setIsConfirmPassword(true);
      } else {
        setIsConfirmPassword(false);
      }
    }

    // 모든 필드가 유효할 때만 회원가입 버튼 활성화
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const currentEmail = name === "email" ? value : email;
    const currentId = name === "id" ? value : id;
    const currentPassword = name === "password" ? value : password;
    const currentConfirmPassword = name === "confirmPassword" ? value : confirmPassword;
    
    const validEmail = emailRegex.test(currentEmail);
    const validId = currentId.length >= 6 && currentId.length <= 10;
    const validPassword = currentPassword.length >= 8 && currentPassword.length <= 15;
    const validConfirm = currentConfirmPassword === currentPassword && currentConfirmPassword.length >= 8;
    
    setIsResult(validEmail && validId && validPassword && validConfirm);
  };

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/refrigerator");
    }
  }, []);

  return (
    <>
      <LogoDes>회원가입</LogoDes>
      <form>
        <Title>이메일</Title>
        <IdPass
          name="email"
          type="email"
          placeholder="이메일"
          required
          value={email}
          onChange={onChange}
          onKeyUp={onChange}
        ></IdPass>
        {isEmail ? (
          <Valid className="validTrue"></Valid>
        ) : (
          <Valid>올바른 이메일 형식을 입력해주세요.</Valid>
        )}
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
        <Title>비밀번호 확인</Title>
        <IdPass
          name="confirmPassword"
          type="password"
          placeholder="비밀번호 확인"
          required
          minLength={8}
          maxLength={15}
          value={confirmPassword}
          onChange={onChange}
          onKeyUp={onChange}
        ></IdPass>
        {isConfirmPassword ? (
          <Valid className="validTrue"></Valid>
        ) : (
          <Valid>비밀번호가 일치하지 않습니다.</Valid>
        )}
      </form>
      <Blank></Blank>
      <LoginDes onClick={naviSignIn}>
        이미 회원가입을 하셨나요? 로그인하러가기
      </LoginDes>
      {isResult ? (
        <Auth date-testid="signup-button" onClick={onSubmit}>
          회원가입
        </Auth>
      ) : (
        <Auth date-testid="signup-button" className="disabled" disabled>
          회원가입
        </Auth>
      )}
    </>
  );
};

let LogoDes = styled.div`
  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  line-height: 135%;

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

let LoginDes = styled.div`
  width: 100%;

  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 700;
  font-size: 15px;
  line-height: 135%;

  text-align: center;
  margin-bottom: 0.5vh;

  color: #00000099;

  &:hover {
    cursor: pointer;
    color: #ff6953;
  }
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

export default SignUp;
