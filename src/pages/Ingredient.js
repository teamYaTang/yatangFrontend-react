import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiArrowLeft } from "react-icons/fi";

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
  const [userNickname, setUserNickname] = useState("");
  const [fridgeId, setFridgeId] = useState(null);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [freezerItems, setFreezerItems] = useState([]);
  const [activeTab, setActiveTab] = useState("fridge");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("개");
  const [expirationDate, setExpirationDate] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(true);

  const loadItems = async (targetFridgeId) => {
    const [fridgeData, freezerData] = await Promise.all([
      getFridgeItemsApi(targetFridgeId),
      getFreezerItemsApi(targetFridgeId),
    ]);
    setFridgeItems(fridgeData ?? []);
    setFreezerItems(freezerData ?? []);
  };

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const userId = getUserIdFromToken();
        if (!userId) {
          navigate("/");
          return;
        }

        const profile = await getUserProfile(userId);
        setUserNickname(profile.nickname || profile.username || "");

        const fridge = await getMainFridgeApi();
        setFridgeId(fridge.id);
        await loadItems(fridge.id);
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName || !quantity) {
      alert("재료명과 수량을 입력해주세요.");
      return;
    }
    if (!fridgeId) return;

    const payload = {
      name: itemName,
      quantity: parseInt(quantity, 10),
      unit,
      expirationDate: expirationDate || null,
      manufactureDate: manufactureDate || null,
      memo: memo || null,
    };

    try {
      if (activeTab === "fridge") {
        await createFridgeItemApi(fridgeId, payload);
      } else {
        await createFreezerItemApi(fridgeId, payload);
      }
      await loadItems(fridgeId);
      setItemName("");
      setQuantity("");
      setUnit("개");
      setExpirationDate("");
      setManufactureDate("");
      setMemo("");
    } catch (error) {
      console.error("재료 추가 에러:", error);
      alert(error.message || "재료 추가에 실패했습니다.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!fridgeId) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }
    try {
      if (activeTab === "fridge") {
        await deleteFridgeItemApi(fridgeId, itemId);
      } else {
        await deleteFreezerItemApi(fridgeId, itemId);
      }
      await loadItems(fridgeId);
    } catch (error) {
      console.error("재료 삭제 에러:", error);
      alert(error.message || "재료 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return <Loading>재료 정보를 불러오는 중입니다...</Loading>;
  }

  const currentItems = activeTab === "fridge" ? fridgeItems : freezerItems;

  return (
    <PageWrapper>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <FiArrowLeft size={18} />
          뒤로가기
        </BackButton>
        <HeaderText>
          <Title>{userNickname}의 재료 관리</Title>
          <Subtitle>
            {activeTab === "fridge" ? "냉장실" : "냉동실"} 재료를 추가/수정하세요.
          </Subtitle>
        </HeaderText>
      </Header>

      <TabBar>
        <TabButton
          type="button"
          $active={activeTab === "fridge"}
          onClick={() => setActiveTab("fridge")}
        >
          냉장실
        </TabButton>
        <TabButton
          type="button"
          $active={activeTab === "freezer"}
          onClick={() => setActiveTab("freezer")}
        >
          냉동실
        </TabButton>
      </TabBar>

      <CardsGrid>
        <FormCard onSubmit={handleAddItem}>
          <CardTitle>재료 추가</CardTitle>
          <InputGroup>
            <label>재료명</label>
            <Input
              placeholder="예: 우유"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </InputGroup>
          <InputRow>
            <InputGroup>
              <label>수량</label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <label>단위</label>
              <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                {["개", "팩", "병", "봉지", "g", "kg", "ml", "L"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </InputGroup>
          </InputRow>
          <InputRow>
            <InputGroup>
              <label>유통기한</label>
              <Input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <label>제조일자</label>
              <Input
                type="date"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
              />
            </InputGroup>
          </InputRow>
          <InputGroup>
            <label>메모</label>
            <Input
              placeholder="보관 위치, 특이 사항 등을 기록하세요."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </InputGroup>
          <SubmitButton type="submit">
            <FiPlus /> 재료 추가
          </SubmitButton>
        </FormCard>

        <ListCard>
          <ListHeader>
            <CardTitle>
              현재 {activeTab === "fridge" ? "냉장실" : "냉동실"} 재료
            </CardTitle>
            <Chip>{currentItems.length}개</Chip>
          </ListHeader>
          {currentItems.length === 0 ? (
            <EmptyState>아직 등록된 재료가 없습니다.</EmptyState>
          ) : (
            <ItemList>
              {currentItems.map((item) => (
                <Item key={item.id}>
                  <ItemInfo>
                    <ItemName>{item.name}</ItemName>
                    <ItemMeta>
                      {item.quantity} {item.unit}
                      {item.expirationDate && (
                        <>
                          {" "}
                          · 유통기한 {item.expirationDate}
                          {item.daysUntilExpiration != null &&
                            ` (D${item.daysUntilExpiration >= 0 ? "-" : "+"}${Math.abs(
                              item.daysUntilExpiration,
                            )})`}
                        </>
                      )}
                    </ItemMeta>
                    {item.memo && <ItemMemo>{item.memo}</ItemMemo>}
                  </ItemInfo>
                  <DeleteButton onClick={() => handleDeleteItem(item.id)}>
                    <FiTrash2 size={16} />
                  </DeleteButton>
                </Item>
              ))}
            </ItemList>
          )}
        </ListCard>
      </CardsGrid>

      <FooterActions>
        <SecondaryButton onClick={() => navigate("/refrigerator")}>
          냉장고로 돌아가기
        </SecondaryButton>
      </FooterActions>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  min-height: 100vh;
  padding: 32px 24px 80px;
  background: #f5f7fb;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackButton = styled.button`
  border: none;
  background: #e0e7ff;
  color: #4c6ef5;
  padding: 10px 16px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  cursor: pointer;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.4rem;
  color: #1e293b;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
`;

const TabBar = styled.div`
  display: inline-flex;
  border-radius: 999px;
  background: #e2e8f0;
  padding: 4px;
  width: fit-content;
`;

const TabButton = styled.button`
  border: none;
  background: ${(props) => (props.$active ? "#ffffff" : "transparent")};
  color: ${(props) => (props.$active ? "#2563eb" : "#475569")};
  padding: 10px 22px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
`;

const cardBase = css`
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
`;

const FormCard = styled.form`
  ${cardBase}
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ListCard = styled.div`
  ${cardBase}
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  color: #0f172a;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  label {
    font-size: 0.9rem;
    color: #475569;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  > div {
    flex: 1;
    min-width: 140px;
  }
`;

const Input = styled.input`
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  padding: 12px 14px;
  font-size: 0.95rem;
  background: #f8fafc;
  &:focus {
    outline: none;
    border-color: #4c6ef5;
    background: #fff;
  }
`;

const Select = styled.select`
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  padding: 12px 14px;
  font-size: 0.95rem;
  background: #f8fafc;
  &:focus {
    outline: none;
    border-color: #4c6ef5;
    background: #fff;
  }
`;

const SubmitButton = styled.button`
  margin-top: 8px;
  border: none;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(120deg, #4c6ef5, #60a5fa);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(76, 110, 245, 0.3);
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Chip = styled.span`
  background: #e0e7ff;
  color: #4c6ef5;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 600;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Item = styled.div`
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  border: 1px solid #e2e8f0;
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ItemName = styled.span`
  font-weight: 600;
  color: #0f172a;
`;

const ItemMeta = styled.span`
  font-size: 0.9rem;
  color: #64748b;
`;

const ItemMemo = styled.span`
  font-size: 0.85rem;
  color: #94a3b8;
`;

const DeleteButton = styled.button`
  border: none;
  background: #fee2e2;
  color: #dc2626;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    background: #fecaca;
  }
`;

const EmptyState = styled.div`
  padding: 32px;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  text-align: center;
  color: #94a3b8;
`;

const FooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SecondaryButton = styled.button`
  border: none;
  background: #fff;
  border-radius: 12px;
  padding: 14px 24px;
  color: #2563eb;
  font-weight: 600;
  border: 2px solid #dbeafe;
  cursor: pointer;
  &:hover {
    background: #f8fbff;
  }
`;

const Loading = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #64748b;
  background: #f5f7fb;
`;

export default Ingredient;
