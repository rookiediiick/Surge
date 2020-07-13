/*
仅作为备份自用
来源： https://github.com/NobyDa/Script/blob/master/BDTieBa-DailyBonus/TieBa.js
*/

var $nobyda = nobyda();
var cookieVal = $nobyda.read("CookieTB");
var done = $nobyda.done();
var useParallel = 0; //0自动切换,1串行,2并行(当贴吧数量大于30个以后,并行可能会导致QX崩溃,所以您可以自动切换)
var singleNotifyCount = 20; //想签到几个汇总到一个通知里,这里就填几个(比如我有13个要签到的,这里填了5,就会分三次消息通知过去)
var process = {
  total: 0,
  result: [
    // {
    //     bar:'',
    //     level:0,
    //     exp:0,
    //     errorCode:0,
    //     errorMsg:''
    // }
  ]
};
var url_fetch_sign = {
  url: "https://tieba.baidu.com/mo/q/newmoindex",
  headers: {
    "Content-Type": "application/octet-stream",
    Referer: "https://tieba.baidu.com/index/tbwise/forum",
    Cookie: cookieVal,
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366"
  }
};
var url_fetch_add = {
  url: "https://tieba.baidu.com/sign/add",
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: cookieVal,
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_1_1 like Mac OS X; zh-CN) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/14B100 UCBrowser/10.7.5.650 Mobile"
  },
  body: ""
};
if ($nobyda.isRequest) {
  GetCookie()
} else {
  signTieBa()
}


function signTieBa() {
  if (!cookieVal) {
    $nobyda.notify("贴吧签到", "签到失败", "未获取到cookie");
    return;
  }
  $nobyda.get(url_fetch_sign, function(error, response, data) {
    if (error) {
      $nobyda.notify("贴吧签到", "签到失败", "未获取到签到列表");
    } else {
      // $nobyda.notify("贴吧签到", "贴吧列表", response.body);
      var body = JSON.parse(data);
      var isSuccessResponse = body && body.no == 0 && body.error == "success" && body.data.tbs;
      if (!isSuccessResponse) {
        $nobyda.notify("贴吧签到", "签到失败", (body && body.error) ? body.error : "接口数据获取失败");
        return;
      }
      process.total = body.data.like_forum.length;
      if (body.data.like_forum && body.data.like_forum.length > 0) {
        if (useParallel == 1 || (useParallel == 0 && body.data.like_forum.length >= 30)) {
          signBars(body.data.like_forum, body.data.tbs, 0);
        } else {
          for (const bar of body.data.like_forum) {
            signBar(bar, body.data.tbs);
          }
        }
      } else {
        $nobyda.notify("贴吧签到", "签到失败", "请确认您有关注的贴吧");
        return;
      }
    }
  })
}

function signBar(bar, tbs) {
  if (bar.is_sign == 1) { //已签到的,直接不请求接口了
    process.result.push({
      bar: `${bar.forum_name}`,
      level: bar.user_level,
      exp: bar.user_exp,
      errorCode: 9999,
      errorMsg: "已签到"
    });
    checkIsAllProcessed();
  } else {
    url_fetch_add.body = `tbs=${tbs}&kw=${bar.forum_name}&ie=utf-8`;
    $nobyda.post(url_fetch_add, function(error, response, data) {
      if (error) {
        process.result.push({
          bar: bar.forum_name,
          errorCode: 999,
          errorMsg: '接口错误'
        });
        checkIsAllProcessed();
      } else {
        try {
          var addResult = JSON.parse(data);
          if (addResult.no == 0) {
            process.result.push({
              bar: bar.forum_name,
              errorCode: 0,
              errorMsg: `获得${addResult.data.uinfo.cont_sign_num}积分,第${addResult.data.uinfo.user_sign_rank}个签到`
            });
          } else {
            process.result.push({
              bar: bar.forum_name,
              errorCode: addResult.no,
              errorMsg: addResult.error
            });
          }
        } catch (e) {
          $nobyda.notify("贴吧签到", "贴吧签到数据处理异常", JSON.stringify(e));
        }
        checkIsAllProcessed();
      }
    })
  }
}

