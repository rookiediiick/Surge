/*
仅作为备份自用
来源：https://github.com/Choler/Surge/blob/master/Script/YouTube.js

使用方法：
[Script]
http-request ^https://[\s\S]*\.googlevideo\.com/.*&(oad|ctier) script-path=https://Choler.github.io/Surge/Script/YouTube.js
[MITM]
hostname = *.googlevideo.com
*/

var data = {
  body: "{}",
  headers: {
    "Content-Type": "multipart/byteranges"
  }
};
$done({response: data});
