import React from "react";
import "../styles/SignIn.css";

function ModalOverlay({ children, ...props }) {
  return (
    <div className="signin-modal-overlay" {...props}>
      {children}
    </div>
  );
}

/** 로그인 직후: 비회원 냉장고 가져오기 여부 */
export function GuestImportPromptModal({ open, loading, onMerge, onStartFresh }) {
  if (!open) return null;

  return (
    <ModalOverlay role="dialog" aria-modal="true">
      <div className="signin-modal">
        <div className="signin-modal-title">비회원 냉장고를 새 냉장고로 가져올까요?</div>
        <div className="signin-modal-body">
          이 기기에 저장된 비회원 냉장고·재료를 로그인 계정에 새 냉장고로 추가할 수 있어요.
        </div>
        <div className="signin-modal-actions">
          <button
            className="signin-modal-button signin-modal-button-primary"
            type="button"
            onClick={onMerge}
            disabled={loading}
          >
            가져오기
          </button>
          <button
            className="signin-modal-button"
            type="button"
            onClick={onStartFresh}
            disabled={loading}
          >
            새로 시작하기
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/** 가져오기 완료 후 안내 */
export function GuestImportDoneModal({
  open,
  importedFridges = [],
  loading,
  onSetMain,
  onViewFridgeList,
  onLater,
}) {
  if (!open) return null;

  const hasImportedFridge = importedFridges.length > 0;
  const fridgeLabel =
    importedFridges.length === 1
      ? `'${importedFridges[0].name || "가져온 냉장고"}'`
      : `냉장고 ${importedFridges.length}개`;

  return (
    <ModalOverlay role="dialog" aria-modal="true">
      <div className="signin-modal signin-modal--done">
        <div className="signin-modal-done-icon" aria-hidden>
          💡
        </div>
        <div className="signin-modal-title">비회원 냉장고를 가져왔어요!</div>
        <div className="signin-modal-body">
          {hasImportedFridge ? (
            <>
              냉장고 목록에 {fridgeLabel}가 추가됐어요.
              <br />
              메인 냉장고로 설정하거나 재료를 옮길 수 있어요.
            </>
          ) : (
            <>상온보관 재료 등이 계정에 반영됐어요. 냉장고 목록에서 확인할 수 있어요.</>
          )}
        </div>
        <div className="signin-modal-actions signin-modal-actions--stack">
          {hasImportedFridge && (
            <button
              className="signin-modal-button signin-modal-button-primary signin-modal-button-block"
              type="button"
              onClick={onSetMain}
              disabled={loading}
            >
              메인 냉장고로 설정
            </button>
          )}
          <button
            className="signin-modal-button signin-modal-button-block"
            type="button"
            onClick={onViewFridgeList}
            disabled={loading}
          >
            냉장고 목록 보기
          </button>
          <button
            className="signin-modal-button signin-modal-button-muted signin-modal-button-block"
            type="button"
            onClick={onLater}
            disabled={loading}
          >
            나중에
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
