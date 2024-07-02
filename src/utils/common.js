import { ElNotification } from "element-plus";

export function notice(type, title, msg) {
  ElNotification({
    type: type,
    title: title,
    message: msg,
    offset: 100,
  });
}

export const uuid = (len, radix) => {
  //生成一段随机的uuid唯一标识符
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz".split("");
  const uuid = [];
  let i;
  radix = radix || chars.length;
  if (len) {
    for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
  } else {
    let r;
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
    uuid[14] = "4";
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return uuid.join("");
};

export function getFileSize(fileByte) {
  let fileSizeByte = fileByte;
  let fileSizeMsg = "";
  if (fileSizeByte < 1048576)
    fileSizeMsg = (fileSizeByte / 1024).toFixed(2) + " KB";
  else if (fileSizeByte == 1048576) fileSizeMsg = "1 MB";
  else if (fileSizeByte > 1048576 && fileSizeByte < 1073741824)
    fileSizeMsg = (fileSizeByte / (1024 * 1024)).toFixed(2) + " MB";
  else if (fileSizeByte > 1048576 && fileSizeByte == 1073741824)
    fileSizeMsg = "1 GB";
  else if (fileSizeByte > 1073741824 && fileSizeByte < 1099511627776)
    fileSizeMsg = (fileSizeByte / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  else fileSizeMsg = "文件超过1 TB";
  return fileSizeMsg;
}


export function getToken() {
  return localStorage.getItem("zymtoken");
}

export function setToken(token) {
  localStorage.setItem("zymtoken", token);
}

// 防抖
export const debounce = (callback, time) => {
  let timeout = null;
  return () => {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(() => {
      callback();
    }, time);
  };
};

