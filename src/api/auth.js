import apiClient, { clearAuthTokens, setAuthTokens } from "./apiClient";



// signIn
// export async function signin(data) {
//   return apiClient
//     .post("/account/login", data, {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     })
//     .then((data) => {
//       return { accessToken: data.data.access_token };
//     })
//     .catch((error) => {
//       const status = error.response?.status;
//       let message;
//       if (status === 401) {
//         message = "잘못된 비밀번호 입니다.";
//       } else if (status === 404) {
//         message = "존재하지 않는 사용자입니다.";
//       } else {
//         message =
//           "알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도 해 주세요.";
//       }

//       throw new Error(message);
//     });
// }
export async function signin(data) {
  return apiClient
    .post("/login", data)
    .then((response) => {
      const tokens = normalizeAuthResponse(response.data);
      if (tokens.accessToken) {
        setAuthTokens(tokens);
        return tokens;
      }
      throw new Error("토큰을 받지 못했습니다.");
    })
    .catch((error) => {
      const status = error.response?.status;
      const data = error.response?.data;
      const serverMsg =
        typeof data === "string" && data.trim()
          ? data.trim()
          : data?.message || data?.error || data?.error_description;
      if (serverMsg) {
        throw new Error(String(serverMsg));
      }
      if (status === 401 || status === 403) {
        throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
      if (status === 404 || status === 400) {
        throw new Error("존재하지 않는 사용자이거나 요청이 올바르지 않습니다.");
      }
      throw new Error("알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도 해 주세요.");
    });
}

export async function logoutApi() {
  const refreshToken = localStorage.getItem("refreshToken");
  try {
    if (refreshToken) {
      await apiClient.post("/auth/logout", { refreshToken });
    }
  } catch (error) {
    console.warn("로그아웃 토큰 폐기 요청 실패:", error);
  } finally {
    clearAuthTokens();
  }
}

function normalizeAuthResponse(data) {
  if (typeof data === "string") {
    return { accessToken: data, refreshToken: null };
  }
  return {
    accessToken: data?.accessToken,
    refreshToken: data?.refreshToken,
    tokenType: data?.tokenType,
    expiresInMs: data?.expiresInMs,
  };
}

// signUp
// export async function signup(data) {
//   return apiClient
//     .post("/account/register", data, {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     })
//     .then((data) => {
//       let access = data.data;
//     })
//     .catch((error) => {
//       const status = error.response?.status;
//       let message;
//       if (status === 400) {
//         message = "이미 가입된 사용자 입니다.";
//       } else {
//         message =
//           "알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도 해 주세요.";
//       }

//       throw new Error(message);
//     });
// }

export async function signup(data) {
  return apiClient
    .post("/users/signup", data)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      const status = error.response?.status;
      let message;
      if (status === 400) {
        message = error.response?.data?.message || "이미 가입된 사용자입니다.";
      } else {
        message =
          error.response?.data?.message ||
          "알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도 해 주세요.";
      }

      throw new Error(message);
    });
}

// 사용자 정보 조회 (백엔드는 JWT의 로그인 사용자 기준으로 프로필을 반환합니다)
export async function getUserProfile() {
  return apiClient
    .get("/users/0/profile")
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw new Error(error.response?.data?.message || "사용자 정보를 가져오는데 실패했습니다.");
    });
}

// 닉네임 업데이트
export async function updateNickname(nickname) {
  return apiClient
    .patch(`/users/0/nickname`, { nickname })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw new Error(error.response?.data?.message || "닉네임 업데이트에 실패했습니다.");
    });
}

/** 회원 탈퇴 (서버 데이터 삭제 후 로컬 토큰 제거) */
export async function deleteAccountApi() {
  try {
    await apiClient.delete("/users/0/account");
  } catch (error) {
    throw new Error(error.response?.data?.message || "회원 탈퇴에 실패했습니다.");
  } finally {
    clearAuthTokens();
  }
}

// 비밀번호 변경
export async function updatePasswordApi(currentPassword, newPassword) {
  return apiClient
    .patch(`/users/0/password`, { currentPassword, newPassword })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw new Error(error.response?.data?.message || "비밀번호 변경에 실패했습니다.");
    });
}