function signBars(bars, tbs, index) {
  //$nobyda.notify("贴吧签到", `进度${index}/${bars.length}`, "");
  if (index >= bars.length) {
    //$nobyda.notify("贴吧签到", "签到已满", `${process.result.length}`);
    checkIsAllProcessed();
  } else {
    var bar = bars[index];
    if (bar.is_sign == 1) { //已签到的,直接不请求接口了
      process.result.push({
        bar: `${bar.forum_name}`,
        level: bar.user_level,
        exp: bar.user_exp,
        errorCode: 9999,
        errorMsg: "已签到"
      });
      signBars(bars, tbs, ++index);
    } else {
      url_fetch_add.body = `tbs=${tbs}&kw=${bar.forum_name}&ie=utf-8`;
      $nobyda.post(url_fetch_add, function(error, response, data) {
        if (error) {
          process.result.push({
            bar: bar.forum_name,
            errorCode: 999,
            errorMsg: '接口错误'
          });
          signBars(bars, tbs, ++index);
        } else {
          try {
            var addResult = JSON.parse(data);
            if (addResult.no == 0) {
              process.result.push({
                bar: bar.forum_name,
                errorCode: 0,
                errorMsg: `获得${addResult.data.uinfo.cont_sign_num}积分,第${addResult.data.uinfo.user_sign_rank}个签到`
              });
            } else {
              process.result.push({
                bar: bar.forum_name,
                errorCode: addResult.no,
                errorMsg: addResult.error
              });
            }
          } catch (e) {
            $nobyda.notify("贴吧签到", "贴吧签到数据处理异常", JSON.stringify(e));
          }
          signBars(bars, tbs, ++index)
        }
      })
    }
  }
}

function checkIsAllProcessed() {
  //$nobyda.notify("贴吧签到", `最终进度${process.result.length}/${process.total}`, "");
  if (process.result.length != process.total) return;
  for (var i = 0; i < Math.ceil(process.total / singleNotifyCount); i++) {
    var notify = "";
    var spliceArr = process.result.splice(0, singleNotifyCount);
    var notifySuccessCount = 0;
    for (const res of spliceArr) {
      if (res.errorCode == 0 || res.errorCode == 9999) {
        notifySuccessCount++;
      }
      if (res.errorCode == 9999) {
        notify += `【${res.bar}】已经签到，当前等级${res.level},经验${res.exp}
`;
      } else {
        notify += `【${res.bar}】${res.errorCode==0?'签到成功':'签到失败'}，${res.errorCode==0?res.errorMsg:('原因：'+res.errorMsg)}
`;
      }
    }
    $nobyda.notify("贴吧签到", `签到${spliceArr.length}个,成功${notifySuccessCount}个`, notify);
  }
}

function GetCookie() {
  var headerCookie = $request.headers["Cookie"];
  if (headerCookie) {
    if ($nobyda.read("CookieTB") != undefined) {
      if ($nobyda.read("CookieTB") != headerCookie) {
        if (headerCookie.indexOf("BDUSS") != -1) {
          var cookie = $nobyda.write(headerCookie, "CookieTB");
          if (!cookie) {
            $nobyda.notify("更新贴吧Cookie失败‼️", "", "");
          } else {
            $nobyda.notify("更新贴吧Cookie成功 🎉", "", "");
          }
        }
      }
    } else {
      if (headerCookie.indexOf("BDUSS") != -1) {
        var cookie = $nobyda.write(headerCookie, "CookieTB");
        if (!cookie) {
          $nobyda.notify("首次写入贴吧Cookie失败‼️", "", "");
        } else {
          $nobyda.notify("首次写入贴吧Cookie成功 🎉", "", "");
        }
      }
    }
  }
}

function nobyda() {
  const isRequest = typeof $request != "undefined"
  const isSurge = typeof $httpClient != "undefined"
  const isQuanX = typeof $task != "undefined"
  const notify = (title, subtitle, message) => {
    if (isQuanX) $notify(title, subtitle, message)
    if (isSurge) $notification.post(title, subtitle, message)
  }
  const write = (value, key) => {
    if (isQuanX) return $prefs.setValueForKey(value, key)
    if (isSurge) return $persistentStore.write(value, key)
  }
  const read = (key) => {
    if (isQuanX) return $prefs.valueForKey(key)
    if (isSurge) return $persistentStore.read(key)
  }
  const adapterStatus = (response) => {
    if (response) {
      if (response.status) {
        response["statusCode"] = response.status
      } else if (response.statusCode) {
        response["status"] = response.statusCode
      }
    }
    return response
  }
  const get = (options, callback) => {
    if (isQuanX) {
      if (typeof options == "string") options = {
        url: options
      }
      options["method"] = "GET"
      $task.fetch(options).then(response => {
        callback(null, adapterStatus(response), response.body)
      }, reason => callback(reason.error, null, null))
    }
    if (isSurge) $httpClient.get(options, (error, response, body) => {
      callback(error, adapterStatus(response), body)
    })
  }
  const post = (options, callback) => {
    if (isQuanX) {
      if (typeof options == "string") options = {
        url: options
      }
      options["method"] = "POST"
      $task.fetch(options).then(response => {
        callback(null, adapterStatus(response), response.body)
      }, reason => callback(reason.error, null, null))
    }
    if (isSurge) {
      $httpClient.post(options, (error, response, body) => {
        callback(error, adapterStatus(response), body)
      })
    }
  }
  const done = (value = {}) => {
    if (isQuanX) isRequest ? $done(value) : null
    if (isSurge) isRequest ? $done(value) : $done()
  }
  return {
    isRequest,
    notify,
    write,
    read,
    get,
    post,
    done
  }
};
