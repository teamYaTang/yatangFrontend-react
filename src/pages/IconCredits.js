import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import "../styles/Legal.css";

/** 공개 URL: https://jibbabbuja.duckdns.org/credits */
const IconCredits = () => {
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
        <h1 className="legal-title">아이콘 출처</h1>
      </header>

      <article className="legal-body">
        <p className="legal-lead">
          집밥부자의 재료 아이콘은 Flaticon에서 제공하는 아이콘을 사용했습니다. 서비스에 맞게 크기와
          형식을 조정했습니다.
        </p>
        <p>
          Icons made by{" "}
          <a href="https://www.flaticon.com" target="_blank" rel="noopener noreferrer">
            Flaticon
          </a>
        </p>
        <p className="legal-meta">
          <a href="https://www.flaticon.com" target="_blank" rel="noopener noreferrer">
            https://www.flaticon.com
          </a>
        </p>

        <p className="legal-footer-note">
          관련 문서: <Link to="/privacy">개인정보 처리방침</Link>
          {" · "}
          <Link to="/terms">이용약관</Link>
        </p>
      </article>
    </div>
  );
};

export default IconCredits;
