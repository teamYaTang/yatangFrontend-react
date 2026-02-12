import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignIn.css";

import LogoImg from "../assets/LogoImg.png";
import { signin } from "../api/auth";

const SignIn = () => {
  const navigate = useNavigate();

  const onSubmit = () => {
    signin({ username: userid, password: userpw })
      .then((data) => {
        alert("성공적으로 로그인 되었습니다.");
        // 로그인 성공 후 냉장고 페이지로 이동
        navigate("/refrigerator");
      })
      .catch((error) => {
        console.error("로그인 에러:", error);
        alert(error.message);
      });
  };

  const naviSignUp = () => {
    navigate("/signup");
  };

  const [userid, setUserid] = useState("");
  const [userpw, setUserpw] = useState("");

  const [isId, setIsId] = useState(false);
  const [isPassword, setIsPassword] = useState(false);

  const [isResult, setIsResult] = useState(false);

  const onChange = (e) => {
    const {
      target: { name, value },
    } = e;
    if (name === "id") {
      setUserid(value);
      if (value.length >= 6 && value.length <= 10) {
        setIsId(true);
      } else {
        setIsId(false);
      }
    } else if (name === "password") {
      setUserpw(value);
      if (value.length >= 8 && value.length <= 15) {
        setIsPassword(true);
      } else {
        setIsPassword(false);
      }
    }

    // 모든 필드가 유효할 때만 로그인 버튼 활성화
    const validId = name === "id"
      ? (value.length >= 6 && value.length <= 10)
      : (userid.length >= 6 && userid.length <= 10);
    const validPassword = name === "password"
      ? (value.length >= 8 && value.length <= 15)
      : (userpw.length >= 8 && userpw.length <= 15);

    setIsResult(validId && validPassword);
  };

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/refrigerator");
    }
  }, [navigate]);

  return (
    <>
      <img src={LogoImg} className="signin-logo" alt="logo" />
      <form>
        <div className="signin-title">아이디</div>
        <input
          className="signin-input"
          name="id"
          placeholder="아이디"
          required
          minLength={6}
          maxLength={10}
          value={userid}
          onChange={onChange}
          onKeyUp={onChange}
        />
        {isId ? (
          <div className="signin-validation valid-true"></div>
        ) : (
          <div className="signin-validation">
            6자 이상 10자 이하 영문, 숫자조합의 아이디를 입력해주세요.
          </div>
        )}
        <div className="signin-title">비밀번호</div>

        <input
          className="signin-input"
          data-testid="password-input"
          name="password"
          type="password"
          placeholder="비밀번호"
          required
          minLength={8}
          maxLength={15}
          value={userpw}
          onChange={onChange}
          onKeyUp={onChange}
        />
        {isPassword ? (
          <div className="signin-validation valid-true"></div>
        ) : (
          <div className="signin-validation">8자 이상 15자 이하의 비밀번호를 입력해주세요.</div>
        )}
      </form>
      <div className="signin-blank"></div>
      {isResult ? (
        <button className="signin-auth-button" date-testid="signin-button" onClick={onSubmit}>
          로그인
        </button>
      ) : (
        <button className="signin-auth-button disabled" date-testid="signin-button" disabled>
          로그인
        </button>
      )}
      <button className="signin-auth-button" onClick={naviSignUp}>회원가입</button>
    </>
  );
};

export default SignIn;
