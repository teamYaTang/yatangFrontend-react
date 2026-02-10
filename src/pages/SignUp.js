import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { signup } from "../api/auth";
import apiClient from "../api/apiClient";

const SignUp = () => {
  const navigate = useNavigate();

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
        alert("회원가입이 완료되었습니다. 로그인 해주세요!");
        navigate("/");
      })
      .catch((error) => alert(error.message));
  };

  const handleSocialSignup = async (provider) => {
    try {
      const { data } = await apiClient.get(`/oauth2/authorization/${provider}`);
      alert(data.message || `${provider} 간편 로그인 준비 중입니다.`);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "간편 로그인 연동을 준비 중입니다. 잠시만 기다려 주세요.",
      );
    }
  };

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/refrigerator");
    }
  }, [navigate]);

  return (
    <Page>
      <Card>
        <Heading>계정을 만들어볼까요?</Heading>
        <Subheading>몇 가지 정보만 입력하면 바로 시작할 수 있어요.</Subheading>

        <form onSubmit={handleSubmit}>
          <Field>
            <Label>이메일</Label>
            <Input
              type="email"
              name="email"
              placeholder="example@email.com"
              value={email}
              onChange={handleChange}
            />
            {!isEmail && email && (
              <Validation>올바른 이메일 형식을 입력해주세요.</Validation>
            )}
          </Field>

          <Field>
            <Label>아이디</Label>
            <Input
          name="id"
              placeholder="6~10자 영문/숫자 조합"
          value={id}
              onChange={handleChange}
            />
            {!isId && id && (
              <Validation>6~10자의 영문/숫자 조합으로 입력해주세요.</Validation>
        )}
          </Field>

          <Field>
            <Label>비밀번호</Label>
            <Input
              type="password"
          name="password"
              placeholder="8~15자 비밀번호"
              value={password}
              onChange={handleChange}
            />
            {!isPassword && password && (
              <Validation>8~15자의 비밀번호를 입력해주세요.</Validation>
            )}
          </Field>

          <Field>
            <Label>비밀번호 확인</Label>
            <Input
          type="password"
              name="confirmPassword"
              placeholder="비밀번호를 한 번 더 입력하세요"
              value={confirmPassword}
              onChange={handleChange}
            />
            {!isConfirmPassword && confirmPassword && (
              <Validation>비밀번호가 일치하지 않습니다.</Validation>
        )}
          </Field>

          <SubmitButton type="submit" disabled={!isResult}>
            회원가입
          </SubmitButton>
      </form>

        <Divider>
          <span>또는</span>
        </Divider>

        <SocialGroup>
          <SocialButton
            type="button"
            $variant="kakao"
            onClick={() => handleSocialSignup("kakao")}
          >
            카카오로 간편 가입
          </SocialButton>
          <SocialButton
            type="button"
            $variant="google"
            onClick={() => handleSocialSignup("google")}
          >
            Google로 가입
          </SocialButton>
        </SocialGroup>

        <SignInText>
          이미 계정이 있으신가요?{" "}
          <SignInLink type="button" onClick={() => navigate("/")}>
            로그인
          </SignInLink>
        </SignInText>
      </Card>
    </Page>
  );
};

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #edf2ff, #f5f7fb);
  padding: 32px 16px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: 32px;
  padding: 48px 40px;
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.12);
`;

const Heading = styled.h1`
  margin: 0;
  font-size: 1.6rem;
  color: #0f172a;
`;

const Subheading = styled.p`
  margin: 8px 0 32px;
  color: #64748b;
  font-size: 0.95rem;
`;

const Field = styled.div`
  margin-bottom: 18px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: #334155;
`;

const Input = styled.input`
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 0.95rem;
  background: #f8fafc;
  transition: border-color 0.2s, background 0.2s;
  &:focus {
    outline: none;
    border-color: #4c6ef5;
    background: #ffffff;
  }
`;

const Validation = styled.p`
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: #f97316;
`;

const SubmitButton = styled.button`
  width: 100%;
  border: none;
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(120deg, #4c6ef5, #5ed4f3);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 12px;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.4 : 1)};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
  box-shadow: 0 18px 30px rgba(76, 110, 245, 0.32);
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 28px 0;
  color: #94a3b8;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  &:before,
  &:after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e2e8f0;
    margin: 0 12px;
  }
`;

const SocialGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SocialButton = styled.button`
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  ${(props) =>
    props.$variant === "kakao"
      ? `
        background: #fee500;
        color: #3c1e1e;
      `
      : `
        background: #f1f5f9;
        color: #1f2937;
      `}
`;

const SignInText = styled.p`
  margin-top: 32px;
  color: #94a3b8;
  font-size: 0.9rem;
  text-align: center;
`;

const SignInLink = styled.button`
  border: none;
  background: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
`;

export default SignUp;
