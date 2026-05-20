import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { importGuestDataApi, updateFridgeApi } from "../api/refrigerator";
import { getAllGuestData, clearAllGuestData } from "../utils/storage";

/**
 * 로그인·OAuth 직후 비회원 데이터 가져오기 플로우
 * @param {{ toast: (msg: string) => void }} options
 */
export function useGuestImportAfterLogin({ toast }) {
  const navigate = useNavigate();
  const [guestPhase, setGuestPhase] = useState("none"); // none | prompt | done
  const [guestLoading, setGuestLoading] = useState(false);
  const [importedFridges, setImportedFridges] = useState([]);

  const openGuestPrompt = useCallback(() => {
    setGuestPhase("prompt");
  }, []);

  const handleGuestMerge = useCallback(async () => {
    setGuestLoading(true);
    try {
      const guestData = getAllGuestData();
      const result = await importGuestDataApi(guestData);
      clearAllGuestData();
      setImportedFridges(Array.isArray(result?.importedFridges) ? result.importedFridges : []);
      setGuestPhase("done");
    } catch (error) {
      console.error("게스트 기록 병합 실패:", error);
      toast(error.message || "기록 병합에 실패했습니다.");
    } finally {
      setGuestLoading(false);
    }
  }, [toast]);

  const handleGuestStartFresh = useCallback(() => {
    if (
      !window.confirm(
        "비로그인 상태로 저장한 냉장고·상온보관·재료 기록이 이 기기에서 모두 삭제됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    clearAllGuestData();
    toast("게스트 기록을 삭제했습니다.");
    setGuestPhase("none");
    navigate("/refrigerator");
  }, [navigate, toast]);

  const handleSetImportedAsMain = useCallback(async () => {
    const fridgeId = importedFridges[0]?.id;
    if (!fridgeId) {
      navigate("/refrigerator");
      return;
    }
    setGuestLoading(true);
    try {
      await updateFridgeApi(fridgeId, { isMain: true });
      toast("메인 냉장고로 설정했습니다.");
      setGuestPhase("none");
      navigate("/refrigerator");
    } catch (error) {
      console.error(error);
      toast(error.message || "메인 냉장고 설정에 실패했습니다.");
    } finally {
      setGuestLoading(false);
    }
  }, [importedFridges, navigate, toast]);

  const handleViewFridgeList = useCallback(() => {
    setGuestPhase("none");
    navigate("/settings", { state: { settingsTab: "fridge" } });
  }, [navigate]);

  const handleGuestImportLater = useCallback(() => {
    setGuestPhase("none");
    navigate("/refrigerator");
  }, [navigate]);

  const closeGuestFlow = useCallback(() => {
    setGuestPhase("none");
    setImportedFridges([]);
  }, []);

  return {
    guestPhase,
    guestLoading,
    importedFridges,
    openGuestPrompt,
    closeGuestFlow,
    handleGuestMerge,
    handleGuestStartFresh,
    handleSetImportedAsMain,
    handleViewFridgeList,
    handleGuestImportLater,
  };
}
