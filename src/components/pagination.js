import React, { useState } from "react";
import styled from "styled-components";

import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

import Ingredient from "../components/list";

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
      <Section>
        <RecOne>
          <AiOutlineLeft onClick={naviMi} disabled={page === 1} />
          <My>
            {Object.values(avataArr).map((doc) => (
              <Ingredient img={doc.uri} com={doc.com} nickName={doc.nickName} />
            ))}
          </My>
          <AiOutlineRight onClick={naviPl} disabled={page === numPage} />
        </RecOne>
      </Section>
    </>
  );
};

export default Pagination;

let Section = styled.div`
  display: flex;
  align-items: center;

  //   background: #d9d9d9;
  //   border-radius: 23px;

  //   z-index: 2;
`;

let RecOne = styled.div`
  display: flex;
  align-items: center;

  //   position: absolute;
  //   width: 291px;
  //   height: 504px;
  //   left: 40px;
  //   top: 81px;

  background: #d9d9d9;
  border-radius: 23px;

  z-index: 2;
`;
let RecTwo = styled.div``;

let My = styled.div`
  width: 271px;

  padding: 15px 20px;

  display: grid;
  grid-template-rows: repeat(3, 185px);
  grid-template-columns: repeat(3, 55px);

  margin-top: 2vh;
  gap: 0px 49px;

  & > *:nth-of-type(3n + 1),
  & > *:nth-of-type(3n + 3) {
    align-self: end;
  }
`;
