import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthTokens } from "../api/apiClient";
import { hasGuestData } from "../utils/storage";
import { useToast } from "../context/ToastContext";
import { GuestImportPromptModal, GuestImportDoneModal } from "../components/GuestImportModals";
import { useGuestImportAfterLogin } from "../hooks/useGuestImportAfterLogin";
import { tryHandOffOAuthToApp } from "../utils/oauthDeepLink";
import "../styles/SignIn.css";

/**
 * 소셜 로그인 후 백엔드가 리다이렉트하는 페이지 (?accessToken=JWT&refreshToken=...)
 * 앱에서 시작한 로그인이 외부 브라우저에서 끝나면 딥링크로 앱에 토큰을 넘깁니다.
 */
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [authReady, setAuthReady] = useState(false);
  const [handingOff, setHandingOff] = useState(false);

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
    // Chrome 등 외부 브라우저에서 끝난 경우 → 앱으로 복귀 시도
    if (tryHandOffOAuthToApp(searchParams)) {
      setHandingOff(true);
      return;
    }

    const accessToken = searchParams.get("accessToken") || searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const err = searchParams.get("error");
    if (err) {
      const detail = decodeURIComponent(String(err)).slice(0, 160);
      toast(`소셜 로그인에 실패했습니다. (${detail})`);
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

  if (handingOff) {
    return (
      <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        앱으로 돌아가는 중…
        <br />
        <span style={{ fontSize: "0.9rem", color: "#64748b", marginTop: 12, display: "block" }}>
          앱이 열리지 않으면 홈 화면에서 「집밥부자」를 다시 실행해 주세요.
        </span>
      </div>
    );
  }

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
