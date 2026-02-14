import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUser, FiLock, FiGrid, FiPlus } from "react-icons/fi";
import { getUserIdFromToken } from "../utils/jwt";
import { getUserProfile, updateNickname, updatePasswordApi } from "../api/auth";
import { getUserFridgesApi, createFridgeApi } from "../api/refrigerator";
import "../styles/Settings.css";

const Settings = () => {
    const navigate = useNavigate();
    const userId = getUserIdFromToken();
    const [activeTab, setActiveTab] = useState("profile"); // 'profile' or 'fridge'
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
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }
        fetchData();
    }, [userId, navigate, fetchData]);

    // --- Profile Handlers ---
    const handleNicknameChange = async () => {
        if (!newNickname.trim() || newNickname === profile.nickname) return;
        try {
            await updateNickname(userId, newNickname);
            alert("닉네임이 변경되었습니다.");
            fetchData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handlePasswordChange = async () => {
        const { current, new: newPass, confirm } = passwords;
        if (!current || !newPass || !confirm) {
            alert("모든 필드를 입력해주세요.");
            return;
        }
        if (newPass !== confirm) {
            alert("새 비밀번호가 일치하지 않습니다.");
            return;
        }
        if (newPass.length < 4) {
            alert("비밀번호는 4자 이상이어야 합니다.");
            return;
        }

        try {
            await updatePasswordApi(userId, current, newPass);
            alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
            localStorage.removeItem("accessToken");
            navigate("/");
        } catch (error) {
            alert(error.message);
        }
    };

    // --- Fridge Handlers ---
    const handleCreateFridge = async () => {
        if (!newFridgeName.trim()) {
            alert("냉장고 이름을 입력해주세요.");
            return;
        }
        try {
            await createFridgeApi(newFridgeName);
            alert("냉장고가 추가되었습니다.");
            setNewFridgeName("");
            fetchData();
        } catch (error) {
            alert("냉장고 추가 실패: " + error.message);
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
                    className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    내 정보
                </button>
                <button
                    className={`settings-tab ${activeTab === "fridge" ? "active" : ""}`}
                    onClick={() => setActiveTab("fridge")}
                >
                    냉장고 관리
                </button>
            </div>

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

            {activeTab === "fridge" && (
                <div className="settings-section">
                    {/* Create Fridge Card */}
                    <div className="settings-card">
                        <div className="settings-card-title">
                            <FiPlus /> 냉장고 추가
                        </div>
                        <div className="settings-input-group">
                            <input
                                className="settings-input"
                                placeholder="예: 자취방 냉장고"
                                value={newFridgeName}
                                onChange={(e) => setNewFridgeName(e.target.value)}
                            />
                        </div>
                        <button className="settings-button" onClick={handleCreateFridge}>
                            추가하기
                        </button>
                    </div>

                    {/* Fridge List Card */}
                    <div className="settings-card">
                        <div className="settings-card-title">
                            <FiGrid /> 내 냉장고 목록
                        </div>
                        <div className="settings-fridge-list">
                            {fridges.length === 0 ? (
                                <div className="settings-empty-text">보유한 냉장고가 없습니다.</div>
                            ) : (
                                fridges.map((fridge) => (
                                    <div key={fridge.id} className="settings-fridge-item">
                                        <span className="settings-fridge-name">{fridge.name}</span>
                                        {/* <span className="settings-fridge-date">
                       {new Date(fridge.createdAt).toLocaleDateString()}
                    </span> */}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
