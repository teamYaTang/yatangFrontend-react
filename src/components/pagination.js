import React, { useState } from "react";
import "../styles/Pagination.css";

import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

import Ingredient from "../components/list";

// 냉장고 화면에서 냉장고 pagination => 이 안에 list로 돌아감..
const Pagination = ({ avata, myAvata, isLoggedIn }) => {
  const newAvata = {
    ...avata,
  };
  const newMyAvata = {
    ...myAvata,
  };

  const [limit, setLimit] = useState(8);
  const [page, setPage] = useState(1);

  const total = Object.keys(newAvata).length;
  const numPage = Math.ceil(total / limit);
  // const startIndex = (page - 1) * limit; // Unused variable
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const avataArr = Object.values(newAvata).slice(startIndex, endIndex);

  const naviMi = () => {
    setPage(Math.max(page - 1, 1));
  };

  const naviPl = () => {
    setPage(Math.min(page + 1, numPage));
  };

  return (
    <>
      <div className="pagination-section">
        <div className="pagination-recone">
          <AiOutlineLeft onClick={naviMi} disabled={page === 1} />
          <div className="pagination-my">
            {Object.values(avataArr).map((doc) => (
              <Ingredient img={doc.uri} com={doc.com} nickName={doc.nickName} />
            ))}
          </div>
          <AiOutlineRight onClick={naviPl} disabled={page === numPage} />
        </div>
      </div>
    </>
  );
};

export default Pagination;
