import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NickName.css";

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
    <div className="nickname-page">
      <div className="nickname-card">
        <h1 className="nickname-heading">나만의 냉장고 이름</h1>
        <p className="nickname-subheading">좋아하는 별명을 정해보세요. 냉장고 리스트에서 사용돼요.</p>

        <form onSubmit={handleSubmit}>
          <div className="nickname-field">
            <label className="nickname-label">닉네임</label>
            <input
              className="nickname-input"
              name="nickname"
              placeholder="2~10자 한글 또는 영문"
              value={nickname}
              onChange={handleChange}
              maxLength={10}
            />
            {!isValid && nickname && (
              <p className="nickname-validation">2~10자 이내로 입력해주세요.</p>
            )}
          </div>

          <button className="nickname-submit-button" type="submit" disabled={!isValid || loading}>
            {loading ? "저장 중..." : "닉네임 저장"}
          </button>
        </form>

        <button className="nickname-skip-button" type="button" onClick={() => navigate("/refrigerator")}>
          나중에 할래요
        </button>
      </div>
    </div>
  );
};

export default NickName;
