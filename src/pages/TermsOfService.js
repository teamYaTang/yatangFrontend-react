import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import "../styles/Legal.css";

const EFFECTIVE_DATE = "2026년 8월 17일";
const SERVICE_NAME = "집밥부자";
const SERVICE_URL = "https://jibbabbuja.duckdns.org";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <header className="legal-header">
        <button
          type="button"
          className="legal-back"
          aria-label="뒤로"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/signin"))}
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="legal-title">이용약관</h1>
      </header>

      <article className="legal-body">
        <p className="legal-lead">
          본 약관은 {SERVICE_NAME}(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 이용자와 운영자 간의 권리·의무를
          규정합니다.
        </p>
        <p className="legal-meta">시행일: {EFFECTIVE_DATE}</p>
        <p className="legal-meta">
          서비스 주소:{" "}
          <a href={SERVICE_URL} target="_blank" rel="noopener noreferrer">
            {SERVICE_URL}
          </a>
        </p>

        <h2>1. 목적</h2>
        <p>
          본 약관은 서비스가 제공하는 냉장고·재료 관리, 장바구니, AI 메뉴 추천 등 기능의 이용과 관련하여
          필요한 사항을 정합니다.
        </p>

        <h2>2. 정의</h2>
        <ul>
          <li>&quot;이용자&quot;란 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
          <li>&quot;회원&quot;이란 계정(아이디 또는 소셜 로그인)을 통해 서비스를 이용하는 자를 말합니다.</li>
          <li>&quot;비회원&quot;이란 회원가입 없이 기기 내 저장 방식으로 일부 기능을 이용하는 자를 말합니다.</li>
        </ul>

        <h2>3. 약관의 효력 및 변경</h2>
        <p>
          본 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다. 필요한 경우
          약관을 변경할 수 있으며, 변경 시 서비스 내에 공지합니다.
        </p>

        <h2>4. 서비스의 제공</h2>
        <ul>
          <li>냉장고 및 재료 등록·관리</li>
          <li>장바구니(쇼핑 목록) 관리</li>
          <li>AI 기반 메뉴·레시피 추천 및 레시피북 저장</li>
          <li>기타 서비스가 정하는 부가 기능</li>
        </ul>
        <p>
          서비스 내용은 운영상·기술상 필요에 따라 변경·중단될 수 있으며, 중요한 변경은 합리적인 방법으로
          안내합니다.
        </p>

        <h2>5. 회원가입 및 계정</h2>
        <ul>
          <li>이용자는 정확한 정보를 제공해야 하며, 계정 관리 책임은 이용자에게 있습니다.</li>
          <li>소셜 로그인 이용 시 해당 제공자의 정책이 추가로 적용됩니다.</li>
          <li>비회원 데이터는 기기 로컬에 저장되며, 기기 변경·앱 삭제 시 복구되지 않을 수 있습니다.</li>
        </ul>

        <h2>6. 이용자의 의무</h2>
        <ul>
          <li>법령 또는 본 약관에 위배되는 행위 금지</li>
          <li>타인의 계정·개인정보 도용, 서비스 장애를 유발하는 행위 금지</li>
          <li>AI 추천 결과·외부 구매 링크 등의 이용에 대한 최종 판단과 책임은 이용자에게 있음</li>
        </ul>

        <h2>7. AI 기능 및 외부 링크</h2>
        <p>
          AI가 생성하는 레시피·안내 정보는 참고용이며, 알레르기·영양·조리 안전 등에 대한 전문적 조언을
          대체하지 않습니다. 쿠팡 등 외부 사이트로의 이동·구매는 해당 서비스 정책이 적용됩니다.
        </p>

        <h2>8. 지적재산권</h2>
        <p>
          서비스 UI, 로고, 콘텐츠 등에 대한 권리는 운영자 또는 정당한 권리자에게 귀속됩니다. 이용자가
          업로드한 재료 사진 등에 대한 권리는 이용자에게 있으며, 서비스는 기능 제공 범위 내에서만
          이용합니다.
        </p>

        <h2>9. 면책</h2>
        <p>
          천재지변, 불가항력, 이용자 귀책, 외부 서비스(소셜 로그인·AI API·오픈마켓 등) 장애로 인한
          손해에 대해서는 관련 법령이 허용하는 범위에서 책임을 제한할 수 있습니다.
        </p>

        <h2>10. 계약 해지(탈퇴)</h2>
        <p>
          회원은 앱 설정 등에서 제공하는 회원 탈퇴 기능을 통해 이용 계약을 해지할 수 있으며, 탈퇴 시
          관련 데이터는 개인정보 처리방침에 따라 처리됩니다.
        </p>

        <h2>11. 준거법</h2>
        <p>본 약관은 대한민국 법령에 따릅니다.</p>

        <p className="legal-footer-note">
          관련 문서: <Link to="/privacy">개인정보 처리방침</Link>
        </p>
      </article>
    </div>
  );
};

export default TermsOfService;
