import React from "react";
import Router from "./shared/Router";
import styled from "styled-components";

function App() {
  return (
    <Box>
      <Router />
    </Box>
  );
}

export default App;

let Box = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  // text-align: center;
  margin: 0 auto;
  width: 390px;
  height: 100vh;
  background: #fff062;
  box-shadow: 0 0 2rem 0.1rem rgba(0, 0, 0, 0.2);
  font-family: "Noto Sans KR", sans-serif;
`;
