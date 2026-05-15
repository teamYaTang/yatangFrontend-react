import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthTokens } from "../api/apiClient";
import { hasGuestData, getAllGuestData, clearAllGuestData } from "../utils/storage";
import { importGuestDataApi } from "../api/refrigerator";
import { useToast } from "../context/ToastContext";
import "../styles/SignIn.css";

/**
 * 소셜 로그인 후 백엔드가 리다이렉트하는 페이지 (?accessToken=JWT&refreshToken=...)
 */
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState("loading");
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken") || searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const err = searchParams.get("error");
    if (err) {
      toast("소셜 로그인에 실패했습니다.");
      navigate("/signin", { replace: true });
      return;
    }
    if (!accessToken) {
      toast("로그인 정보가 없습니다.");
      navigate("/signin", { replace: true });
      return;
    }
    setAuthTokens({ accessToken, refreshToken });
    if (hasGuestData()) {
      setMode("guest");
    } else {
      toast("로그인되었습니다.");
      navigate("/refrigerator", { replace: true });
    }
  }, [searchParams, navigate, toast]);

  const handleGuestMerge = async () => {
    setGuestLoading(true);
    try {
      const guestData = getAllGuestData();
      await importGuestDataApi(guestData);
      clearAllGuestData();
      toast("기존 기록을 내 계정에 합쳤습니다.");
      navigate("/refrigerator", { replace: true });
    } catch (error) {
      console.error(error);
      toast(error.message || "기록 병합에 실패했습니다.");
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGuestFresh = () => {
    if (
      !window.confirm(
        "비로그인 상태로 저장한 냉장고·상온보관·재료 기록이 이 기기에서 모두 삭제됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    clearAllGuestData();
    toast("게스트 기록을 삭제했습니다.");
    navigate("/refrigerator", { replace: true });
  };

  if (mode === "loading") {
    return (
      <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        로그인 처리 중…
      </div>
    );
  }

  if (mode !== "guest") {
    return null;
  }

  return (
    <div className="signin-page">
      <div className="signin-card" style={{ maxWidth: 440 }}>
        <div className="signin-modal-title" style={{ marginBottom: 12 }}>
          기존 기록이 있습니다
        </div>
        <p className="signin-modal-body" style={{ marginBottom: 20 }}>
          비로그인 상태로 작성한 기록이 남아있습니다. 계정에 합칠지, 새로 시작할지 선택해주세요.
        </p>
        <div className="signin-modal-actions">
          <button
            className="signin-modal-button signin-modal-button-primary"
            type="button"
            onClick={handleGuestMerge}
            disabled={guestLoading}
          >
            내 기록에 합치기
          </button>
          <button
            className="signin-modal-button"
            type="button"
            onClick={handleGuestFresh}
            disabled={guestLoading}
          >
            새로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
