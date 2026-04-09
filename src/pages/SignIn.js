import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignIn.css";

import LogoImg from "../assets/LogoImg.png";
import { signin } from "../api/auth";
import { hasGuestData, getAllGuestData, clearAllGuestData } from "../utils/storage";
import { importGuestDataApi } from "../api/refrigerator";
import { useToast } from "../context/ToastContext";

const SignIn = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [userid, setUserid] = useState("");
  const [userpw, setUserpw] = useState("");

  const [isId, setIsId] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [isResult, setIsResult] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestPromptLoading, setGuestPromptLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;

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
    const validPassword = nextPw.length >= 8 && nextPw.length <= 15;

    setIsResult(validId && validPassword);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!isResult) return;

    signin({ username: userid, password: userpw })
      .then((data) => {
        if (hasGuestData()) {
          setShowGuestPrompt(true);
          return;
        }
        toast("로그인되었습니다.");
        navigate("/refrigerator");
      })
      .catch((error) => {
        console.error("로그인 에러:", error);
        toast(error.message || "로그인에 실패했습니다.");
      });
  };

  const handleGuestMerge = async () => {
    setGuestPromptLoading(true);
    try {
      const guestData = getAllGuestData();
      await importGuestDataApi(guestData);
      clearAllGuestData();
      toast("기존 기록을 내 계정에 합쳤습니다.");
      setShowGuestPrompt(false);
      navigate("/refrigerator");
    } catch (error) {
      console.error("게스트 기록 병합 실패:", error);
      toast(error.message || "기록 병합에 실패했습니다.");
    } finally {
      setGuestPromptLoading(false);
    }
  };

  const handleGuestStartFresh = () => {
    if (
      !window.confirm(
        "비로그인 상태로 저장한 냉장고·상온보관·재료 기록이 이 기기에서 모두 삭제됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    clearAllGuestData();
    toast("게스트 기록을 삭제했습니다.");
    setShowGuestPrompt(false);
    navigate("/refrigerator");
  };

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      navigate("/refrigerator");
    }
  }, [navigate]);

  return (
    <div className="signin-page">
      <div className="signin-card">
        <img src={LogoImg} className="signin-logo" alt="logo" />

        <form className="signin-form" onSubmit={onSubmit}>
          <div className="signin-field">
            <label className="signin-label">아이디</label>
            <input
              className="signin-input"
              name="id"
              placeholder="아이디"
              required
              minLength={6}
              maxLength={10}
              value={userid}
              onChange={onChange}
            />
            {!isId && userid && (
              <p className="signin-validation-msg">6자 이상 10자 이하 영문, 숫자조합의 아이디를 입력해주세요.</p>
            )}
          </div>

          <div className="signin-field">
            <label className="signin-label">비밀번호</label>
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
            />
            {!isPassword && userpw && (
              <p className="signin-validation-msg">8자 이상 15자 이하의 비밀번호를 입력해주세요.</p>
            )}
          </div>

          <button
            className="signin-submit-button"
            data-testid="signin-button"
            type="submit"
            disabled={!isResult}
          >
            로그인
          </button>
        </form>

        <div className="signin-divider">
          <span>또는</span>
        </div>

        <p className="signin-signup-text">
          아직 계정이 없으신가요?{" "}
          <button className="signin-signup-link" type="button" onClick={() => navigate("/signup")}>
            회원가입
          </button>
        </p>
      </div>

      {showGuestPrompt && (
        <div className="signin-modal-overlay" role="dialog" aria-modal="true">
          <div className="signin-modal">
            <div className="signin-modal-title">기존 기록이 있습니다. 어떻게 할까요?</div>
            <div className="signin-modal-body">
              비로그인 상태로 작성한 기록이 남아있습니다. 로그인 계정에 합칠지, 새로 시작할지 선택해주세요.
            </div>
            <div className="signin-modal-actions">
              <button
                className="signin-modal-button signin-modal-button-primary"
                type="button"
                onClick={handleGuestMerge}
                disabled={guestPromptLoading}
              >
                내 기록에 합치기
              </button>
              <button
                className="signin-modal-button"
                type="button"
                onClick={handleGuestStartFresh}
                disabled={guestPromptLoading}
              >
                새로 시작하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
