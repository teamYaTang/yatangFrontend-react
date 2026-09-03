import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import "../styles/Legal.css";

/** 스토어·OAuth 콘솔에 등록할 공개 URL: https://jibbabbuja.duckdns.org/privacy */
const EFFECTIVE_DATE = "2026년 8월 17일";
const SERVICE_NAME = "집밥부자";
const SERVICE_URL = "https://jibbabbuja.duckdns.org";

const PrivacyPolicy = () => {
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
        <h1 className="legal-title">개인정보 처리방침</h1>
      </header>

      <article className="legal-body">
        <p className="legal-lead">
          {SERVICE_NAME}(이하 &quot;서비스&quot;)는 「개인정보 보호법」 등 관련 법령에 따라 이용자의 개인정보를
          보호하고, 이와 관련한 고충을 신속하게 처리하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </p>
        <p className="legal-meta">시행일: {EFFECTIVE_DATE}</p>
        <p className="legal-meta">
          서비스 주소:{" "}
          <a href={SERVICE_URL} target="_blank" rel="noopener noreferrer">
            {SERVICE_URL}
          </a>
        </p>

        <h2>1. 수집하는 개인정보 항목</h2>
        <p>서비스는 회원가입·로그인 및 기능 제공을 위해 아래 정보를 처리할 수 있습니다.</p>
        <ul>
          <li>
            <strong>회원 가입(아이디/비밀번호)</strong>: 아이디, 비밀번호(암호화 저장), 이메일, 닉네임
          </li>
          <li>
            <strong>소셜 로그인(Google / 카카오)</strong>: 해당 서비스가 제공하는 식별자, 이메일(제공 시),
            닉네임/프로필명 등 동의 범위 내 정보
          </li>
          <li>
            <strong>서비스 이용 정보</strong>: 냉장고·보관 위치(냉장/냉동/상온), 재료명·수량·단위·등록일,
            직접 추가한 재료 목록, 이용자가 업로드한 재료 사진, 장바구니(쇼핑 목록), 저장된 레시피(레시피북)
            등 서비스에 입력·생성한 데이터
          </li>
          <li>
            <strong>AI 메뉴 추천 이용 시</strong>: 추천 요청에 필요한 재료·선호 관련 입력 내용(처리 과정에서
            외부 AI 제공업체에 전달될 수 있음 — 아래 제3자 제공 참고)
          </li>
          <li>
            <strong>비회원(게스트) 이용</strong>: 기기에 저장되는 로컬 데이터(냉장고·재료 등). 서버 계정과
            연결되지 않으며, 앱 삭제·데이터 초기화 시 함께 삭제될 수 있습니다.
          </li>
          <li>
            <strong>자동 수집</strong>: 로그인 세션·인증 토큰, 접속 로그(일시, 오류 기록 등 서비스 안정성
            확보에 필요한 최소 정보)
          </li>
        </ul>

        <h2>2. 개인정보의 수집·이용 목적</h2>
        <ul>
          <li>회원 식별, 로그인·본인 확인, 계정 관리</li>
          <li>냉장고·재료·장바구니·레시피 등 서비스 기능 제공</li>
          <li>AI 기반 메뉴·레시피 추천 기능 제공</li>
          <li>고객 문의 대응, 부정 이용 방지, 서비스 개선</li>
          <li>관련 법령상 의무 이행</li>
        </ul>

        <h2>3. 개인정보의 보유 및 이용 기간</h2>
        <p>
          원칙적으로 개인정보 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 다만 회원
          탈퇴 시까지 서비스 제공을 위해 보관하며, 관련 법령에 따라 일정 기간 보관이 필요한 경우 그 기간
          동안 보관할 수 있습니다.
        </p>
        <ul>
          <li>회원 계정 및 서비스 데이터: 회원 탈퇴 시까지 (탈퇴 시 지체 없이 삭제)</li>
          <li>이용자가 업로드한 재료 사진: 해당 재료/계정 삭제 또는 회원 탈퇴 시 삭제</li>
          <li>비회원 로컬 데이터: 이용자 기기에서 관리·삭제</li>
        </ul>

        <h2>4. 개인정보의 제3자 제공 및 처리 위탁</h2>
        <p>
          서비스는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만 다음의 경우 서비스 제공에
          필요한 범위에서 처리될 수 있습니다.
        </p>
        <ul>
          <li>
            <strong>Google / 카카오</strong>: 소셜 로그인 인증(해당 사업자의 약관·개인정보 처리방침 적용)
          </li>
          <li>
            <strong>AI 레시피 기능</strong>: 추천 생성에 필요한 입력 내용이 OpenAI 등 AI API 제공업체로
            전송될 수 있습니다. 이 경우 해당 업체의 정책이 적용됩니다.
          </li>
          <li>
            <strong>클라우드 호스팅</strong>: 서비스 운영을 위한 서버·저장소 인프라(접속·저장 처리)
          </li>
        </ul>
        <p>
          법령에 근거한 요청이 있는 경우 등 관련 법률에 따라 제공이 요구되는 경우에는 예외로 합니다.
        </p>

        <h2>5. 개인정보의 파기 절차 및 방법</h2>
        <p>
          보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일 형태는
          복구 불가능한 방법으로 삭제하고, 출력물은 분쇄 또는 소각합니다.
        </p>

        <h2>6. 이용자의 권리</h2>
        <ul>
          <li>개인정보 열람·정정·삭제·처리 정지를 요청할 수 있습니다.</li>
          <li>설정 화면에서 닉네임 등 일부 정보를 직접 수정할 수 있습니다.</li>
          <li>회원 탈퇴를 통해 계정 및 관련 서비스 데이터 삭제를 요청할 수 있습니다.</li>
          <li>소셜 로그인 계정의 연동 정보는 해당 서비스(Google, 카카오)에서도 관리할 수 있습니다.</li>
        </ul>

        <h2>7. 개인정보의 안전성 확보 조치</h2>
        <ul>
          <li>비밀번호 등 중요 정보의 암호화 저장</li>
          <li>HTTPS를 통한 전송 구간 보호</li>
          <li>접근 권한 관리 및 인증 토큰·세션 관리</li>
        </ul>

        <h2>8. 아동의 개인정보</h2>
        <p>
          서비스는 원칙적으로 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 만 14세 미만이 서비스를
          이용하려는 경우 법정대리인의 동의가 필요할 수 있습니다.
        </p>

        <h2>9. 개인정보 보호책임자 및 문의</h2>
        <p>
          개인정보 처리에 관한 문의, 열람·삭제 요청, 불만 처리는 아래 방법으로 접수할 수 있습니다.
        </p>
        <ul>
          <li>서비스명: {SERVICE_NAME}</li>
          <li>웹/앱: {SERVICE_URL}</li>
          <li>
            문의 이메일:{" "}
            <a href="mailto:kangminju333@gmail.com">kangminju333@gmail.com</a>
          </li>
        </ul>

        <h2>10. 개인정보 처리방침의 변경</h2>
        <p>
          본 방침이 변경되는 경우 서비스 내 공지 또는 본 페이지를 통해 고지합니다. 변경된 방침은 게시한
          시행일부터 효력이 발생합니다.
        </p>

        <p className="legal-footer-note">
          관련 문서: <Link to="/terms">이용약관</Link>
        </p>
      </article>
    </div>
  );
};

export default PrivacyPolicy;
