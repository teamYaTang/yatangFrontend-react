import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUser, FiLock, FiGrid, FiPlus } from "react-icons/fi";
import { getUserIdFromToken } from "../utils/jwt";
import { getUserProfile, updateNickname, updatePasswordApi } from "../api/auth";
import { getUserFridgesApi, createFridgeApi, updateFridgeApi, deleteFridgeApi } from "../api/refrigerator";
import { useToast } from "../context/ToastContext";
import "../styles/Settings.css";

const Settings = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const userId = getUserIdFromToken();
    const [activeTab, setActiveTab] = useState("fridge"); // 'profile' | 'fridge' — 첫 탭이 냉장고 관리
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({ nickname: "", email: "" });
    const [newNickname, setNewNickname] = useState("");

    // Password State
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    });

    // Fridge State
    const [fridges, setFridges] = useState([]);
    const [newFridgeName, setNewFridgeName] = useState("");
    const [newFridgeIsMain, setNewFridgeIsMain] = useState(false);

    // Fridge Edit State
    const [editingFridge, setEditingFridge] = useState(null);
    const [editFridgeName, setEditFridgeName] = useState("");
    const [editFridgeDesc, setEditFridgeDesc] = useState("");
    const [editFridgeIsMain, setEditFridgeIsMain] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const user = await getUserProfile(userId);
            setProfile(user);
            setNewNickname(user.nickname);

            const fridgeList = await getUserFridgesApi();
            setFridges(fridgeList);
        } catch (error) {
            console.error("데이터 불러오기 실패:", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            toast("로그인이 필요합니다.");
            navigate("/");
            return;
        }
        fetchData();
    }, [userId, navigate, fetchData, toast]);

    // --- Profile Handlers ---
    const handleNicknameChange = async () => {
        if (!newNickname.trim() || newNickname === profile.nickname) return;
        try {
            await updateNickname(userId, newNickname);
            toast("닉네임이 변경되었습니다.");
            fetchData();
        } catch (error) {
            toast(error.message);
        }
    };

    const handlePasswordChange = async () => {
        const { current, new: newPass, confirm } = passwords;
        if (!current || !newPass || !confirm) {
            toast("모든 필드를 입력해주세요.");
            return;
        }
        if (newPass !== confirm) {
            toast("새 비밀번호가 일치하지 않습니다.");
            return;
        }
        if (newPass.length < 4) {
            toast("비밀번호는 4자 이상이어야 합니다.");
            return;
        }

        try {
            await updatePasswordApi(userId, current, newPass);
            toast("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
            localStorage.removeItem("accessToken");
            navigate("/");
        } catch (error) {
            toast(error.message);
        }
    };

    // --- Fridge Handlers ---
    const handleCreateFridge = async () => {
        if (!newFridgeName.trim()) {
            toast("냉장고 이름을 입력해주세요.");
            return;
        }
        try {
            await createFridgeApi(newFridgeName, newFridgeIsMain);
            toast("냉장고가 추가되었습니다.");
            setNewFridgeName("");
            setNewFridgeIsMain(false);
            fetchData();
        } catch (error) {
            toast("냉장고 추가 실패: " + error.message);
        }
    };

    const openFridgeEdit = (fridge) => {
        setEditingFridge(fridge.id);
        setEditFridgeName(fridge.name);
        setEditFridgeDesc(fridge.description || "");
        setEditFridgeIsMain(fridge.isMain || false);
    };

    const cancelFridgeEdit = () => {
        setEditingFridge(null);
    };

    const handleUpdateFridge = async (fridgeId) => {
        if (!editFridgeName.trim()) {
            toast("냉장고 이름을 입력해주세요.");
            return;
        }
        try {
            await updateFridgeApi(fridgeId, {
                name: editFridgeName,
                description: editFridgeDesc,
                isMain: editFridgeIsMain
            });
            toast("냉장고 정보가 수정되었습니다.");
            setEditingFridge(null);
            fetchData();
        } catch (error) {
            toast("냉장고 수정 실패: " + error.message);
        }
    };

    const handleDeleteFridge = async (fridge) => {
        if (fridge?.isMain === true) {
            toast("메인 냉장고는 삭제할 수 없습니다.");
            return;
        }
        if (!window.confirm("정말 냉장고를 삭제하시겠습니까?")) return;

        try {
            await deleteFridgeApi(fridge.id);
            toast("냉장고가 삭제되었습니다.");
            fetchData();
        } catch (error) {
            toast(error.message || "냉장고 삭제에 실패했습니다.");
        }
    };

    if (loading && !profile.email) {
        return <div className="settings-page-wrapper">로딩중...</div>;
    }

    return (
        <div className="settings-page-wrapper">
            <header className="settings-header">
                <button className="settings-back-button" onClick={() => navigate(-1)}>
                    <FiArrowLeft />
                </button>
                <h1 className="settings-title">설정</h1>
            </header>

            <div className="settings-tabs">
                <button
                    className={`settings-tab ${activeTab === "fridge" ? "active" : ""}`}
                    onClick={() => setActiveTab("fridge")}
                >
                    냉장고 관리
                </button>
                <button
                    className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    내 정보
                </button>
            </div>

            {activeTab === "fridge" && (
                <div className="settings-section">
                    {/* Fridge List Card — 메인 냉장고가 맨 위에 오도록 목록을 먼저 표시 */}
                    <div className="settings-card">
                        <div className="settings-card-title">
                            <FiGrid /> 내 냉장고 목록
                        </div>
                        <div className="settings-fridge-list">
                            {fridges.length === 0 ? (
                                <div className="settings-empty-text">보유한 냉장고가 없습니다.</div>
                            ) : (
                                [...fridges]
                                    .sort(
                                        (a, b) =>
                                            Number(b.isMain === true) -
                                            Number(a.isMain === true)
                                    )
                                    .map((fridge) => (
                                    <div key={fridge.id} className="settings-fridge-item" style={{ display: "flex", flexDirection: "column", gap: "12px", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "12px" }}>

                                        {editingFridge === fridge.id ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                                                <input
                                                    className="settings-input"
                                                    value={editFridgeName}
                                                    onChange={e => setEditFridgeName(e.target.value)}
                                                    placeholder="냉장고 이름"
                                                />
                                                <input
                                                    className="settings-input"
                                                    value={editFridgeDesc}
                                                    onChange={e => setEditFridgeDesc(e.target.value)}
                                                    placeholder="냉장고 설명"
                                                />
                                                {fridge.isMain === true ? (
                                                    <div className="settings-main-only-message" role="status">
                                                        메인 냉장고입니다.
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <input
                                                            type="checkbox"
                                                            id={`editMain-${fridge.id}`}
                                                            checked={editFridgeIsMain}
                                                            onChange={e => setEditFridgeIsMain(e.target.checked)}
                                                            style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#4c6ef5" }}
                                                        />
                                                        <label htmlFor={`editMain-${fridge.id}`} style={{ fontSize: "0.9rem", color: "#475569", cursor: "pointer", userSelect: "none" }}>
                                                            이 냉장고를 메인냉장고로 설정
                                                        </label>
                                                    </div>
                                                )}
                                                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                                    <button className="settings-button" style={{ background: "#f1f5f9", color: "#475569" }} onClick={cancelFridgeEdit}>
                                                        취소
                                                    </button>
                                                    <button className="settings-button" onClick={() => handleUpdateFridge(fridge.id)}>
                                                        저장
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: "100%" }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className="settings-fridge-name" style={{ fontWeight: 600, color: "#1e293b" }}>{fridge.name}</span>
                                                        {fridge.isMain === true && (
                                                            <span className="badge-main" title="메인 냉장고">
                                                                main
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{fridge.description || "설명이 없습니다."}</span>
                                                </div>
                                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                    <button
                                                        className="settings-button"
                                                        style={{ width: "auto", padding: "6px 16px", marginTop: "0", background: "#f8fafc", color: "#4c6ef5", border: "1px solid #dbeafe" }}
                                                        onClick={() => openFridgeEdit(fridge)}
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        className="settings-button"
                                                        style={{ width: "auto", padding: "6px 16px", marginTop: "0", background: fridge.isMain === true ? "#f1f5f9" : "#fff", color: fridge.isMain === true ? "#94a3b8" : "#ef4444", border: "1px solid " + (fridge.isMain === true ? "#e2e8f0" : "#fecaca"), boxShadow: "none" }}
                                                        disabled={fridge.isMain === true}
                                                        title={fridge.isMain === true ? "메인 냉장고는 삭제할 수 없습니다." : "냉장고 삭제"}
                                                        onClick={() => handleDeleteFridge(fridge)}
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                                {/*<button*/}
                                            </div>
                                        )}

                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Create Fridge Card */}
                    <div className="settings-card">
                        <div className="settings-card-title">
                            <FiPlus /> 냉장고 추가
                        </div>
                        <div className="settings-input-group">
                            <input
                                className="settings-input"
                                placeholder="예: 미니 냉장고"
                                value={newFridgeName}
                                onChange={(e) => setNewFridgeName(e.target.value)}
                            />
                        </div>
                        <div className="settings-input-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
                            <input
                                type="checkbox"
                                id="isMainCheckbox"
                                checked={newFridgeIsMain}
                                onChange={(e) => setNewFridgeIsMain(e.target.checked)}
                                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#4c6ef5" }}
                            />
                            <label htmlFor="isMainCheckbox" style={{ fontSize: "0.9rem", color: "#475569", cursor: "pointer", userSelect: "none" }}>
                                이 냉장고를 메인냉장고로 설정
                            </label>
                        </div>
                        <button className="settings-button" onClick={handleCreateFridge}>
                            추가하기
                        </button>
                    </div>
                </div>
            )}

            {activeTab === "profile" && (
                <div className="settings-section">
                    {/* Default Info Card */}
                    <div className="settings-card">
                        <div className="settings-card-title">
                            <FiUser /> 기본 정보
                        </div>
                        <div className="settings-input-group">
                            <label className="settings-label">이메일</label>
                            <input
                                className="settings-input"
                                value={profile.email}
                                disabled
                                style={{ background: "#f1f5f9", cursor: "default" }}
                            />
                        </div>

                        <div className="settings-input-group">
                            <label className="settings-label">닉네임</label>
                            <input
                                className="settings-input"
                                value={newNickname}
                                onChange={(e) => setNewNickname(e.target.value)}
                                placeholder="새 닉네임 입력"
                            />
                        </div>
                        <button
                            className="settings-button"
                            onClick={handleNicknameChange}
                            disabled={newNickname === profile.nickname}
                        >
                            닉네임 변경
                        </button>
                    </div>

                    {/* Password Card */}
                    <div className="settings-card">
                        <div className="settings-card-title">
                            <FiLock /> 비밀번호 변경
                        </div>
                        <div className="settings-input-group">
                            <input
                                className="settings-input"
                                type="password"
                                placeholder="현재 비밀번호"
                                value={passwords.current}
                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            />
                            <input
                                className="settings-input"
                                type="password"
                                placeholder="새 비밀번호"
                                value={passwords.new}
                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            />
                            <input
                                className="settings-input"
                                type="password"
                                placeholder="새 비밀번호 확인"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            />
                        </div>
                        <button className="settings-button" onClick={handlePasswordChange}>
                            비밀번호 변경하기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
