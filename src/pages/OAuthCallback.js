import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthTokens } from "../api/apiClient";
import { hasGuestData } from "../utils/storage";
import { useToast } from "../context/ToastContext";
import { GuestImportPromptModal, GuestImportDoneModal } from "../components/GuestImportModals";
import { useGuestImportAfterLogin } from "../hooks/useGuestImportAfterLogin";
import "../styles/SignIn.css";

/**
 * 소셜 로그인 후 백엔드가 리다이렉트하는 페이지 (?accessToken=JWT&refreshToken=...)
 */
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [authReady, setAuthReady] = useState(false);

  const {
    guestPhase,
    guestLoading,
    importedFridges,
    openGuestPrompt,
    handleGuestMerge,
    handleGuestStartFresh,
    handleSetImportedAsMain,
    handleViewFridgeList,
    handleGuestImportLater,
  } = useGuestImportAfterLogin({ toast });

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
    setAuthReady(true);
    if (hasGuestData()) {
      openGuestPrompt();
    } else {
      toast("로그인되었습니다.");
      navigate("/refrigerator", { replace: true });
    }
  }, [searchParams, navigate, toast, openGuestPrompt]);

  if (!authReady || guestPhase === "none") {
    return (
      <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        로그인 처리 중…
      </div>
    );
  }

  return (
    <div className="signin-page">
      <GuestImportPromptModal
        open={guestPhase === "prompt"}
        loading={guestLoading}
        onMerge={handleGuestMerge}
        onStartFresh={handleGuestStartFresh}
      />
      <GuestImportDoneModal
        open={guestPhase === "done"}
        importedFridges={importedFridges}
        loading={guestLoading}
        onSetMain={handleSetImportedAsMain}
        onViewFridgeList={handleViewFridgeList}
        onLater={handleGuestImportLater}
      />
    </div>
  );
};

export default OAuthCallback;
