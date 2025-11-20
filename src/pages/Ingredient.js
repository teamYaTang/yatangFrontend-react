import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { AiOutlineLeft } from "react-icons/ai";

import {
  getMainFridgeApi,
  getFridgeItemsApi,
  getFreezerItemsApi,
  createFridgeItemApi,
  createFreezerItemApi,
  deleteFridgeItemApi,
  deleteFreezerItemApi,
} from "../api/refrigerator";
import { getUserProfile } from "../api/auth";
import { getUserIdFromToken } from "../utils/jwt";

const Ingredient = () => {
  const navigate = useNavigate();

  const naviRefrigerator = () => {
    navigate("/refrigerator");
  };

  const naviUndo = () => {
    navigate(-1);
  };

  const [userNickname, setUserNickname] = useState("");
  const [fridgeId, setFridgeId] = useState(null);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [freezerItems, setFreezerItems] = useState([]);
  const [activeTab, setActiveTab] = useState("fridge"); // "fridge" or "freezer"
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("개");
  const [expirationDate, setExpirationDate] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      try {
        const userId = getUserIdFromToken();
        if (!userId) {
          navigate("/");
          return;
        }

        const userProfile = await getUserProfile(userId);
        setUserNickname(userProfile.nickname || "");

        const mainFridge = await getMainFridgeApi();
        setFridgeId(mainFridge.data.id);

        const fridgeItemsData = await getFridgeItemsApi(mainFridge.data.id);
        setFridgeItems(fridgeItemsData.data || []);

        const freezerItemsData = await getFreezerItemsApi(mainFridge.data.id);
        setFreezerItems(freezerItemsData.data || []);
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName || !quantity) {
      alert("재료명과 수량을 입력해주세요.");
      return;
    }

    if (!fridgeId) {
      alert("냉장고 정보를 불러올 수 없습니다.");
      return;
    }

    try {
      const itemData = {
        name: itemName,
        quantity: parseInt(quantity),
        unit: unit,
        expirationDate: expirationDate || null,
        manufactureDate: manufactureDate || null,
        memo: memo || null,
      };

      if (activeTab === "fridge") {
        await createFridgeItemApi(fridgeId, itemData);
        const updatedItems = await getFridgeItemsApi(fridgeId);
        setFridgeItems(updatedItems.data || []);
      } else {
        await createFreezerItemApi(fridgeId, itemData);
        const updatedItems = await getFreezerItemsApi(fridgeId);
        setFreezerItems(updatedItems.data || []);
      }

      // 입력 필드 초기화
      setItemName("");
      setQuantity("");
      setUnit("개");
      setExpirationDate("");
      setManufactureDate("");
      setMemo("");
      alert("재료가 추가되었습니다.");
    } catch (error) {
      console.error("재료 추가 에러:", error);
      alert(error.message || "재료 추가에 실패했습니다.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    if (!fridgeId) return;

    try {
      if (activeTab === "fridge") {
        await deleteFridgeItemApi(fridgeId, itemId);
        const updatedItems = await getFridgeItemsApi(fridgeId);
        setFridgeItems(updatedItems.data || []);
      } else {
        await deleteFreezerItemApi(fridgeId, itemId);
        const updatedItems = await getFreezerItemsApi(fridgeId);
        setFreezerItems(updatedItems.data || []);
      }
      alert("재료가 삭제되었습니다.");
    } catch (error) {
      console.error("재료 삭제 에러:", error);
      alert(error.message || "재료 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return <LoadingText>로딩 중...</LoadingText>;
  }

  const currentItems = activeTab === "fridge" ? fridgeItems : freezerItems;

  return (
    <>
      <RefrigeratorDes>
        <AiOutlineLeft onClick={naviUndo} />
        <Title>{userNickname}의 냉장고</Title>
      </RefrigeratorDes>

      <TabContainer>
        <TabButton
          active={activeTab === "fridge"}
          onClick={() => setActiveTab("fridge")}
        >
          냉장실
        </TabButton>
        <TabButton
          active={activeTab === "freezer"}
          onClick={() => setActiveTab("freezer")}
        >
          냉동실
        </TabButton>
      </TabContainer>

      <form onSubmit={handleAddItem}>
        <Title>재료명</Title>
        <Input
          name="itemName"
          placeholder="재료명을 입력하세요"
          required
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />
        <Title>수량</Title>
        <Input
          type="number"
          name="quantity"
          placeholder="수량"
          required
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <Title>단위</Title>
        <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="개">개</option>
          <option value="팩">팩</option>
          <option value="병">병</option>
          <option value="봉지">봉지</option>
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="L">L</option>
        </Select>
        <Title>유통기한 (선택)</Title>
        <Input
          type="date"
          name="expirationDate"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
        />
        <Title>제조일자 (선택)</Title>
        <Input
          type="date"
          name="manufactureDate"
          value={manufactureDate}
          onChange={(e) => setManufactureDate(e.target.value)}
        />
        <Title>메모 (선택)</Title>
        <Input
          name="memo"
          placeholder="메모를 입력하세요"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
        <AddBtn type="submit">추가</AddBtn>
      </form>

      <List>
        <Title>현재 {activeTab === "fridge" ? "냉장실" : "냉동실"} 재료</Title>
        {currentItems.length === 0 ? (
          <EmptyText>재료가 없습니다.</EmptyText>
        ) : (
          currentItems.map((item) => (
            <ItemCard key={item.id}>
              <ItemInfo>
                <ItemName>{item.name}</ItemName>
                <ItemDetail>
                  {item.quantity} {item.unit}
                  {item.expirationDate && (
                    <> | 유통기한: {item.expirationDate}</>
                  )}
                </ItemDetail>
                {item.memo && <ItemMemo>{item.memo}</ItemMemo>}
              </ItemInfo>
              <DeleteBtn onClick={() => handleDeleteItem(item.id)}>
                삭제
              </DeleteBtn>
            </ItemCard>
          ))
        )}
      </List>

      <Blank></Blank>
      <Btn onClick={naviRefrigerator}>냉장고로 돌아가기</Btn>
    </>
  );
};

let RefrigeratorDes = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2vh;
  width: 38vh;
  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 700;
  font-size: 15px;
  line-height: 135%;
  color: #000000;
`;

let Title = styled.div`
  margin-bottom: 4px;
  padding: 0 0 0 0.5vh;
  font-family: "Noto Sans KR", sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 15px;
  line-height: 135%;
`;

let TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 2vh;
`;

let TabButton = styled.button`
  flex: 1;
  padding: 10px;
  border: none;
  background: ${(props) => (props.active ? "#b5eaff" : "#f0f0f0")};
  border-radius: 6px;
  font-family: "Noto Sans KR", sans-serif;
  font-weight: 500;
  cursor: pointer;
  color: ${(props) => (props.active ? "#000000" : "#666")};
`;

let Input = styled.input`
  padding: 12px;
  box-sizing: border-box;
  width: 342px;
  height: 50px;
  border: 1px solid #6b6b6b;
  border-radius: 6px;
  background-color: #fff062;
  font-family: "Noto Sans KR", sans-serif;
  font-size: 15px;
  margin-bottom: 10px;
  &:focus {
    border: 2px solid #b5eaff;
    outline: none;
  }
`;

let Select = styled.select`
  padding: 12px;
  box-sizing: border-box;
  width: 342px;
  height: 50px;
  border: 1px solid #6b6b6b;
  border-radius: 6px;
  background-color: #fff062;
  font-family: "Noto Sans KR", sans-serif;
  font-size: 15px;
  margin-bottom: 10px;
`;

let AddBtn = styled.button`
  margin-top: 1vh;
  width: 342px;
  height: 56px;
  border: none;
  background: #b5eaff;
  border-radius: 6px;
  font-family: "Noto Sans KR", sans-serif;
  font-weight: 500;
  font-size: 15px;
  color: #000000;
  cursor: pointer;
  &:hover {
    background: #9dd9ff;
  }
`;

let List = styled.div`
  margin-top: 2vh;
  padding: 0 2vh;
`;

let ItemCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f9f9f9;
`;

let ItemInfo = styled.div`
  flex: 1;
`;

let ItemName = styled.div`
  font-family: "Noto Sans KR", sans-serif;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 5px;
`;

let ItemDetail = styled.div`
  font-family: "Noto Sans KR", sans-serif;
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

let ItemMemo = styled.div`
  font-family: "Noto Sans KR", sans-serif;
  font-size: 12px;
  color: #999;
`;

let DeleteBtn = styled.button`
  padding: 8px 15px;
  border: none;
  background: #ff6953;
  border-radius: 6px;
  color: white;
  font-family: "Noto Sans KR", sans-serif;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    background: #e55a45;
  }
`;

let EmptyText = styled.div`
  text-align: center;
  padding: 20px;
  color: #999;
  font-family: "Noto Sans KR", sans-serif;
`;

let Blank = styled.div`
  margin: 3vh;
`;

let Btn = styled.button`
  margin-top: 1vh;
  width: 342px;
  height: 56px;
  border: none;
  background: #b5eaff;
  border-radius: 6px;
  font-family: "Noto Sans KR", sans-serif;
  font-weight: 500;
  font-size: 15px;
  color: #000000;
  cursor: pointer;
  &:hover {
    background: #9dd9ff;
  }
`;

let LoadingText = styled.div`
  text-align: center;
  padding: 50px;
  font-family: "Noto Sans KR", sans-serif;
`;

export default Ingredient;
