import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignUp.css";

import { signup } from "../api/auth";
import { startOAuthLogin } from "../utils/oauthRedirect";
import { useToast } from "../context/ToastContext";
import { getUserIdFromToken, isLoggedIn } from "../utils/jwt";
import { ensureAccessToken } from "../api/apiClient";

const SignUp = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isEmail, setIsEmail] = useState(false);
  const [isId, setIsId] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [isConfirmPassword, setIsConfirmPassword] = useState(false);
  const [isResult, setIsResult] = useState(false);

  const handleChange = (e) => {
    const {
      target: { name, value },
    } = e;

    if (name === "email") {
      setEmail(value);
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsEmail(regex.test(value));
    } else if (name === "id") {
      setId(value);
      setIsId(value.length >= 6 && value.length <= 10);
    } else if (name === "password") {
      setPassword(value);
      setIsPassword(value.length >= 8 && value.length <= 15);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
      setIsConfirmPassword(value === password && value.length >= 8);
    }

    const nextEmail = name === "email" ? value : email;
    const nextId = name === "id" ? value : id;
    const nextPw = name === "password" ? value : password;
    const nextConfirm = name === "confirmPassword" ? value : confirmPassword;

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail);
    const idValid = nextId.length >= 6 && nextId.length <= 10;
    const pwValid = nextPw.length >= 8 && nextPw.length <= 15;
    const confirmValid = nextConfirm === nextPw && nextConfirm.length >= 8;
    setIsResult(emailValid && idValid && pwValid && confirmValid);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isResult) return;

    signup({
      email,
      username: id,
      password,
      confirmPassword,
    })
      .then(() => {
        toast("회원가입이 완료되었습니다. 로그인 해주세요.");
        navigate("/");
      })
      .catch((error) => toast(error.message));
  };

  const handleSocialSignup = (provider) => {
    startOAuthLogin(provider);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isLoggedIn()) return;
      const ok = await ensureAccessToken();
      if (cancelled) return;
      if (ok && getUserIdFromToken()) {
        navigate("/refrigerator", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h1 className="signup-heading">계정을 만들어볼까요?</h1>
        <p className="signup-subheading">몇 가지 정보만 입력하면 바로 시작할 수 있어요.</p>

        <form onSubmit={handleSubmit}>
          <div className="signup-field">
            <label className="signup-label">이메일</label>
            <input
              className="signup-input"
              type="email"
              name="email"
              placeholder="example@email.com"
              value={email}
              onChange={handleChange}
            />
            {!isEmail && email && (
              <p className="signup-validation-msg">올바른 이메일 형식을 입력해주세요.</p>
            )}
          </div>

          <div className="signup-field">
            <label className="signup-label">아이디</label>
            <input
              className="signup-input"
              name="id"
              placeholder="6~10자 영문/숫자 조합"
              value={id}
              onChange={handleChange}
            />
            {!isId && id && (
              <p className="signup-validation-msg">6~10자의 영문/숫자 조합으로 입력해주세요.</p>
            )}
          </div>

          <div className="signup-field">
            <label className="signup-label">비밀번호</label>
            <input
              className="signup-input"
              type="password"
              name="password"
              placeholder="8~15자 비밀번호"
              value={password}
              onChange={handleChange}
            />
            {!isPassword && password && (
              <p className="signup-validation-msg">8~15자의 비밀번호를 입력해주세요.</p>
            )}
          </div>

          <div className="signup-field">
            <label className="signup-label">비밀번호 확인</label>
            <input
              className="signup-input"
              type="password"
              name="confirmPassword"
              placeholder="비밀번호를 한 번 더 입력하세요"
              value={confirmPassword}
              onChange={handleChange}
            />
            {!isConfirmPassword && confirmPassword && (
              <p className="signup-validation-msg">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          <button className="signup-submit-button" type="submit" disabled={!isResult}>
            회원가입
          </button>
        </form>

        <div className="signup-divider">
          <span>또는</span>
        </div>

        <div className="signup-social-group">
          <button
            className="signup-social-button kakao"
            type="button"
            onClick={() => handleSocialSignup("kakao")}
          >
            카카오로 간편 가입
          </button>
          <button
            className="signup-social-button google"
            type="button"
            onClick={() => handleSocialSignup("google")}
          >
            Google로 가입
          </button>
        </div>

        <p className="signup-signin-text">
          이미 계정이 있으신가요?{" "}
          <button className="signup-signin-link" type="button" onClick={() => navigate("/")}>
            로그인
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
