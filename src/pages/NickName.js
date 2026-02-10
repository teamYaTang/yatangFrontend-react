import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { updateNickname } from "../api/auth";
import { getUserIdFromToken } from "../utils/jwt";

const NickName = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setNickname(value);
    setIsValid(value.length >= 2 && value.length <= 10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || loading) return;

    const userId = getUserIdFromToken();
    if (!userId) {
      alert("로그인이 필요합니다.");
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      await updateNickname(userId, nickname);
      alert("닉네임이 저장되었습니다!");
      navigate("/refrigerator");
    } catch (error) {
      alert(error.message || "닉네임을 저장하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <Page>
      <Card>
        <Heading>나만의 냉장고 이름</Heading>
        <Subheading>좋아하는 별명을 정해보세요. 냉장고 리스트에서 사용돼요.</Subheading>

        <form onSubmit={handleSubmit}>
          <Field>
            <Label>닉네임</Label>
            <Input
              name="nickname"
              placeholder="2~10자 한글 또는 영문"
              value={nickname}
              onChange={handleChange}
          maxLength={10}
            />
            {!isValid && nickname && (
              <Validation>2~10자 이내로 입력해주세요.</Validation>
            )}
          </Field>

          <SubmitButton type="submit" disabled={!isValid || loading}>
            {loading ? "저장 중..." : "닉네임 저장"}
          </SubmitButton>
      </form>

        <SkipButton type="button" onClick={() => navigate("/refrigerator")}>
          나중에 할래요
        </SkipButton>
      </Card>
    </Page>
  );
};

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4ff, #f7fbff);
  padding: 32px 16px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 28px;
  padding: 40px 36px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.12);
`;

const Heading = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #0f172a;
`;

const Subheading = styled.p`
  margin: 8px 0 28px;
  color: #64748b;
  font-size: 0.95rem;
`;

const Field = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
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
  border-radius: 14px;
  padding: 14px;
  background: linear-gradient(120deg, #4c6ef5, #5ed4f3);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.4 : 1)};
  pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
  box-shadow: 0 15px 28px rgba(76, 110, 245, 0.3);
`;

const SkipButton = styled.button`
  width: 100%;
  margin-top: 18px;
  border: none;
  border-radius: 14px;
  padding: 14px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
`;

export default NickName;
