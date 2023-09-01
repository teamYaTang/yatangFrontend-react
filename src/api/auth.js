import apiClient from "./apiClient";

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
    .post("/api/login", data)
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      const status = error.response?.status;
      let message;
      if (status === 401) {
        message = "잘못된 비밀번호 입니다.";
      } else if (status === 404) {
        console.log(data);
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
        console.log(error.request);
        message = "존재하지 않는 사용자입니다.";
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
    .post("/account/register", data)
    .then((data) => {
      console.log(data);
      let access = data;
    })
    .catch((error) => {
      const status = error.response?.status;
      let message;
      if (status === 400) {
        message = "이미 가입된 사용자 입니다.";
      } else {
        message =
          "알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도 해 주세요.";
      }

      throw new Error(message);
    });
}

//nickName
export async function nickname(data) {
  return apiClient
    .post(`/account/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((data) => {
      let access = data.data;
    })
    .catch((error) => {
      const status = error.response?.status;
      let message;
      if (status === 400) {
        message = "이미 가입된 사용자 입니다.";
      } else {
        message =
          "알 수 없는 에러가 발생했습니다. 잠시 후 다시 시도 해 주세요.";
      }

      throw new Error(message);
    });
}
