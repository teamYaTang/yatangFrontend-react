import apiClient, {setAuthorization} from "./apiClient";

//ex
let id = 1;

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
      const token = response.data;
      if (token) {
        localStorage.setItem("accessToken", token);
        setAuthorization(token);
        return { accessToken: token };
      }
      throw new Error("토큰을 받지 못했습니다.");
    })
    .catch((error) => {
      const status = error.response?.status;
      let message;
      if (status === 401) {
        message = "잘못된 비밀번호 입니다.";
      } else if (status === 404 || status === 400) {
        message = error.response?.data?.message || "존재하지 않는 사용자입니다.";
      } else {
        message =
          "알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도 해 주세요.";
      }

      throw new Error(message);
    });
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

// 사용자 정보 조회
export async function getUserProfile(userId) {
  return apiClient
    .get(`/users/${userId}/profile`)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw new Error(error.response?.data?.message || "사용자 정보를 가져오는데 실패했습니다.");
    });
}

// 닉네임 업데이트
export async function updateNickname(userId, nickname) {
  return apiClient
    .patch(`/users/${userId}/nickname`, { nickname })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw new Error(error.response?.data?.message || "닉네임 업데이트에 실패했습니다.");
    });
}
