/**
 * 재료 사진 업로드용: 긴 변 maxEdge 이하로 리사이즈 후 JPEG Blob 생성.
 * 폰 원본(수 MB)이 nginx/Spring 한도에 걸리기 전에 줄입니다.
 */
export function compressImageForUpload(file, { maxEdge = 1024, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("이미지 파일만 업로드할 수 있습니다."));
      return;
    }
    // iOS 카메라/앨범에서 type 이 비어 있거나 HEIC 인 경우가 있음
    const type = (file.type || "").toLowerCase();
    if (type && !type.startsWith("image/") && type !== "application/octet-stream") {
      reject(new Error("이미지 파일만 업로드할 수 있습니다."));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxEdge / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("이미지를 처리할 수 없습니다."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("이미지 압축에 실패했습니다."));
              return;
            }
            const name = (file.name || "ingredient.jpg").replace(/\.[^.]+$/, "") + ".jpg";
            resolve(new File([blob], name, { type: "image/jpeg", lastModified: Date.now() }));
          },
          "image/jpeg",
          quality,
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했습니다."));
    };
    img.src = url;
  });
}
