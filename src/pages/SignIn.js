import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import LogoImg from "../assets/LogoImg.png";
import { signin } from "../api/auth";
import apiClient from "../api/apiClient";

const SignIn = () => {
  const navigate = useNavigate();

  const [userid, setUserid] = useState("");
  const [userpw, setUserpw] = useState("");
  const [isId, setIsId] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [isResult, setIsResult] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!isResult) return;

    signin({ username: userid, password: userpw })
      .then(() => {
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

  const handleInputChange = (e) => {
    const {
      target: { name, value },
    } = e;

    if (name === "id") {
      setUserid(value);
      setIsId(value.length >= 6 && value.length <= 10);
    } else if (name === "password") {
      setUserpw(value);
      setIsPassword(value.length >= 8 && value.length <= 15);
    }

    const nextId = name === "id" ? value : userid;
    const nextPw = name === "password" ? value : userpw;
    const validId = nextId.length >= 6 && nextId.length <= 10;
    const validPw = nextPw.length >= 8 && nextPw.length <= 15;
    setIsResult(validId && validPw);
  };

  const handleSocialLogin = async (provider) => {
    try {
      const { data } = await apiClient.get(`/oauth2/authorization/${provider}`);
      alert(data.message || `${provider} 로그인 준비 중입니다.`);
    } catch (error) {
      console.error("소셜 로그인 에러:", error);
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
        <LogoWrapper>
          <Logo src={LogoImg} alt="Yatang 로고" />
        </LogoWrapper>
        <Heading>어서오세요!</Heading>
        <Subheading>오늘도 냉장고 속 재료를 똑똑하게 관리해봐요.</Subheading>

        <form onSubmit={onSubmit}>
          <Field>
            <Label>아이디</Label>
            <Input
          name="id"
              placeholder="아이디를 입력하세요"
          value={userid}
              onChange={handleInputChange}
            />
            {!isId && userid && (
              <Validation>6~10자의 영문/숫자 조합으로 입력해주세요.</Validation>
        )}
          </Field>

          <Field>
            <Label>비밀번호</Label>
            <Input
              type="password"
          name="password"
              placeholder="비밀번호를 입력하세요"
          value={userpw}
              onChange={handleInputChange}
            />
            {!isPassword && userpw && (
              <Validation>8~15자의 비밀번호를 입력해주세요.</Validation>
        )}
          </Field>

          <SubmitButton type="submit" disabled={!isResult}>
            로그인
          </SubmitButton>
      </form>

        <Divider>
          <span>또는</span>
        </Divider>

        <SocialGroup>
          <SocialButton
            type="button"
            $variant="kakao"
            onClick={() => handleSocialLogin("kakao")}
          >
            카카오 간편 로그인
          </SocialButton>
          <SocialButton
            type="button"
            $variant="google"
            onClick={() => handleSocialLogin("google")}
          >
            Google 로그인
          </SocialButton>
        </SocialGroup>

        <SignUpText>
          아직 계정이 없으신가요?{" "}
          <SignUpLink type="button" onClick={naviSignUp}>
            회원가입
          </SignUpLink>
        </SignUpText>
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
  max-width: 420px;
  background: #ffffff;
  border-radius: 32px;
  padding: 48px 40px;
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.12);
  text-align: center;
`;

const LogoWrapper = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 28px;
  margin: 0 auto 24px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Logo = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
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
  text-align: left;
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

const SignUpText = styled.p`
  margin-top: 32px;
  color: #94a3b8;
  font-size: 0.9rem;
`;

const SignUpLink = styled.button`
  border: none;
  background: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
`;

export default SignIn;
