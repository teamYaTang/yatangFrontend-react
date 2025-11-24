import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiPackage, FiLayers, FiPlusCircle } from "react-icons/fi";

import {
  getMainFridgeApi,
  getFridgeItemsApi,
  getFreezerItemsApi,
} from "../api/refrigerator";
import { getUserProfile } from "../api/auth";
import { getUserIdFromToken } from "../utils/jwt";

const Refrigerator = () => {
  const navigate = useNavigate();
  const [userNickname, setUserNickname] = useState("");
  const [mainFridge, setMainFridge] = useState(null);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [freezerItems, setFreezerItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigateToIngredient = () => navigate("/ingredient");
  const navigateToRecipe = () => navigate("/complete");
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  const refreshItems = async (targetFridgeId) => {
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

    const loadData = async () => {
      try {
        const userId = getUserIdFromToken();
        if (!userId) {
          navigate("/");
          return;
        }

        const profile = await getUserProfile(userId);
        setUserNickname(profile.nickname || profile.username || "");

        const fridge = await getMainFridgeApi();
        setMainFridge(fridge);
        await refreshItems(fridge.id);
      } catch (error) {
        console.error("데이터 로딩 에러:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const totalItems = useMemo(
    () => fridgeItems.length + freezerItems.length,
    [fridgeItems.length, freezerItems.length],
  );

  if (loading) {
    return <Loading>냉장고 불러오는 중...</Loading>;
  }

  const renderItemCard = (item, type) => (
    <ItemCard key={`${type}-${item.id}`}>
      <ItemIcon type={type}>{type === "fridge" ? "R" : "F"}</ItemIcon>
      <ItemContent>
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
      </ItemContent>
      <ItemBadge $status={item.isExpired ? "danger" : item.isExpiringSoon ? "warn" : "safe"}>
        {item.isExpired
          ? "만료"
          : item.isExpiringSoon
            ? "임박"
            : "보관중"}
      </ItemBadge>
    </ItemCard>
  );

  return (
    <PageWrapper>
      <Header>
        <div>
          <Title>{userNickname}의 냉장고</Title>
          <Subtitle>
            {mainFridge?.description || "등록된 재료를 한눈에 관리해보세요."}
          </Subtitle>
        </div>
        <IconButton onClick={handleLogout}>
          <FiLogOut size={18} /> 로그아웃
        </IconButton>
      </Header>

      <SummaryRow>
        <SummaryCard>
          <SummaryIcon $variant="fridge">
            <FiPackage size={28} />
          </SummaryIcon>
          <SummaryText>
            <span>냉장실</span>
            <strong>{fridgeItems.length}개</strong>
          </SummaryText>
        </SummaryCard>
        <SummaryCard>
          <SummaryIcon $variant="freezer">
            <FiLayers size={28} />
          </SummaryIcon>
          <SummaryText>
            <span>냉동실</span>
            <strong>{freezerItems.length}개</strong>
          </SummaryText>
        </SummaryCard>
        <SummaryCard>
          <SummaryIcon $variant="all">
            <FiPlusCircle size={28} />
          </SummaryIcon>
          <SummaryText>
            <span>전체 재료</span>
            <strong>{totalItems}개</strong>
          </SummaryText>
        </SummaryCard>
      </SummaryRow>

      <ActionRow>
        <PrimaryButton onClick={navigateToIngredient}>
          재료 추가 / 수정
        </PrimaryButton>
        <SecondaryButton onClick={navigateToRecipe}>
          메뉴 추천 받기
        </SecondaryButton>
      </ActionRow>

      <Section>
        <SectionHeader>
          <SectionTitle>냉장실 재료</SectionTitle>
          <SectionCount>{fridgeItems.length}개</SectionCount>
        </SectionHeader>
        {fridgeItems.length === 0 ? (
          <EmptyState>냉장실이 비어있어요. 재료를 채워보세요!</EmptyState>
        ) : (
          <Grid>{fridgeItems.map((item) => renderItemCard(item, "fridge"))}</Grid>
        )}
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>냉동실 재료</SectionTitle>
          <SectionCount>{freezerItems.length}개</SectionCount>
        </SectionHeader>
        {freezerItems.length === 0 ? (
          <EmptyState>냉동실이 비어있어요. 필요한 재료를 얼려보세요!</EmptyState>
        ) : (
          <Grid>{freezerItems.map((item) => renderItemCard(item, "freezer"))}</Grid>
        )}
      </Section>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f6f8fb;
  padding: 32px 24px 64px;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: #1f2d3d;
`;

const Subtitle = styled.p`
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.95rem;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #eef2ff;
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  color: #4c6ef5;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: #e0e7ff;
  }
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
`;

const SummaryCard = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
`;

const SummaryIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  background: ${(props) =>
    props.$variant === "fridge"
      ? "#4c8bf5"
      : props.$variant === "freezer"
        ? "#22b8cf"
        : "#a855f7"};
`;

const SummaryText = styled.div`
  display: flex;
  flex-direction: column;
  span {
    color: #94a3b8;
    font-size: 0.9rem;
  }
  strong {
    color: #0f172a;
    font-size: 1.4rem;
    margin-top: 2px;
  }
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const PrimaryButton = styled.button`
  flex: 1;
  min-width: 200px;
  border: none;
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(120deg, #4c6ef5, #5ed4f3);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 22px rgba(76, 110, 245, 0.3);
  &:hover {
    opacity: 0.95;
  }
`;

const SecondaryButton = styled.button`
  flex: 1;
  min-width: 200px;
  border: none;
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
  color: #2563eb;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid #dbeafe;
  &:hover {
    background: #f8fbff;
  }
`;

const Section = styled.section`
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  color: #1e293b;
`;

const SectionCount = styled.span`
  color: #94a3b8;
  font-weight: 600;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
`;

const ItemCard = styled.div`
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e2e8f0;
`;

const ItemIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${(props) =>
    props.type === "fridge" ? "#e0edff" : "#d9fbff"};
  color: ${(props) => (props.type === "fridge" ? "#2563eb" : "#0ca5c8")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

const ItemContent = styled.div`
  flex: 1;
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

const ItemBadge = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 999px;
  color: ${(props) =>
    props.$status === "danger"
      ? "#b42318"
      : props.$status === "warn"
        ? "#b45309"
        : "#0f766e"};
  background: ${(props) =>
    props.$status === "danger"
      ? "#fee4e2"
      : props.$status === "warn"
        ? "#fef3c7"
        : "#d1fae5"};
`;

const EmptyState = styled.div`
  padding: 32px;
  text-align: center;
  color: #94a3b8;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
`;

const Loading = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #64748b;
  background: #f6f8fb;
`;

export default Refrigerator;
