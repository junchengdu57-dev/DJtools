// ==UserScript==
// @name         工时统计助手 - CS:GO UI轮盘版 (V44.5)
// @namespace    http://tampermonkey.net/
// @version      44.5
// @description  优化工时系统查询往日记录逻辑，解决往日多条或在周一/请假的时候选择参考昨日填写，获取不了的问题
// @match        *://*/*
// @include      file:///*
// @updateURL    https://raw.githubusercontent.com/junchengdu57-dev/DJtools/main/CsgoWebTool.user.js
// @downloadURL  https://raw.githubusercontent.com/junchengdu57-dev/DJtools/main/CsgoWebTool.user.js
// @connect      work.cqdev.top
// @connect      172.16.1.77
// @connect      jira.transsion.com
// @connect      jira-ex.transsion.com
// @connect      www.mobiwire.com.cn
// @connect      122.227.250.174
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    console.log("🔥 [CS:GO] V44.5 启动 - Core 44.5，作者DJ");

    // ================= V41 核心配置 (绝对保留) =================
    const DOMAIN_BASE = "http://work.cqdev.top";
    const API_LOGIN = `${DOMAIN_BASE}:8888/api/auth/login`;
    const SAGEREAL_HOSTS = ["http://172.16.1.77:8989", "http://work.cqdev.top:8989"];
    const KEY_SR_HOST = 'tm_csgo_v43_sr_host';
    let CURRENT_SR_HOST = GM_getValue(KEY_SR_HOST, SAGEREAL_HOSTS[0]);
    function srEndpoints() {
        const base = `${CURRENT_SR_HOST}/CqSagereal/`;
        return {
            base,
            apiData: `${CURRENT_SR_HOST}/CqSagereal/controller/workLoad`,
            pageAdd: `${CURRENT_SR_HOST}/CqSagereal/page/performance_workload_add`,
            referer: `${CURRENT_SR_HOST}/CqSagereal/page/main`,
            origin: base
        };
    }

    // Mobiwire 配置
    const MW_URLS = {
        base: "https://www.mobiwire.com.cn/query",
        init: "https://www.mobiwire.com.cn/query/Logon.asp",
        login: "https://www.mobiwire.com.cn/query/CheckLogin.asp",
        query: "https://www.mobiwire.com.cn/query/OneRDsalary.asp",
        attend: "https://www.mobiwire.com.cn/query/COWA.asp"
    };

    const TS_API_BASE = "http://122.227.250.174:4333";
    const TS_URL_LOGIN = `${TS_API_BASE}/pmSystemApi/admin/login`;
    const TS_URL_PROJ_DEV = `${TS_API_BASE}/pmSystemApi/admin/userWorkloadData/getPMSAndReProjectDataByUserId`;
    const TS_URL_PROJ_PRE = `${TS_API_BASE}/pmSystemApi/admin/preResearchProject/lists`;
    const TS_URL_PROJ_COM = `${TS_API_BASE}/pmSystemApi/admin/userWorkloadData/getCommonProjectDataByUserId`;
    const TS_URL_STAGES = `${TS_API_BASE}/pmSystemApi/admin/userWorkloadData/getNPINode`;
    const TS_URL_CHECKER = `${TS_API_BASE}/pmSystemApi/admin/userWorkloadData/getCheckPersonDataByUserId`;
    const TS_URL_SAVE = `${TS_API_BASE}/pmSystemApi/admin/workloadRecord/insertOrUpdate`;
    const TS_URL_DELETE = `${TS_API_BASE}/pmSystemApi/admin/workloadRecord/remove`;
    const TS_URL_QUERY = `${TS_API_BASE}/pmSystemApi/admin/workloadRecord/listDtoByPage`;

    // Jira 配置
    const JIRA_INTERNAL = "http://jira.transsion.com";
    const JIRA_EXTERNAL = "http://jira-ex.transsion.com:6001";
    const URL_LOGIN_INT = `${JIRA_INTERNAL}/login.jsp`;
    const URL_LOGIN_EXT = `${JIRA_EXTERNAL}/login.jsp`;

    const STORAGE_KEY_AUTH = 'tm_csgo_v42_auth';
    const STORAGE_KEY_SUBMIT_HISTORY = 'tm_csgo_v42_submit_hist';
    const KEY_MENU_ORDER = 'tm_csgo_v42_menu_order';
    const KEY_THEME = 'tm_csgo_v42_theme';

    let SESSION_TOKEN = "";
    let SESSION_ID_8989 = "";
    let PROJECT_LIST_CACHE = [];

    // ================= MD5 算法 (V41原版) =================
    var MD5=function(string){function RotateLeft(lValue,iShiftBits){return(lValue<<iShiftBits)|(lValue>>>(32-iShiftBits))}function AddUnsigned(lX,lY){var lX4,lY4,lX8,lY8,lResult;lX8=(lX&0x80000000);lY8=(lY&0x80000000);lX4=(lX&0x40000000);lY4=(lY&0x40000000);lResult=(lX&0x3FFFFFFF)+(lY&0x3FFFFFFF);if(lX4&lY4)return(lResult^0x80000000^lX8^lY8);if(lX4|lY4)return(lResult^0xC0000000^lX8^lY8);return(lResult^lX8^lY8)}function F(x,y,z){return(x&y)|((~x)&z)}function G(x,y,z){return(x&z)|(y&(~z))}function H(x,y,z){return(x^y^z)}function I(x,y,z){return(y^(x|(~z)))}function FF(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(F(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b)}function GG(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(G(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b)}function HH(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(H(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b)}function II(a,b,c,d,x,s,ac){a=AddUnsigned(a,AddUnsigned(AddUnsigned(I(b,c,d),x),ac));return AddUnsigned(RotateLeft(a,s),b)}function ConvertToWordArray(string){var lWordCount;var lMessageLength=string.length;var lNumberOfWords_temp1=lMessageLength+8;var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1%64))/64;var lNumberOfWords=(lNumberOfWords_temp2+1)*16;var lWordArray=Array(lNumberOfWords-1);var lBytePosition=0;var lByteCount=0;while(lByteCount<lMessageLength){lWordCount=(lByteCount-(lByteCount%4))/4;lBytePosition=(lByteCount%4)*8;lWordArray[lWordCount]=(lWordArray[lWordCount]|(string.charCodeAt(lByteCount)<<lBytePosition));lByteCount++}lWordCount=(lByteCount-(lByteCount%4))/4;lBytePosition=(lByteCount%4)*8;lWordArray[lWordCount]=lWordArray[lWordCount]|(0x80<<lBytePosition);lWordArray[lNumberOfWords-2]=lMessageLength<<3;lWordArray[lNumberOfWords-1]=lMessageLength>>>29;return lWordArray}function WordToHex(lValue){var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;for(lCount=0;lCount<=3;lCount++){lByte=(lValue>>>(lCount*8))&255;WordToHexValue_temp="0"+lByte.toString(16);WordToHexValue=WordToHexValue+WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2)}return WordToHexValue}var x=ConvertToWordArray(string);var k,AA,BB,CC,DD,a,b,c,d;var S11=7,S12=12,S13=17,S14=22;var S21=5,S22=9,S23=14,S24=20;var S31=4,S32=11,S33=16,S34=23;var S41=6,S42=10,S43=15,S44=21;a=0x67452301;b=0xEFCDAB89;c=0x98BADCFE;d=0x10325476;for(k=0;k<x.length;k+=16){AA=a;BB=b;CC=c;DD=d;a=FF(a,b,c,d,x[k+0],S11,0xD76AA478);d=FF(d,a,b,c,x[k+1],S12,0xE8C7B756);c=FF(c,d,a,b,x[k+2],S13,0x242070DB);b=FF(b,c,d,a,x[k+3],S14,0xC1BDCEEE);a=FF(a,b,c,d,x[k+4],S11,0xF57C0FAF);d=FF(d,a,b,c,x[k+5],S12,0x4787C62A);c=FF(c,d,a,b,x[k+6],S13,0xA8304613);b=FF(b,c,d,a,x[k+7],S14,0xFD469501);a=FF(a,b,c,d,x[k+8],S11,0x698098D8);d=FF(d,a,b,c,x[k+9],S12,0x8B44F7AF);c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);a=FF(a,b,c,d,x[k+12],S11,0x6B901122);d=FF(d,a,b,c,x[k+13],S12,0xFD987193);c=FF(c,d,a,b,x[k+14],S13,0xA679438E);b=FF(b,c,d,a,x[k+15],S14,0x49B40821);a=GG(a,b,c,d,x[k+1],S21,0xF61E2562);d=GG(d,a,b,c,x[k+6],S22,0xC040B340);c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);b=GG(b, c, d, a, x[k+0], S24, 0xE9B6C7AA);a=GG(a,b,c,d,x[k+5],S21,0xD62F105D);d=GG(d,a,b,c,x[k+10],S22,0x2441453);c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);b=GG(b,c,d,a,x[k+4],S24,0xE7D3FBC8);a=GG(a,b,c,d,x[k+9],S21,0x21E1CDE6);d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);c=GG(c,d,a,b,x[k+3],S23,0xF4D50D87);b=GG(b,c,d,a,x[k+8],S24,0x455A14ED);a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);d=GG(d,a,b,c,x[k+2],S22,0xFCEFA3F8);c=GG(c,d,a,b,x[k+7],S23,0x676F02D9);b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);a=HH(a,b,c,d,x[k+5],S31,0xFFFA3942);d=HH(d,a,b,c,x[k+8],S32,0x8771F681);c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);a=HH(a,b,c,d,x[k+1],S31,0xA4BEEA44);d=HH(d,a,b,c,x[k+4],S32,0x4BDECFA9);c=HH(c,d,a,b,x[k+7],S33,0xF6BB4B60);b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);d=HH(d,a,b,c,x[k+0],S32,0xEAA127FA);c=HH(c,d,a,b,x[k+3],S33,0xD4EF3085);b=HH(b,c,d,a,x[k+6],S34,0x4881D05);a=HH(a,b,c,d,x[k+9],S31,0xD9D4D039);d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);b=HH(b,c,d,a,x[k+2],S34,0xC4AC5665);a=II(a,b,c,d,x[k+0],S41,0xF4292244);d=II(d,a,b,c,x[k+7],S42,0x432AFF97);c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);b=II(b,c,d,a,x[k+5],S44,0xFC93A039);a=II(a,b,c,d,x[k+12],S41,0x655B59C3);d=II(d,a,b,c,x[k+3],S42,0x8F0CCC92);c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);b=II(b,c,d,a,x[k+1],S44,0x85845DD1);a=II(a,b,c,d,x[k+8],S41,0x6FA87E4F);d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);c=II(c,d,a,b,x[k+6],S43,0xA3014314);b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);a=II(a,b,c,d,x[k+4],S44,0xF7537E82);d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);c=II(c,d,a,b,x[k+2],S43,0x2AD7D2BB);b=II(b,c,d,a,x[k+9],S44,0xEB86D391);a=AddUnsigned(a,AA);b=AddUnsigned(b,BB);c=AddUnsigned(c,CC);d=AddUnsigned(d,DD)}return(WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d)).toLowerCase()}

    // ================= V41 核心网络逻辑 (绝对保留) =================
    function getHeaders() {
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": srEndpoints().referer,
            "Origin": srEndpoints().origin,
            "token": SESSION_TOKEN,
            "Authorization": "Bearer " + SESSION_TOKEN
        };
        if(typeof document !== 'undefined') {
            headers["Cookie"] = document.cookie;
            if (SESSION_ID_8989) headers["Cookie"] += `; JSESSIONID=${SESSION_ID_8989}`;
            headers["Cookie"] += `; token=${SESSION_TOKEN}; Authorization=${SESSION_TOKEN}`;
        }
        return headers;
    }

    // ★★★ V41 核心：支持明文密码，自动MD5 ★★★
    async function performAutoLogin(updateStatus) {
        const authConfig = JSON.parse(GM_getValue(STORAGE_KEY_AUTH, '{}'));
        const srConfig = authConfig.sagereal || {};
        if (!srConfig.jobNum || !srConfig.password) return false;

        updateStatus("身份验证中...");
        let finalPassword = srConfig.password.trim();
        if (finalPassword.length < 30) finalPassword = MD5(finalPassword);

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "POST", url: API_LOGIN, headers: { "Content-Type": "application/json" },
                data: JSON.stringify({ type: 2, jobNum: srConfig.jobNum, password: finalPassword }),
                onload: function(response) {
                    try {
                        const resJson = JSON.parse(response.responseText);
                        if (resJson.code === 1 && resJson.data && resJson.data.token) {
                            SESSION_TOKEN = resJson.data.token; resolve(true);
                        } else { updateStatus(`验证失败: ${resJson.msg}`); resolve(false); }
                    } catch (e) { resolve(false); }
                }, onerror: () => resolve(false)
            });
        });
    }

    async function selectSagerealHost(statusCb) {
        const candidates = [...SAGEREAL_HOSTS];
        const idx = candidates.indexOf(CURRENT_SR_HOST);
        if (idx > -1) { candidates.splice(idx, 1); candidates.unshift(CURRENT_SR_HOST); }
        for (let host of candidates) {
            if (statusCb) statusCb(`检测 ${host} 登录状态...`);
            let ok = false;
            await new Promise((done) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `${host}/CqSagereal/page/main`,
                    headers: { "Accept": "text/html" },
                    withCredentials: true,
                    onload: function(res) {
                        try {
                            const text = res.responseText || "";
                            const isLogin = text.includes("用户登录") || text.includes("login-box");
                            if (!isLogin) {
                                const hdr = res.responseHeaders || "";
                                const lines = hdr.split(/[\r\n]+/);
                                for (let line of lines) {
                                    if (line.toLowerCase().startsWith('set-cookie:')) {
                                        const raw = line.substring(11).trim();
                                        const m = raw.match(/JSESSIONID=([^;]+)/);
                                        if (m && m[1]) { SESSION_ID_8989 = m[1]; }
                                    }
                                }
                                CURRENT_SR_HOST = host;
                                GM_setValue(KEY_SR_HOST, CURRENT_SR_HOST);
                                ok = true;
                            }
                        } catch(e) {}
                        done();
                    },
                    onerror: () => done()
                });
            });
            if (ok) return true;
        }
        return false;
    }

    function openLoginSelection() {
        return new Promise((resolve) => {
            const choice = confirm("检测到未登录工作量系统。\n是否打开 172.16.1.77 登录界面？\n选择‘取消’则打开 work.cqdev.top");
            const url = choice ? "http://172.16.1.77:8989/CqSagereal/page/main" : "http://work.cqdev.top:8989/CqSagereal/page/main";
            GM_openInTab(url, { active: true });
            resolve();
        });
    }

    async function ensureSagerealSession(updateStatus) {
        const ok = await selectSagerealHost(updateStatus);
        if (!ok) {
            if (updateStatus) updateStatus("未登录，准备跳转登录页...");
            await openLoginSelection();
            return false;
        }
        const sr = srEndpoints();
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: sr.pageAdd,
                headers: getHeaders(),
                withCredentials: true,
                onload: function() { resolve(true); },
                onerror: () => resolve(false)
            });
        });
    }

    async function fetchProjectList(statusCb, forceRefresh = false) {
        if(!forceRefresh && PROJECT_LIST_CACHE.length > 0) return PROJECT_LIST_CACHE;
        await ensureSagerealSession(statusCb);
        statusCb("解析页面...");
        try {
            const sr = srEndpoints();
            const html = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET", url: sr.pageAdd, headers: getHeaders(), withCredentials: true,
                    onload: (res) => res.status === 200 ? resolve(res.responseText) : reject("HTTP " + res.status),
                    onerror: () => reject("Network Error")
                });
            });
            if(html.includes("login-box") || html.includes("请输入账号")) return null;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const select = doc.querySelector('select[name="projectId"]');
            const projects = [];
            if(select) {
                const options = select.querySelectorAll('option');
                options.forEach(opt => {
                    const val = opt.value;
                    const txt = opt.textContent;
                    if(val && val.length > 2 && txt) projects.push({ id: val, name: txt });
                });
            }
            PROJECT_LIST_CACHE = projects;
            return projects;
        } catch(e) { statusCb("获取失败: " + e); return []; }
    }

    // ★★★ V41 核心：提交逻辑 ★★★
    async function submitWorkLoad(data, statusCb) {
        const d1 = new Date(data.startDate); const d2 = new Date(data.endDate);
        if(d1.getFullYear() !== d2.getFullYear() || Math.floor((d1.getMonth()+3)/3) !== Math.floor((d2.getMonth()+3)/3)) {
            alert("❌ 错误：工作量不能跨季度填写！\n请拆分为两条记录。"); statusCb("跨季度错误"); return false;
        }
        await ensureSagerealSession(statusCb);
        statusCb("提交中...");
        const params = new URLSearchParams();
        params.append('action', 'addWorkLoad'); params.append('startDate', data.startDate); params.append('endDate', data.endDate);
        params.append('grade', data.grade); params.append('type', data.type); params.append('projectId', data.projectId);
        params.append('actualWorkHours', data.hours); params.append('bugNumber', data.bugNumber); params.append('content', data.content); params.append('note', data.note);
        params.append('token', SESSION_TOKEN);

        try {
            const resText = await new Promise((resolve, reject) => {
                const sr = srEndpoints();
                GM_xmlhttpRequest({
                    method: "POST", url: sr.apiData, headers: getHeaders(), data: params.toString(), withCredentials: true,
                    onload: (res) => res.status === 200 ? resolve(res.responseText) : reject(`HTTP ${res.status}`), onerror: () => reject("Network")
                });
            });
            try {
                const json = JSON.parse(resText);
                if(json.code === -1 && json.msg && json.msg.includes("已经存在")) {
                    alert(`⚠️ 提交失败：${json.msg}`); statusCb("重复提交"); return false;
                }
                if(json.code === 1) { saveSubmissionHistory(data); return true; }
                throw new Error(json.msg || "未知错误");
            } catch(e) {
                if(resText.includes("成功") || resText.length < 500) { saveSubmissionHistory(data); return true; }
                throw e;
            }
        } catch(e) {
            statusCb("重试中...");
            if(await performAutoLogin(statusCb) && await fetchProjectList(statusCb)) { return false; }
            statusCb("最终失败: " + e.message);
            return false;
        }
    }

    // ================= 新增功能：Mobiwire 薪资报表 =================
    let COOKIE_JAR = {};
    function updateCookies(headerStr) {
        if (!headerStr) return;
        const lines = headerStr.split(/[\r\n]+/);
        lines.forEach(line => {
            if (line.toLowerCase().startsWith('set-cookie:')) {
                const cookieRaw = line.substring(11).trim();
                const [keyVal] = cookieRaw.split(';');
                const [key, ...vals] = keyVal.split('=');
                if (key) COOKIE_JAR[key.trim()] = vals.join('=').trim();
            }
        });
    }
    function getMwCookieStr() { return Object.keys(COOKIE_JAR).map(k => `${k}=${COOKIE_JAR[k]}`).join('; '); }

    function mwRequest(stepName, opts) {
        return new Promise((resolve, reject) => {
            const headers = opts.headers || {};
            const cookie = getMwCookieStr();
            if (cookie) headers["Cookie"] = cookie;
            opts.redirect = 'manual';
            GM_xmlhttpRequest({
                method: opts.method || "GET", url: opts.url, data: opts.data, headers: headers,
                redirect: 'manual', responseType: "arraybuffer", anonymous: true,
                onload: (res) => {
                    updateCookies(res.responseHeaders);
                    let redirectUrl = null;
                    const lines = res.responseHeaders.split(/[\r\n]+/);
                    for (let line of lines) {
                        if (line.toLowerCase().startsWith('location:')) {
                            redirectUrl = line.substring(9).trim();
                            if (redirectUrl && !redirectUrl.startsWith('http')) redirectUrl = `${MW_URLS.base}/${redirectUrl}`;
                            break;
                        }
                    }
                    let text = "";
                    try { const decoder = new TextDecoder("gbk"); text = decoder.decode(res.response); } catch (e) { text = "解码失败"; }
                    resolve({ status: res.status, text: text, redirectUrl: redirectUrl });
                },
                onerror: (err) => reject(`[${stepName}] 网络错误`)
            });
        });
    }

    function request(stepName, opts) {
        return new Promise((resolve, reject) => {
            const headers = opts.headers || {};
            const cookie = getMwCookieStr();
            if (cookie) headers["Cookie"] = cookie;
            opts.redirect = 'manual';
            GM_xmlhttpRequest({
                method: opts.method || "GET",
                url: opts.url,
                data: opts.data,
                headers: headers,
                redirect: 'manual',
                responseType: "arraybuffer",
                anonymous: true,
                onload: (res) => {
                    updateCookies(res.responseHeaders);
                    let redirectUrl = null;
                    const lines = res.responseHeaders.split(/[\r\n]+/);
                    for (let line of lines) {
                        if (line.toLowerCase().startsWith('location:')) {
                            redirectUrl = line.substring(9).trim();
                            if (redirectUrl && !redirectUrl.startsWith('http')) {
                                redirectUrl = `${MW_URLS.base}/${redirectUrl}`;
                            }
                            break;
                        }
                    }
                    let text = "";
                    try { const decoder = new TextDecoder("gbk"); text = decoder.decode(res.response); } catch (e) { text = "解码失败"; }
                    resolve({ status: res.status, text: text, redirectUrl: redirectUrl });
                },
                onerror: (err) => reject(`[${stepName}] 网络错误`)
            });
        });
    }

    async function step1_init() { COOKIE_JAR = {}; try { await request("INIT", { url: MW_URLS.init }); return true; } catch (e) { return false; } }
    async function step2_login(empno, password) {
        const params = new URLSearchParams();
        params.append("screenwidth", "1536");
        params.append("empno", empno);
        params.append("image.x", "37");
        params.append("image.y", "26");
        params.append("Password", password);
        params.append("Type", "Salary");
        const res = await request("LOGIN", { method: "POST", url: MW_URLS.login, data: params.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded", "Referer": MW_URLS.init, "Origin": "https://www.mobiwire.com.cn" } });
        if (res.status === 302 || res.status === 301) { return res.redirectUrl; }
        return null;
    }
    async function step3_follow(url) { await request("FOLLOW", { url: url, headers: { "Referer": MW_URLS.login } }); return url; }
    async function step4_query(year, month, refererUrl) {
        const url = `${MW_URLS.query}?txt_year=${year}&txt_mon=${month}`;
        const res = await request("QUERY", { url: url, headers: { "Referer": refererUrl } });
        if (res.text.includes("用户登录") || res.text.length < 500) { return { error: "Session失效" }; }
        const parser = new DOMParser(); const doc = parser.parseFromString(res.text, "text/html");
        let monthData = {}; let hasData = false;
        const tds = doc.querySelectorAll('td');
        const excludeKeys = ["项目名称", "金额", "汇总部分", "明细部分", "工资项说明", "工资总额", "关闭", "薪资明细"];
        for (let i = 0; i < tds.length; i++) {
            let key = tds[i].innerText.replace(/\s+/g, '').trim();
            if (key.length > 15 || excludeKeys.some(k => key.includes(k)) || !key) continue;
            const nextTd = tds[i].nextElementSibling;
            if (nextTd) {
                const valStr = nextTd.innerText.replace(/,/g, '').trim();
                if (/^-?\d+(\.\d+)?$/.test(valStr)) {
                    const val = parseFloat(valStr);
                    if (key.includes("银行转账")) key = "实发工资(银行转账)";
                    if (key.includes("住房公积金")) key = "住房公积金";
                    if (key.includes("养老保险")) key = "养老保险";
                    if (key.includes("医疗保险")) key = "医疗保险";
                    if (key.includes("失业保险")) key = "失业保险";
                    if (key.includes("应发薪资")) key = "应发薪资";
                    monthData[key] = val; hasData = true;
                }
            }
        }
        return { hasData, data: monthData };
    }

// 修改并增强后的加班计算逻辑
function calcOT(schedule, clockIn, clockOut) {
    // 1. 如果没有下班打卡时间，直接返回0
    if (!clockOut || !clockOut.includes(':')) return 0;

    // 解析下班时间
    const outParts = clockOut.split(':');
    const outH = parseInt(outParts[0], 10) || 0;
    const outM = parseInt(outParts[1], 10) || 0;
    if (outH === 0 && outM === 0) return 0;
    const outTotalMin = outH * 60 + outM;

    // 2. 判断是否为“休息班”
    // 只要排班名称里包含"休息班"三个字，就走这里的逻辑
    if (schedule && schedule.includes("休息班")) {
        if (!clockIn || !clockIn.includes(':')) return 0;
        // 解析上班时间
        const inParts = clockIn.split(':');
        const inH = parseInt(inParts[0], 10) || 0;
        const inM = parseInt(inParts[1], 10) || 0;
        const inTotalMin = inH * 60 + inM;

        // 休息班加班时间 = 下班时间 - 上班时间
        if (outTotalMin > inTotalMin) {
            const ot = parseFloat(((outTotalMin - inTotalMin) / 60).toFixed(2));
            console.log(`[TranAI调试] 匹配到休息班! 日程:${schedule}, 上班:${clockIn}, 下班:${clockOut}, 计算加班:${ot}小时`);
            return ot;
        }
        return 0;
    }

    // 3. 常白班及其他默认情况（以 17:30 为基准）
    const standardMin = 17 * 60 + 30;
    if (outTotalMin > standardMin) {
        const ot = parseFloat(((outTotalMin - standardMin) / 60).toFixed(2));
        console.log(`[TranAI调试] 匹配到常白班! 日程:${schedule}, 下班:${clockOut}, 计算加班:${ot}小时`);
        return ot;
    }

    return 0;
}

    async function queryAttendanceByMonth(year, month) {
        const firstDay = `${year}-${month}-1`;
        const lastDayObj = new Date(year, month, 0);
        const lastDay = `${year}-${month}-${lastDayObj.getDate()}`;
        const params = new URLSearchParams();
        params.append("StartTime", firstDay.replace(/-/g, '/'));
        params.append("EndTime", lastDay.replace(/-/g, '/'));
        params.append("sel_yy", year);
        params.append("sel_mm", month);
        params.append("SearchType", "2");
        params.append("image.x", "15");
        params.append("image.y", "15");
        const res = await request(`ATTEND_${year}_${month}`, { method: "POST", url: MW_URLS.attend, data: params.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded", "Referer": MW_URLS.attend } });
        if (res.text.includes("用户登录") || res.text.length < 500) return { error: "Session失效" };
        const parser = new DOMParser();
        const doc = parser.parseFromString(res.text, "text/html");
        const rows = doc.querySelectorAll('tr.TableTr1, tr.TableTr2');
        let records = [];
        rows.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 12) {
                const date = tds[0].innerText.trim();
                const schedule = tds[1].innerText.trim();
                const shiftStart = tds[2].innerText.trim();
                const shiftEnd = tds[3].innerText.trim();
                const clockIn = tds[4].innerText.trim();
                const clockOut = tds[5].innerText.trim();
                let lateEarly = parseFloat(tds[6].innerText.trim()) || 0;
                const noPayAbsence = parseFloat(tds[7].innerText.trim()) || 0;
                const payAbsence = parseFloat(tds[8].innerText.trim()) || 0;
                const paidOT = parseFloat(tds[9].innerText.trim()) || 0;
                const actualHours = parseFloat(tds[10].innerText.trim()) || 0;
                const meal = parseFloat(tds[11].innerText.trim()) || 0;
                let cleanLate = lateEarly;
                if (lateEarly === 480) cleanLate = 0;
                const myOT = calcOT(schedule, clockIn, clockOut);
                records.push({ year, month, date, schedule, shiftStart, shiftEnd, clockIn, clockOut, lateEarly, cleanLate, noPayAbsence, payAbsence, paidOT, actualHours, meal, myOT });
            }
        });
        return { hasData: records.length > 0, records };
    }

    function summarize(records) {
        const count = records.length;
        if (count === 0) return null;
        const sums = { cleanLate: 0, noPayAbsence: 0, payAbsence: 0, paidOT: 0, actualHours: 0, meal: 0, myOT: 0 };
        records.forEach(r => { sums.cleanLate += r.cleanLate; sums.noPayAbsence += r.noPayAbsence; sums.payAbsence += r.payAbsence; sums.paidOT += r.paidOT; sums.actualHours += r.actualHours; sums.meal += r.meal; sums.myOT += r.myOT; });
        const avgs = {}; Object.keys(sums).forEach(k => { avgs[k] = (sums[k] / count).toFixed(2); sums[k] = sums[k].toFixed(2); });
        return { count, sums, avgs };
    }

    async function executeMobiwireFlow() {
        const logBox = document.getElementById('mw-log');
        const btn = document.getElementById('btn-load-salary');
        const auth = JSON.parse(GM_getValue(STORAGE_KEY_AUTH, '{}'));
        const mw = auth.mobiwire || {};
        const year = document.getElementById('mw-year').value;
        const start = parseInt(document.getElementById('mw-start').value);
        const end = parseInt(document.getElementById('mw-end').value);
        const ymStart = (document.getElementById('mw-ym-start') && document.getElementById('mw-ym-start').value) || '';
        const ymEnd = (document.getElementById('mw-ym-end') && document.getElementById('mw-ym-end').value) || '';
        if(!mw.emp || !mw.pwd) { alert("请先在【账号设置】中配置Mobiwire工号和密码"); return; }
        const log = (msg) => { logBox.innerHTML += `<div>${msg}</div>`; logBox.scrollTop = logBox.scrollHeight; };
        btn.disabled = true; logBox.innerHTML = "> 🚀 初始化...<br>";
        if (!await step1_init()) { btn.disabled = false; return; }
        const redirectUrl = await step2_login(mw.emp, mw.pwd);
        if (!redirectUrl) { log("❌ 登录失败"); btn.disabled = false; return; }
        const finalReferer = await step3_follow(redirectUrl);
        log("✅ 登录成功，开始采集全量数据...");
        let allMonthsData = []; let allKeys = new Set(["月份", "应发薪资", "实发工资(银行转账)"]);
        let nameSuffix = year;
        if (ymStart && ymEnd) {
            const partsS = ymStart.split('-');
            const partsE = ymEnd.split('-');
            const y1 = parseInt(partsS[0], 10); const m1 = parseInt(partsS[1], 10);
            const y2 = parseInt(partsE[0], 10); const m2 = parseInt(partsE[1], 10);
            if (isNaN(y1) || isNaN(m1) || isNaN(y2) || isNaN(m2)) { alert("起止年月无效"); btn.disabled = false; return; }
            if (y1 > y2 || (y1 === y2 && m1 > m2)) { alert("起止年月范围不合法"); btn.disabled = false; return; }
            nameSuffix = `${y1}${String(m1).padStart(2,'0')}-${y2}${String(m2).padStart(2,'0')}`;
            let y = y1; let m = m1;
            while (y < y2 || (y === y2 && m <= m2)) {
                log(`📡 扫描 ${y}-${m} 明细...`);
                const res = await step4_query(y, m, finalReferer);
                if(res.error) { log(`⚠️ ${y}-${m} Session失效`); }
                else if(res.hasData) {
                    res.data["月份"] = `${y}-${String(m).padStart(2,'0')}`;
                    Object.keys(res.data).forEach(k => allKeys.add(k));
                    allMonthsData.push(res.data);
                    const net = res.data["实发工资(银行转账)"] || 0;
                    log(`✅ ${y}-${m} 实发: ${net}`);
                } else {
                    log(`⚪ ${y}-${m}: 无数据`);
                }
                await new Promise(r => setTimeout(r, 400));
                m++;
                if (m > 12) { m = 1; y++; }
            }
        } else {
            for(let m=start; m<=end; m++) {
                log(`📡 扫描 ${m}月明细...`);
                const res = await step4_query(year, m, finalReferer);
                if(res.error) { log(`⚠️ ${m}月 Session失效`); continue; }
                if(res.hasData) {
                    res.data["月份"] = `${m}月`;
                    Object.keys(res.data).forEach(k => allKeys.add(k));
                    allMonthsData.push(res.data);
                    const net = res.data["实发工资(银行转账)"] || 0;
                    log(`✅ ${m}月 实发: ${net}`);
                } else {
                    log(`⚪ ${m}月: 无数据`);
                }
                await new Promise(r => setTimeout(r, 400));
            }
        }
        if (allMonthsData.length === 0) { log("❌ 没有查询到任何数据"); btn.disabled = false; return; }
        const headers = Array.from(allKeys);
        let csvContent = "\uFEFF" + headers.join(",") + "\n";
        allMonthsData.forEach(row => { const line = headers.map(h => row[h] !== undefined ? row[h] : 0); csvContent += line.join(",") + "\n"; });
        let totalRow = ["总计"], avgRow = ["平均"];
        for (let i = 1; i < headers.length; i++) {
            const key = headers[i]; let sum = 0; let count = 0;
            allMonthsData.forEach(row => { const val = row[key]; if (typeof val === 'number') { sum += val; count++; } });
            totalRow.push(sum.toFixed(2)); avgRow.push(count > 0 ? (sum / count).toFixed(2) : "0.00");
        }
        csvContent += totalRow.join(",") + "\n" + avgRow.join(",") + "\n";
        const blob = new Blob([csvContent], {type:'text/csv;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        log(`<a href="${url}" download="Mobiwire薪资_${nameSuffix}.csv" style="color:yellow">📥 下载薪资报表</a>`);
        btn.disabled = false;
    }

    async function executeAttendanceFlow() {
        const logBox = document.getElementById('att-log');
        const btn = document.getElementById('btn-load-attendance');
        if (btn && btn.disabled) return;
        const auth = JSON.parse(GM_getValue(STORAGE_KEY_AUTH, '{}'));
        const mw = auth.mobiwire || {};
        if(!mw.emp || !mw.pwd) { alert("请先在【账号设置】中配置Mobiwire工号和密码"); return; }
        const log = (msg) => { logBox.innerHTML += `<div>${msg}</div>`; logBox.scrollTop = logBox.scrollHeight; };
        btn.disabled = true; logBox.innerHTML = "> 🚀 初始化...<br>";
        if (!await step1_init()) { log("❌ 初始化失败"); btn.disabled = false; return; }
        const redirectUrl = await step2_login(mw.emp, mw.pwd);
        if (!redirectUrl) { log("❌ 登录失败"); btn.disabled = false; return; }
        await step3_follow(redirectUrl);
        const sVal = document.getElementById('att-start').value;
        const eVal = document.getElementById('att-end').value;
        const sDate = new Date(sVal);
        const eDate = new Date(eVal);
        if(isNaN(sDate.getTime()) || isNaN(eDate.getTime()) || sDate > eDate) { alert("日期范围无效"); btn.disabled = false; return; }
        let recordsAll = [];
        let totalMyOT = 0, totalCleanLateMin = 0, totalMeal = 0;
        let y = sDate.getFullYear(), m = sDate.getMonth() + 1;
        const endY = eDate.getFullYear(), endM = eDate.getMonth() + 1;
        while (y < endY || (y === endY && m <= endM)) {
            const res = await queryAttendanceByMonth(y, m);
            if (res.error) { log(`⚠️ ${y}-${m} Session失效`); }
            else if (res.hasData) {
                recordsAll.push(...res.records);
                const sums = summarize(res.records);
                const monthMyOT = parseFloat(sums.sums.myOT);
                const monthLateMin = parseFloat(sums.sums.cleanLate);
                const monthMeal = parseFloat(sums.sums.meal);
                totalMyOT += monthMyOT; totalCleanLateMin += monthLateMin; totalMeal += monthMeal;
                log(`📈 ${y}-${m} 月加班 ${monthMyOT}h | 净迟到 ${monthLateMin}分钟 | 餐补 ${monthMeal} 元`);
            }
            else { log(`⚪ ${y}-${m} 无数据`); }
            m++; if (m === 13) { m = 1; y++; }
            await new Promise(r => setTimeout(r, 400));
        }
        if (recordsAll.length === 0) { log("❌ 没有任何考勤数据"); btn.disabled = false; return; }
        const sumAll = summarize(recordsAll);
        log(`🏁 累计加班 ${totalMyOT.toFixed(2)}h | 累计净迟到 ${totalCleanLateMin}分钟 | 累计餐补 ${totalMeal} 元`);

        // 生成CSV数据
        const monthGroups = {};
        recordsAll.forEach(r => { const k = `${r.year}-${String(r.month).padStart(2,'0')}`; (monthGroups[k] = monthGroups[k] || []).push(r); });
        const headersMonthly = ["月份","天数","净迟到","旷工不计薪","旷工计薪","加班计薪","实际时长","餐补","我的加班"];
        const headersDaily = ["年份","月份","日期","班次","班次起","班次止","打卡上班","打卡下班","迟到早退","净迟到","旷工不计薪","旷工计薪","加班计薪","实际时长","餐补","我的加班"];
        let csv = "\uFEFF";
        csv += ["总览","记录数",sumAll.count,"净迟到",sumAll.sums.cleanLate,"旷工不计薪",sumAll.sums.noPayAbsence,"旷工计薪",sumAll.sums.payAbsence,"加班计薪",sumAll.sums.paidOT,"实际时长",sumAll.sums.actualHours,"餐补",sumAll.sums.meal,"我的加班",sumAll.sums.myOT].join(",") + "\n";
        csv += ["平均","-","-","净迟到",sumAll.avgs.cleanLate,"旷工不计薪",sumAll.avgs.noPayAbsence,"旷工计薪",sumAll.avgs.payAbsence,"加班计薪",sumAll.avgs.paidOT,"实际时长",sumAll.avgs.actualHours,"餐补",sumAll.avgs.meal,"我的加班",sumAll.avgs.myOT].join(",") + "\n";
        csv += headersMonthly.join(",") + "\n";
        Object.keys(monthGroups).sort().forEach(k => {
            const s = summarize(monthGroups[k]);
            csv += [k, s.count, s.sums.cleanLate, s.sums.noPayAbsence, s.sums.payAbsence, s.sums.paidOT, s.sums.actualHours, s.sums.meal, s.sums.myOT].join(",") + "\n";
        });
        csv += headersDaily.join(",") + "\n";
        recordsAll.forEach(r => {
            csv += [r.year, r.month, r.date, r.schedule, r.shiftStart, r.shiftEnd, r.clockIn, r.clockOut, r.lateEarly, r.cleanLate, r.noPayAbsence, r.payAbsence, r.paidOT, r.actualHours, r.meal, r.myOT].join(",") + "\n";
        });

        // 在界面上显示表格预览和下载按钮
        const nameStart = `${sDate.getFullYear()}${String(sDate.getMonth()+1).padStart(2,'0')}`;
        const nameEnd = `${eDate.getFullYear()}${String(eDate.getMonth()+1).padStart(2,'0')}`;
        const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
        const url = URL.createObjectURL(blob);

        // 创建表格预览区域
        let tableHtml = `<div style="margin-top:15px; padding:10px; background:#1a1a1a; border-radius:4px; border:1px solid #444;">
            <div style="color: var(--accent); font-weight:bold; margin-bottom:10px;">📊 考勤统计汇总</div>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-bottom:10px;">
                <div style="text-align:center; padding:8px; background:#222; border-radius:4px;">
                    <div style="color:#888; font-size:12px;">累计加班</div>
                    <div style="color: var(--accent); font-size:18px; font-weight:bold;">${totalMyOT.toFixed(2)}h</div>
                </div>
                <div style="text-align:center; padding:8px; background:#222; border-radius:4px;">
                    <div style="color:#888; font-size:12px;">累计净迟到</div>
                    <div style="color: var(--accent); font-size:18px; font-weight:bold;">${totalCleanLateMin}分钟</div>
                </div>
                <div style="text-align:center; padding:8px; background:#222; border-radius:4px;">
                    <div style="color:#888; font-size:12px;">累计餐补</div>
                    <div style="color: var(--accent); font-size:18px; font-weight:bold;">${totalMeal}元</div>
                </div>
            </div>
            <div style="max-height:200px; overflow-y:auto; margin-bottom:10px;">
                <table style="width:100%; border-collapse:collapse; font-size:12px;">
                    <thead>
                        <tr style="background:#222; color: var(--accent);">
                            <th style="padding:6px; border:1px solid #444; text-align:left;">月份</th>
                            <th style="padding:6px; border:1px solid #444; text-align:right;">天数</th>
                            <th style="padding:6px; border:1px solid #444; text-align:right;">净迟到</th>
                            <th style="padding:6px; border:1px solid #444; text-align:right;">我的加班</th>
                        </tr>
                    </thead>
                    <tbody>`;
        Object.keys(monthGroups).sort().forEach(k => {
            const s = summarize(monthGroups[k]);
            tableHtml += `<tr style="border-bottom:1px solid #333;">
                <td style="padding:6px; color:#ccc;">${k}</td>
                <td style="padding:6px; text-align:right; color:#ccc;">${s.count}</td>
                <td style="padding:6px; text-align:right; color:#ccc;">${s.sums.cleanLate}分钟</td>
                <td style="padding:6px; text-align:right; color:#ccc;">${s.sums.myOT}h</td>
            </tr>`;
        });
        tableHtml += `</tbody></table></div>
            <button id="btn-download-attendance" class="action-btn" style="width:100%; margin-top:10px;">📥 下载考勤统计表格</button>
        </div>`;

        log(tableHtml);

        // 绑定下载按钮
        setTimeout(() => {
            const downloadBtn = document.getElementById('btn-download-attendance');
            if (downloadBtn) {
                downloadBtn.onclick = () => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Mobiwire考勤_${nameStart}-${nameEnd}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    log("✅ 考勤统计表格已下载");
                };
            }
        }, 100);

        btn.disabled = false;
    }

    // ================= 辅助逻辑 =================
    function checkAuthReady() { const auth = JSON.parse(GM_getValue(STORAGE_KEY_AUTH, '{}')); return auth.sagereal && auth.sagereal.jobNum && auth.sagereal.password; }
    function saveSubmissionHistory(data) {
        const list = JSON.parse(GM_getValue(STORAGE_KEY_SUBMIT_HISTORY, '[]'));
        list.unshift({ date: new Date().toISOString(), workDate: data.startDate, hours: parseFloat(data.hours), content: data.content, bug: data.bugNumber });
        GM_setValue(STORAGE_KEY_SUBMIT_HISTORY, JSON.stringify(list.slice(0, 200)));
    }
    function polarToCartesian(centerX, centerY, radius, angleInDegrees) { var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0; return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) }; }
    function describeArc(x, y, radius, startAngle, endAngle) { var start = polarToCartesian(x, y, radius, endAngle); var end = polarToCartesian(x, y, radius, startAngle); var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"; return ["M", x, y, "L", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" "); }
    async function fetchJiraInfo(bugId, source, statusCb) {
        const baseUrl = source === 'EX' ? JIRA_EXTERNAL : JIRA_INTERNAL;
        const loginUrl = source === 'EX' ? URL_LOGIN_EXT : URL_LOGIN_INT;
        const apiUrl = `${baseUrl}/rest/api/2/issue/${bugId}`;
        statusCb(`连接 ${source === 'EX' ? 'Jira外网' : 'Jira内网'}...`);
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: apiUrl,
                    headers: { "Accept": "application/json" },
                    onload: (res) => res.status === 200 ? resolve(res.responseText) : reject(`HTTP ${res.status}`),
                    onerror: () => reject("网络错误")
                });
            });

            const json = JSON.parse(response);
            let summary = json.fields.summary || "";
            let jiraProject = json.fields.project ? json.fields.project.name : "";
            if (!jiraProject && bugId.includes("-")) jiraProject = bugId.split("-")[0];

            // ★★★ V42.4 新增：自动获取bug处理的开始和结束日期 ★★★
            if (json.fields.created) {
                const startDate = json.fields.created.split('T')[0];
                document.getElementById('add-start').value = startDate;
            }
            const endDate = json.fields.resolutiondate || json.fields.updated;
            if (endDate) {
                document.getElementById('add-end').value = endDate.split('T')[0];
            }

            // ★★★ V42.4 修复：增强项目模糊匹配逻辑（双向匹配+前缀匹配） ★★★
            if (jiraProject) {
                const jiraProjUpper = jiraProject.toUpperCase();
                let match = PROJECT_LIST_CACHE.find(p =>
                    p.name.toUpperCase().includes(jiraProjUpper) ||
                    jiraProjUpper.includes(p.name.toUpperCase())
                );

                // 如果双向包含匹配失败，尝试前缀匹配
                if (!match) {
                    const prefixMatch = jiraProjUpper.match(/^([A-Z]+[0-9]*)/);
                    if (prefixMatch && prefixMatch[1].length >= 3) {
                        const prefix = prefixMatch[1];
                        match = PROJECT_LIST_CACHE.find(p => p.name.toUpperCase().startsWith(prefix));
                    }
                }

                if (match) {
                    document.getElementById('add-proj-search').value = match.name;
                    document.getElementById('add-proj-id').value = match.id;
                    statusCb(`获取成功 | 项目已匹配: ${match.name}`);
                } else {
                    statusCb(`获取成功 | ❌ 未找到匹配项目: ${jiraProject}`);
                }
            } else {
                statusCb("获取成功");
            }

            return { summary, project: jiraProject };
        } catch(e) {
            // 如果REST API失败，回退到HTML解析方式（兼容旧逻辑）
            try {
                const html = await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: `${baseUrl}/browse/${bugId}`,
                        onload: (res) => res.status === 200 ? resolve(res.responseText) : reject("HTTP " + res.status),
                        onerror: () => reject("网络错误")
                    });
                });
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                let rawTitle = doc.title || "";
                const projEl = doc.getElementById("customfield_14205-val");
                let jiraProject = projEl ? projEl.innerText.trim() : "";
                if(rawTitle) {
                    const suffixIndex = rawTitle.lastIndexOf(" - Transsion");
                    if (suffixIndex > -1) rawTitle = rawTitle.substring(0, suffixIndex);
                    const prefixRegex = /^$[.*?]$\s*/;
                    const summary = rawTitle.replace(prefixRegex, "").trim();
                    if (!jiraProject && bugId.includes("-")) jiraProject = bugId.split("-")[0];

                    // ★★★ V42.4 修复：HTML解析方式也支持项目模糊匹配 ★★★
                    if (jiraProject) {
                        const jiraProjUpper = jiraProject.toUpperCase();
                        let match = PROJECT_LIST_CACHE.find(p =>
                            p.name.toUpperCase().includes(jiraProjUpper) ||
                            jiraProjUpper.includes(p.name.toUpperCase())
                        );

                        if (!match) {
                            const prefixMatch = jiraProjUpper.match(/^([A-Z]+[0-9]*)/);
                            if (prefixMatch && prefixMatch[1].length >= 3) {
                                const prefix = prefixMatch[1];
                                match = PROJECT_LIST_CACHE.find(p => p.name.toUpperCase().startsWith(prefix));
                            }
                        }

                        if (match) {
                            document.getElementById('add-proj-search').value = match.name;
                            document.getElementById('add-proj-id').value = match.id;
                            statusCb(`获取成功（HTML解析）| 项目已匹配: ${match.name}`);
                        } else {
                            statusCb(`获取成功（HTML解析）| ❌ 未找到匹配项目: ${jiraProject}`);
                        }
                    } else {
                        statusCb("获取成功（HTML解析）");
                    }

                    return { summary, project: jiraProject };
                } else throw new Error("解析失败");
            } catch(e2) {
                statusCb("查询失败");
                if(confirm(`❌ 无法从 ${source === 'EX' ? 'Jira外网' : 'Jira内网'} 获取信息。\n可能未登录，是否跳转登录页？`)) {
                    GM_openInTab(loginUrl, { active: true });
                }
                return null;
            }
        }
    }

    // ================= 界面构建 (V42新版样式) =================
    const css = `
        #csgo-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--overlayBg); z-index: 2147483647; display: none; justify-content: center; align-items: center; font-family: 'Microsoft YaHei', sans-serif; backdrop-filter: blur(var(--overlayBlur)); opacity: 0; transition: opacity 0.2s; pointer-events: none; user-select: none; --accent: #eab543; --accentFill: rgba(234, 181, 67, 0.8); --accentSoft: rgba(234, 181, 67, 0.1); --overlayBg: rgba(18, 18, 18, 0.95); --overlayBlur: 5px; --panelBg: rgba(30, 30, 30, 0.98); --panelText: #ddd; --modalBg: rgba(30,30,30,0.95); --modalBlur: 10px; --cardBg: #1a1a1a; --cardItemBg: #222; --cardHoverBg: #282828; --cardBorder: #444; }
        #csgo-overlay.active { opacity: 1; pointer-events: auto; display: flex; }
        #csgo-overlay.theme-gold { --accent: #eab543; --accentFill: rgba(234, 181, 67, 0.8); --accentSoft: rgba(234, 181, 67, 0.1); --overlayBg: rgba(18,18,18,0.92); --overlayBlur: 6px; --panelBg: rgba(28,28,28,0.98); --panelText: #ddd; --modalBg: rgba(30,30,30,0.95); --modalBlur: 10px; --cardBg:#1a1a1a; --cardItemBg:#222; --cardHoverBg:#282828; --cardBorder:#444; }
        #csgo-overlay.theme-blue { --accent: #3b82f6; --accentFill: rgba(59, 130, 246, 0.8); --accentSoft: rgba(59, 130, 246, 0.1); --overlayBg: rgba(17,22,35,0.9); --overlayBlur: 7px; --panelBg: rgba(24,28,40,0.98); --panelText: #e6f0ff; --modalBg: rgba(24,28,40,0.95); --modalBlur: 10px; --cardBg:#1c2333; --cardItemBg:#20283a; --cardHoverBg:#273046; --cardBorder:#3b4a6a; }
        #csgo-overlay.theme-green { --accent: #22c55e; --accentFill: rgba(34, 197, 94, 0.8); --accentSoft: rgba(34, 197, 94, 0.1); --overlayBg: rgba(16,28,22,0.9); --overlayBlur: 6px; --panelBg: rgba(22,30,26,0.98); --panelText: #e8fff0; --modalBg: rgba(22,30,26,0.95); --modalBlur: 10px; --cardBg:#18241e; --cardItemBg:#1d2a24; --cardHoverBg:#223129; --cardBorder:#3a4a40; }
        #csgo-overlay.theme-purple { --accent: #8b5cf6; --accentFill: rgba(139, 92, 246, 0.8); --accentSoft: rgba(139, 92, 246, 0.1); --overlayBg: rgba(24,16,36,0.9); --overlayBlur: 7px; --panelBg: rgba(30,22,40,0.98); --panelText: #f0eaff; --modalBg: rgba(30,22,40,0.95); --modalBlur: 10px; --cardBg:#221a33; --cardItemBg:#271f3b; --cardHoverBg:#2e2446; --cardBorder:#4a3a72; }
        #csgo-overlay.theme-red { --accent: #ef4444; --accentFill: rgba(239, 68, 68, 0.8); --accentSoft: rgba(239, 68, 68, 0.1); --overlayBg: rgba(36,16,16,0.9); --overlayBlur: 6px; --panelBg: rgba(40,22,22,0.98); --panelText: #ffecec; --modalBg: rgba(40,22,22,0.95); --modalBlur: 10px; --cardBg:#221616; --cardItemBg:#271a1a; --cardHoverBg:#2e1f1f; --cardBorder:#6a3a3a; }
        #csgo-overlay.theme-cream { --accent: #c79a4a; --accentFill: rgba(199,154,74,0.20); --accentSoft: rgba(199,154,74,0.10); --overlayBg: rgba(242, 238, 230, 0.82); --overlayBlur: 4px; --panelBg: rgba(255,255,255,0.94); --panelText: #222; --modalBg: rgba(255,255,255,0.94); --modalBlur: 6px; --cardBg:#f4f1ea; --cardItemBg:#f1eee7; --cardHoverBg:#ebe7df; --cardBorder:#d7cfc1; }
        #csgo-overlay.theme-mint { --accent: #2ecc71; --accentFill: rgba(46, 204, 113, 0.8); --accentSoft: rgba(46, 204, 113, 0.12); --overlayBg: rgba(18, 26, 22, 0.9); --overlayBlur: 6px; --panelBg: rgba(24, 32, 28, 0.98); --panelText: #e9fff1; --modalBg: rgba(24,32,28,0.95); --modalBlur: 10px; --cardBg:#1a241f; --cardItemBg:#1f2a24; --cardHoverBg:#243129; --cardBorder:#3a4a40; }
        #csgo-overlay.theme-teal { --accent: #14b8a6; --accentFill: rgba(20, 184, 166, 0.8); --accentSoft: rgba(20, 184, 166, 0.12); --overlayBg: rgba(14, 24, 22, 0.9); --overlayBlur: 6px; --panelBg: rgba(20, 28, 26, 0.98); --panelText: #e6fffb; --modalBg: rgba(20,28,26,0.95); --modalBlur: 10px; --cardBg:#172422; --cardItemBg:#1b2a28; --cardHoverBg:#1f302e; --cardBorder:#375a56; }
        #csgo-overlay.theme-olive { --accent: #6b8e23; --accentFill: rgba(107, 142, 35, 0.8); --accentSoft: rgba(107, 142, 35, 0.12); --overlayBg: rgba(20, 24, 16, 0.9); --overlayBlur: 6px; --panelBg: rgba(26, 30, 22, 0.98); --panelText: #eef5e3; --modalBg: rgba(26,30,22,0.95); --modalBlur: 10px; --cardBg:#1c2216; --cardItemBg:#20281a; --cardHoverBg:#252f1f; --cardBorder:#4a5a36; }
        #csgo-overlay.theme-forest { --accent: #14532d; --accentFill: rgba(20, 83, 45, 0.8); --accentSoft: rgba(20, 83, 45, 0.12); --overlayBg: rgba(12, 18, 14, 0.9); --overlayBlur: 7px; --panelBg: rgba(18, 24, 20, 0.98); --panelText: #e6fff0; --modalBg: rgba(18,24,20,0.95); --modalBlur: 10px; --cardBg:#141c16; --cardItemBg:#172119; --cardHoverBg:#1b271e; --cardBorder:#365a40; }
        #csgo-overlay.theme-slate { --accent: #64748b; --accentFill: rgba(100, 116, 139, 0.8); --accentSoft: rgba(100, 116, 139, 0.12); --overlayBg: rgba(15, 18, 22, 0.9); --overlayBlur: 7px; --panelBg: rgba(20, 24, 28, 0.98); --panelText: #eef2f7; --modalBg: rgba(20,24,28,0.95); --modalBlur: 10px; --cardBg:#1a1e24; --cardItemBg:#1f232a; --cardHoverBg:#242a32; --cardBorder:#3a4a5a; }
        #csgo-overlay.theme-cyan { --accent: #06b6d4; --accentFill: rgba(6, 182, 212, 0.8); --accentSoft: rgba(6, 182, 212, 0.12); --overlayBg: rgba(12, 24, 28, 0.9); --overlayBlur: 7px; --panelBg: rgba(18, 26, 30, 0.98); --panelText: #e8fbff; --modalBg: rgba(18,26,30,0.95); --modalBlur: 10px; --cardBg:#162228; --cardItemBg:#1a2830; --cardHoverBg:#1f3038; --cardBorder:#2e5a6a; }
        #csgo-overlay.theme-amber { --accent: #f59e0b; --accentFill: rgba(245, 158, 11, 0.8); --accentSoft: rgba(245, 158, 11, 0.12); --overlayBg: rgba(24, 18, 10, 0.9); --overlayBlur: 6px; --panelBg: rgba(30, 24, 16, 0.98); --panelText: #fff5e6; --modalBg: rgba(30,24,16,0.95); --modalBlur: 10px; --cardBg:#1e1a14; --cardItemBg:#221e17; --cardHoverBg:#27231c; --cardBorder:#5a4a36; }
        #csgo-overlay.theme-neutral { --accent: #9ca3af; --accentFill: rgba(156, 163, 175, 0.8); --accentSoft: rgba(156, 163, 175, 0.12); --overlayBg: rgba(20, 20, 20, 0.92); --overlayBlur: 6px; --panelBg: rgba(26, 26, 26, 0.98); --panelText: #ddd; --modalBg: rgba(26,26,26,0.95); --modalBlur: 10px; --cardBg:#1c1c1c; --cardItemBg:#212121; --cardHoverBg:#262626; --cardBorder:#4a4a4a; }
        #csgo-overlay.theme-greige { --accent: #b8a58c; --accentFill: rgba(184, 165, 140, 0.25); --accentSoft: rgba(184, 165, 140, 0.12); --overlayBg: rgba(245, 242, 236, 0.85); --overlayBlur: 4px; --panelBg: rgba(255,255,255,0.96); --panelText: #222; --modalBg: rgba(255,255,255,0.96); --modalBlur: 6px; --cardBg:#f5f3ee; --cardItemBg:#f0eee8; --cardHoverBg:#eae7e1; --cardBorder:#d6cec0; }
        #csgo-overlay.theme-emerald { --accent: #10b981; --accentFill: rgba(16, 185, 129, 0.8); --accentSoft: rgba(16, 185, 129, 0.12); --overlayBg: rgba(16, 24, 20, 0.92); --overlayBlur: 7px; --panelBg: rgba(22, 30, 26, 0.98); --panelText: #e8fff1; --modalBg: rgba(22,30,26,0.95); --modalBlur: 10px; --cardBg:#18231f; --cardItemBg:#1d2924; --cardHoverBg:#223029; --cardBorder:#355a48; }
        #csgo-overlay.theme-navy { --accent: #1e40af; --accentFill: rgba(30, 64, 175, 0.8); --accentSoft: rgba(30, 64, 175, 0.12); --overlayBg: rgba(17, 22, 35, 0.92); --overlayBlur: 7px; --panelBg: rgba(22, 28, 40, 0.98); --panelText: #e6f0ff; --modalBg: rgba(22,28,40,0.95); --modalBlur: 10px; --cardBg:#1b2336; --cardItemBg:#1f2940; --cardHoverBg:#242f49; --cardBorder:#3a4a6a; }
        #csgo-overlay.theme-mauve { --accent: #7c4dff; --accentFill: rgba(124, 77, 255, 0.8); --accentSoft: rgba(124, 77, 255, 0.12); --overlayBg: rgba(26, 20, 40, 0.92); --overlayBlur: 7px; --panelBg: rgba(30, 24, 48, 0.98); --panelText: #f0ecff; --modalBg: rgba(30,24,48,0.95); --modalBlur: 10px; --cardBg:#211a33; --cardItemBg:#251f3b; --cardHoverBg:#2c2546; --cardBorder:#4a3a72; }
        #csgo-overlay.theme-seasalt { --accent: #8ecae6; --accentFill: rgba(142, 202, 230, 0.22); --accentSoft: rgba(142, 202, 230, 0.10); --overlayBg: rgba(242, 247, 252, 0.85); --overlayBlur: 4px; --panelBg: rgba(255,255,255,0.96); --panelText: #222; --modalBg: rgba(255,255,255,0.96); --modalBlur: 6px; --cardBg:#f2f6fb; --cardItemBg:#eef3f9; --cardHoverBg:#e7eff7; --cardBorder:#c8d7e6; }
        #csgo-overlay.theme-graphite { --accent: #8d8d8d; --accentFill: rgba(141, 141, 141, 0.8); --accentSoft: rgba(141, 141, 141, 0.12); --overlayBg: rgba(14, 14, 14, 0.92); --overlayBlur: 6px; --panelBg: rgba(20, 20, 20, 0.98); --panelText: #dcdcdc; --modalBg: rgba(20,20,20,0.95); --modalBlur: 10px; --cardBg:#141414; --cardItemBg:#1a1a1a; --cardHoverBg:#202020; --cardBorder:#3a3a3a; }
        #csgo-overlay.theme-dawn { --accent: #ff8fb1; --accentFill: rgba(255, 143, 177, 0.22); --accentSoft: rgba(255, 143, 177, 0.10); --overlayBg: rgba(255, 244, 248, 0.85); --overlayBlur: 4px; --panelBg: rgba(255,255,255,0.96); --panelText: #222; --modalBg: rgba(255,255,255,0.96); --modalBlur: 6px; --cardBg:#fbf3f6; --cardItemBg:#f7eef2; --cardHoverBg:#f1e6ec; --cardBorder:#eecad7; }
        .csgo-container { display: flex; gap: 60px; align-items: center; flex-direction: row; }
        .left-section { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .wheel-wrapper { position: relative; width: 420px; height: 420px; border-radius: 50%; z-index: 20; transition: transform 0.1s cubic-bezier(0.1, 0.7, 1.0, 0.1); }
        .wheel-click-anim { transform: scale(0.95); }
        .wheel-sensor { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; cursor: crosshair; z-index: 30; }
        .wheel-visual { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle, rgba(50,50,50,1) 30%, rgba(20,20,20,0.8) 100%); border: 4px solid rgba(255, 255, 255, 0.1); box-shadow: 0 0 30px rgba(0,0,0,0.8); pointer-events: none; }
        .svg-sector { fill: transparent; stroke: rgba(255,255,255,0.05); stroke-width: 1; transition: all 0.15s ease; cursor: pointer; }
        .svg-sector.active { fill: var(--accentFill); stroke: #fff; stroke-width: 2px; }
        .svg-sector.drag-target { fill: rgba(0, 255, 255, 0.5) !important; stroke: #00ffff !important; stroke-width: 3px; }
        .wedge-label { position: absolute; color: #888; text-align: center; pointer-events: none; z-index: 10; transition: 0.2s; font-size: 14px; width: 80px; height: 40px; display:flex; flex-direction:column; justify-content:center; align-items:center; }
        .wedge-label.active { color: #fff; font-weight: bold; transform: scale(1.1); text-shadow: 0 0 10px var(--accent); }
        .wedge-label.drag-target { color: #00ffff !important; font-weight: bold; transform: scale(1.2); text-shadow: 0 0 10px #00ffff; }
        .center-hub { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; border-radius: 50%; background: #222; border: 3px solid var(--accent); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 40; box-shadow: 0 0 20px rgba(0,0,0,0.5); pointer-events: auto; cursor: pointer; transition: background 0.2s; }
        .center-hub:hover { background: #333; }
        .hub-text { color: var(--accent); font-weight: bold; font-size: 16px; }
        .info-panel { width: 600px; height: 700px; background: var(--panelBg); border-left: 4px solid var(--accent); padding: 25px 30px; color: var(--panelText); box-shadow: 10px 10px 40px rgba(0,0,0,0.6); z-index: 50; display: flex; flex-direction: column; position: relative; overflow: hidden; pointer-events: auto !important; border-radius: 0 8px 8px 0; }
        .view-container { display: flex; flex-direction: column; height: 100%; transition: opacity 0.2s; width: 100%; overflow-y: auto; }
        .view-container.hidden { display: none; opacity: 0; }
        .panel-header { font-size: 24px; color: var(--accent); margin-bottom: 20px; border-bottom: 1px solid var(--cardBorder); padding-bottom: 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        .tab-bar { display:flex; gap:8px; margin-bottom:10px; justify-content:center; align-items:center; }
        .tab-btn { background:#333; border:1px solid var(--cardBorder); color:#aaa; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:13px; }
        .tab-btn.active { background:var(--accent); color:#000; border-color:var(--accent); }
        /* 1. 普通输入框保持不变 */
        .cs-input, .add-input, .add-textarea { background: #111; border: 1px solid #444; color: #fff; padding: 10px; border-radius: 4px; font-family: 'Microsoft YaHei'; cursor: text !important; width: 100%; color-scheme: dark; font-size: 14px; box-sizing: border-box; }
        /* 2. 下拉框单独设置（减小内边距，防止文字被切） */
        .add-select { background: #111; border: 1px solid #444; color: #fff; padding: 5px; border-radius: 4px; font-family: 'Microsoft YaHei'; cursor: pointer; width: 100%; color-scheme: dark; font-size: 14px; box-sizing: border-box; outline: none; }
        .cs-input:focus, .add-input:focus, .add-select:focus { border-color: var(--accent); outline: none; background: #000; }
        .add-input:disabled, .add-select:disabled, .add-input[readonly] { background: #222; color: #777; border-color: #333; cursor: not-allowed !important; }
        .add-form { display: flex; flex-direction: column; gap: 15px; flex: 1; overflow-y: auto; padding-right: 5px; }
        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-label { font-size: 13px; color: #aaa; font-weight: bold; }
        .form-row { display: flex; gap: 15px; }
        .add-textarea { height: 80px; resize: none; }
        .bug-input-wrapper { display: flex; gap: 8px; }
        .bug-fetch-btn { background: #27ae60; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; padding: 0 15px; display: flex; align-items: center; white-space: nowrap; transition: 0.2s; font-weight: bold; }
        .bug-fetch-btn:hover { background: #2ecc71; }
        .bug-fetch-btn.ex { background: #e67e22; }
        .bug-fetch-btn.ex:hover { background: #d35400; }
        .action-btn { width: 100%; background: var(--accent); color: #000; border: none; padding: 12px; font-weight: bold; font-size: 16px; cursor: pointer; border-radius: 4px; margin-top: 15px; transition: 0.2s; }
        .action-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .sub-btn { background: transparent; border: 1px solid #555; color: #aaa; margin-top: 10px; font-size: 13px; padding: 8px; width: 100%; cursor: pointer; border-radius: 4px; }
        .sub-btn:hover { border-color: var(--accent); color: var(--accent); }
        .stats-box { background: var(--cardBg); padding: 20px; border: 1px solid var(--cardBorder); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 6px; }
        .stat-item { text-align: center; flex: 1; }
        .stat-val { font-size: 32px; color: var(--accent); font-weight: bold; }
        .stat-lbl { font-size: 14px; color: #888; }
        .grade-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; background: var(--cardBg); padding: 15px; border-radius: 6px; }
        .grade-item { background: var(--cardItemBg); border: 1px solid var(--cardBorder); padding: 10px; text-align: center; border-radius: 4px; }
        .grade-item.high-tier { border-color: var(--accent); background: var(--accentSoft); }
        .g-val { font-size: 20px; font-weight: bold; color: #eee; }
        .high-tier .g-val { color: var(--accent); }
        .inventory-list { display: flex; flex-direction: column; gap: 10px; overflow-y:auto; max-height:450px; }
        .inv-item { background: var(--cardItemBg); border: 1px solid var(--cardBorder); padding: 12px; border-radius: 4px; display: flex; align-items: center; transition: 0.2s; }
        .inv-item:hover { border-color: var(--accent); background: var(--cardHoverBg); }
        .inv-del { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: #e74c3c; cursor: pointer; font-size: 16px; margin-left: 10px; border-radius: 4px; }
        .inv-del:hover { background: rgba(231, 76, 60, 0.2); }
        .proj-search-wrapper { position: relative; display: flex; gap: 5px; }
        .proj-dropdown { position: absolute; top: 100%; left: 0; width: 100%; max-height: 250px; overflow-y: auto; background: var(--cardItemBg); border: 1px solid var(--cardBorder); z-index: 100; display: none; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
        /* 增加了 word-break 和 white-space 属性 */
        .proj-option { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #333; font-size: 14px; transition: 0.1s; white-space: normal; word-break: break-word; line-height: 1.4; }
        .proj-option:hover { background: var(--accent); color: #000; }
        .proj-refresh-btn { width: 35px; background: #333; border: 1px solid #444; color: var(--accent); cursor: pointer; display:flex; align-items:center; justify-content:center; font-size:16px; border-radius:4px; }
        .proj-refresh-btn:hover { background: #444; }
        .manual-btn { margin-top: 20px; background: #333; color: #888; border: 1px solid var(--cardBorder); padding: 8px 20px; border-radius: 20px; cursor: pointer; font-size: 12px; transition: 0.2s; display: flex; align-items: center; gap: 5px; }
        .manual-btn:hover { color: var(--accent); border-color: var(--accent); background: #222; }
        #manual-modal { position: fixed; top: 10%; right: 10%; width: 600px; max-height: 80vh; background: var(--modalBg); border: 2px solid var(--accent); z-index: 2147483648; display: none; overflow-y: auto; color: var(--panelText); border-radius: 8px; backdrop-filter: blur(var(--modalBlur)); box-shadow: 0 0 50px rgba(0,0,0,0.8); cursor: default; }
        .manual-header { padding: 15px; background: var(--accentSoft); border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; }
        .manual-header h2 { margin: 0; color: var(--accent); font-size: 18px; }
        .manual-content { padding: 20px; font-size: 14px; line-height: 1.6; }
        .manual-content h3 { color: #fff; border-bottom: 1px solid #555; padding-bottom: 5px; margin-top: 20px; }
        .manual-content ul { padding-left: 20px; }
        .manual-content li { margin-bottom: 8px; }
        .close-manual { color: #888; cursor: pointer; font-size: 24px; transition: 0.2s; }
        .close-manual:hover { color: #fff; }
        .auth-section { background: #252525; padding: 20px; border: 1px solid #444; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .auth-section-title { position: static; background: transparent; font-size: 16px; color: var(--accent); font-weight: bold; margin-bottom: 15px; display: block; border-left: 3px solid var(--accent); padding-left: 10px; }
        .auth-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
        .auth-label { font-size: 13px; color: #ccc; font-weight: bold; }
        .auth-input { width: 100%; box-sizing: border-box; background: #111; border: 1px solid #444; color: #fff; padding: 12px; border-radius: 4px; font-size: 14px; transition: 0.2s; }
        .auth-input:focus { border-color: var(--accent); background: #000; outline: none; }
        .ts-table th, .ts-table td { border-bottom: 1px solid var(--cardBorder); padding: 8px; }
        .ts-tag { display:inline-block; padding:2px 6px; border-radius:3px; font-size:12px; color:#000; margin-right:4px; }
        .ts-tag-dev { background:var(--accent); }
        .ts-tag-pre { background:#27ae60; color:#fff; }
        .ts-tag-com { background:#3498db; color:#fff; }
    `;

    function boot() {
        if (document.getElementById('csgo-overlay')) return;
        const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
        const overlay = document.createElement('div'); overlay.id = 'csgo-overlay'; overlay.className = 'csgo-reset';

        let hoursOptions = '';
        for(let i=0.5; i<=100; i+=0.5) { hoursOptions += `<option value="${i}" ${i===1?'selected':''}>${i} 小时</option>`; }
        const makeMonthOpts = (sel) => Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i+1===sel?'selected':''}>${i+1}月</option>`).join('');

        overlay.innerHTML = `
            <div class="csgo-container">
                <div class="left-section">

                    <div class="wheel-wrapper" id="wheel-wrapper">
                        <div class="wheel-sensor" id="wheel-sensor"></div>
                        <div class="center-hub" id="wheel-hub"><span class="hub-text">MENU</span></div>
                        <div class="wheel-visual" id="wheel-visual">
                            <svg width="420" height="420" viewBox="0 0 400 400" id="wheel-svg-main"></svg>
                            <div id="wheel-labels"></div>
                        </div>
                    </div>
                    <div id="left-controls" style="display:flex; flex-direction:column; gap:10px; align-items:center; margin-top: 24px;">
                        <button id="btn-open-manual" class="manual-btn" style="margin-top:0;">📘 版本说明书 (V44.5)</button>
                        <div id="theme-toolbar" style="display:flex; gap:8px; align-items:center; background: var(--cardBg); border: 1px solid var(--cardBorder); border-radius: 20px; padding: 6px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                            <span style="color:#888; font-size:12px;">🎨 主题</span>
                            <select id="theme-select" class="add-select" style="width:200px; height:28px; padding:4px 8px;">
                                <option value="gold">黑金</option>
                                <option value="blue">蓝紫</option>
                                <option value="green">青绿</option>
                                <option value="purple">紫色</option>
                                <option value="red">红黑</option>
                                <option value="cream">奶油白</option>
                                <option value="mint">薄荷绿</option>
                                <option value="teal">墨青</option>
                                <option value="olive">橄榄绿</option>
                                <option value="forest">森林绿</option>
                                <option value="slate">岩灰</option>
                                <option value="cyan">青色</option>
                                <option value="amber">琥珀</option>
                                <option value="neutral">中性灰</option>
                                <option value="greige">米灰</option>
                                <option value="emerald">祖母绿</option>
                                <option value="navy">海军蓝</option>
                                <option value="mauve">暮紫</option>
                                <option value="seasalt">海盐蓝</option>
                                <option value="graphite">石墨黑</option>
                                <option value="dawn">晨曦粉</option>
                            </select>
                        </div>
                    </div>

                </div>

                <div class="info-panel" id="panel-right" style="opacity:0; pointer-events:none;">
                    <div id="view-query" class="view-container hidden">
                        <div class="panel-header"><div>📊 工作量统计</div><div style="font-size:12px;color:#666;">core 44.5，作者DJ</div></div>
                        <div class="date-row" style="display:flex; gap:10px; margin-bottom:15px;">
                            <input type="date" id="cs-start" class="cs-input">
                            <input type="date" id="cs-end" class="cs-input">
                        </div>
                        <div class="stats-box">
                            <div class="stat-item"><div class="stat-val" id="disp-score">0.0</div><div class="stat-lbl">总积分</div></div>
                            <div style="width:1px; height:40px; background:#444;"></div>
                            <div class="stat-item"><div class="stat-val" id="disp-hours">0h</div><div class="stat-lbl">总工时</div></div>
                        </div>
                        <div class="grade-grid" id="grade-grid"></div>
                        <div id="status-bar" style="color: var(--accent); font-size: 13px; margin-bottom: 10px; height: 20px; text-align:center;">就绪</div>
                        <button id="btn-buy" class="action-btn">确认查询</button>
                    </div>

                    <div id="view-add" class="view-container hidden">
                        <div class="panel-header"><div>📝 填写工作量</div><div style="font-size:12px;color:#666;">core 44.5，作者DJ</div></div>
                        <div class="add-form">
                            <div class="form-row"><div class="form-group" style="flex:1"><label class="form-label">开始日期</label><input type="date" id="add-start" class="add-input"></div><div class="form-group" style="flex:1"><label class="form-label">完成日期</label><input type="date" id="add-end" class="add-input"></div></div>
                            <div class="form-group proj-search-wrapper">
                                <input type="text" id="add-proj-search" class="add-input" placeholder="点击选择或输入搜索项目" autocomplete="off">
                                <div id="btn-refresh-proj" class="proj-refresh-btn" title="强制HTTP请求抓取项目">🔄</div>
                                <input type="hidden" id="add-proj-id">
                                <div id="proj-dropdown" class="proj-dropdown"></div>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex:1">
                                    <label class="form-label">Bug号</label>
                                    <div class="bug-input-wrapper">
                                        <input type="text" id="add-bug" class="add-input" placeholder="KN8OS16-xxxx">
                                        <button id="btn-fetch-jira" class="bug-fetch-btn">Jira</button>
                                        <button id="btn-fetch-ex" class="bug-fetch-btn ex">Ex抓取</button>
                                    </div>
                                </div>
                                <div class="form-group" style="flex:1"><label class="form-label">Bug类型</label><select id="add-type" class="add-select"><option value="1">普通Bug</option><option value="2">Block</option><option value="3">技术突破</option></select></div>
                            </div>
                            <div class="form-row"><div class="form-group" style="flex:1"><label class="form-label">Bug等级</label><select id="add-grade" class="add-select"><option value="6">等级E (默认)</option><option value="5">等级D</option><option value="4">等级C</option><option value="3">等级B</option><option value="2">等级A</option><option value="1">等级S</option></select></div><div class="form-group" style="flex:1"><label class="form-label">实际工时</label><select id="add-hours" class="add-select">${hoursOptions}</select></div></div>
                            <div class="form-group"><label class="form-label">内容</label><textarea id="add-content" class="add-textarea" placeholder="工作内容..."></textarea></div>
                            <div class="form-group"><label class="form-label">备注</label><input type="text" id="add-note" class="add-input" placeholder="选填"></div>
                        </div>
                        <div id="add-status" style="color: var(--accent); font-size: 13px; margin: 5px 0; text-align:center;"></div>
                        <button id="btn-submit-work" class="action-btn">提交工作量</button>
                    </div>

                    <div id="view-salary" class="view-container hidden">
                        <div class="panel-header"><div>💰 薪资/考勤查询 (Mobiwire)</div><div style="font-size:12px;color:#666;">core 44.5，作者DJ</div></div>
                        <div class="tab-bar">
                            <button id="tab-salary" class="tab-btn active">查询薪资</button>
                            <button id="tab-att" class="tab-btn">查询考勤</button>
                        </div>
                        <div id="mw-salary-panel" style="text-align:center; padding: 20px;">
                            <div style="display:flex; gap:12px; justify-content:center; margin-bottom:15px; align-items:center;">
                                <span>年份</span>
                                <input type="number" id="mw-year" value="${new Date().getFullYear()}" class="cs-input" style="width:80px; height:28px; padding:4px 8px;">
                                <select id="mw-start" class="add-select" style="width:90px; height:28px; padding:4px 8px;">${makeMonthOpts(1)}</select>
                                <span>至</span>
                                <select id="mw-end" class="add-select" style="width:90px; height:28px; padding:4px 8px;">${makeMonthOpts(12)}</select>
                            </div>
                            <div style="display:flex; gap:12px; justify-content:center; margin-bottom:15px; align-items:center;">
                                <span>跨年份</span>
                                <input type="month" id="mw-ym-start" class="cs-input" style="width:140px; height:28px; padding:4px 8px;">
                                <span>至</span>
                                <input type="month" id="mw-ym-end" class="cs-input" style="width:140px; height:28px; padding:4px 8px;">
                            </div>
                            <button id="btn-load-salary" class="action-btn">生成薪资报表</button>
                            <div id="mw-log" style="color:#888; font-size:12px; margin-top:10px; text-align:left; height:300px; overflow-y:auto; background:#111; padding:10px; border-radius:4px;">等待查询...</div>
                        </div>
                        <div id="mw-att-panel" style="text-align:center; padding:20px; display:none;">
                            <div style="display:flex; gap:10px; align-items:center; margin:10px 0; justify-content:center;">
                                <label class="form-label" style="display:inline-block;">快捷年份</label>
                                <input type="number" id="att-year" value="${new Date().getFullYear()}" class="cs-input" style="width:80px; height:28px; padding:4px 8px;">
                                <button id="btn-att-set-year" class="sub-btn" style="height:28px; padding:0 14px; line-height:28px; width:100px; display:inline-block;">选中全年</button>
                            </div>
                            <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px; justify-content:center;">
                                <label class="form-label" style="display:inline-block; margin-right:6px;">开始日期</label>
                                <input type="date" id="att-start" class="cs-input" style="height:28px; padding:4px 8px; width:130px;">
                                <label class="form-label" style="display:inline-block; margin:0 6px;">结束日期</label>
                                <input type="date" id="att-end" class="cs-input" style="height:28px; padding:4px 8px; width:130px;">
                            </div>
                            <button id="btn-load-attendance" class="action-btn">生成考勤统计表</button>
                            <div id="att-log" style="color:#888; font-size:12px; margin-top:10px; text-align:left; height:300px; overflow-y:auto; background:#111; padding:10px; border-radius:4px;">等待查询...</div>
                        </div>
                    </div>

                    <div id="view-timesheet" class="view-container hidden">
                        <div class="panel-header"><div>⏱️ 工时系统</div><div style="font-size:12px;color:#666;">core 44.5，作者DJ</div></div>
                        <div class="tab-bar">
                            <button id="ts-tab-fill" class="tab-btn active">填写</button>
                            <button id="ts-tab-query" class="tab-btn">查询/管理</button>
                        </div>
                        <div id="ts-panel-fill" class="add-form" style="display:block;">
                            <div class="form-row">
                                <div class="form-group" style="flex:1"><label class="form-label">类型</label><select id="ts-type" class="add-select"><option value="1">开发项目</option><option value="0">预研项目</option><option value="2">Common</option></select></div>
                                <div class="form-group" style="flex:1"><label class="form-label">日期</label><input type="date" id="ts-date" class="add-input"></div>
                            </div>
                            <div class="form-group"><label class="form-label">项目</label>
                                <input id="ts-project-1" class="add-input" list="list-project-1" placeholder="开发项目，支持搜索">
                                <datalist id="list-project-1"></datalist>
                                <input id="ts-project-0" class="add-input" list="list-project-0" placeholder="预研项目，支持搜索" style="display:none">
                                <datalist id="list-project-0"></datalist>
                                <input id="ts-project-2" class="add-input" list="list-project-2" placeholder="Common项目，支持搜索" style="display:none">
                                <datalist id="list-project-2"></datalist>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex:1"><label class="form-label">业务部门</label><select id="ts-dept" class="add-select" disabled><option>自动填充</option></select></div>
                                <div class="form-group" style="flex:1"><label class="form-label">项目阶段</label><select id="ts-stage" class="add-select"><option>加载中...</option></select></div>
                                <div class="form-group" style="flex:1"><label class="form-label">产品形态</label><select id="ts-form" class="add-select"><option>请先选项目</option></select></div>
                            </div>
                            <div class="form-group"><label class="form-label">工作内容</label><textarea id="ts-content" class="add-textarea" rows="3"></textarea></div>
                            <div class="form-row"><div class="form-group" style="flex:1"><label class="form-label">工时</label><input type="number" id="ts-hours" class="add-input" value="8"></div>
                                <div class="form-group" style="flex:1"><label class="form-label">检查人</label><select id="ts-reviewer" class="add-select"><option>加载中...</option></select></div>
                            </div>
                            <div id="ts-edit-tip" style="display:none; color: var(--accent); font-size:12px;">当前编辑记录ID: <span id="ts-edit-id"></span></div>
                            <button id="ts-btn-copy-yesterday" class="action-btn" style="width:100%;">参考昨日填写</button>
                        <div id="ts-copy-picker" style="display:none; margin-top:10px; background: var(--cardBg); border:1px solid var(--cardBorder); border-radius:6px; padding:10px;"></div>
                            <button id="ts-btn-submit" class="action-btn">提交保存</button>
                        </div>
                        <div id="ts-panel-query" style="display:none;">
                            <div class="date-row" style="display:flex; gap:10px; margin-bottom:15px; align-items:center;">
                                <input type="date" id="ts-query-start" class="cs-input" style="width:160px;">
                                <input type="date" id="ts-query-end" class="cs-input" style="width:160px;">

                            </div>
                             <div class="date-row" style="display:flex; gap:10px; margin-bottom:15px; align-items:center;">
                                <button id="ts-btn-search" class="action-btn">查询</button>
                                <button id="ts-btn-export" class="action-btn" style="width:160px;">📊 导出Excel</button>
                            </div>
                            <div id="ts-query-empty" style="color:#888; font-size:12px; margin-top:10px;">暂无数据</div>
                            <table class="ts-table" style="width:100%; border-collapse: collapse;">
                                <thead><tr><th style="width:120px; text-align:left; color:#ccc;">日期</th><th style="text-align:left; color:#ccc;">项目/内容</th><th style="width:80px; text-align:center; color:#ccc;">工时</th><th style="width:160px; text-align:center; color:#ccc;">操作</th></tr></thead>
                                <tbody id="ts-table-body"></tbody>
                            </table>
                        </div>
                    </div>



                    <div id="view-settings" class="view-container hidden">
                        <div class="panel-header"><div>⚙️ 账号设置</div><div style="font-size:12px;color:#666;">core 44.5，作者DJ</div></div>
                        <div class="auth-form">
                            <div class="auth-section">
                                <div class="auth-section-title">工作量系统 (Sagereal)</div>
                                <div class="auth-group"><label class="auth-label">工号</label><input type="text" id="cfg-sr-job" class="auth-input" placeholder="请输入工号"></div>
                                <div class="auth-group"><label class="auth-label">密码</label><input type="password" id="cfg-sr-pwd" class="auth-input" placeholder="请输入密码 (支持明文/MD5)"></div>
                            </div>
                            <div class="auth-section">
                                <div class="auth-section-title">薪资系统 (Mobiwire)</div>
                                <div class="auth-group"><label class="auth-label">工号</label><input type="text" id="cfg-mw-emp" class="auth-input" placeholder="请输入工号"></div>
                                <div class="auth-group"><label class="auth-label">密码</label><input type="password" id="cfg-mw-pwd" class="auth-input" placeholder="请输入密码"></div>
                            </div>
                            <div class="auth-section">
                                <div class="auth-section-title">工时系统 </div>
                                <div class="auth-group"><label class="auth-label">用户名</label><input type="text" id="cfg-ts-user" class="auth-input" placeholder="请输入工时系统用户名"></div>
                                <div class="auth-group"><label class="auth-label">密码</label><input type="password" id="cfg-ts-pwd" class="auth-input" placeholder="请输入工时系统密码"></div>
                            </div>
                        </div>
                        <button id="btn-save-cfg" class="action-btn">保存配置</button>
                    </div>

                    <div id="view-history" class="view-container hidden">
                        <div class="panel-header"><div>📜 填报历史</div><div style="font-size:12px;color:#666;">core 44.5，作者DJ</div></div>
                        <div class="hist-summary" style="display:flex; justify-content:space-around; margin-bottom:15px; background:#222; padding:10px; border-radius:4px;">
                            <div class="hist-sum-item"><div>本月已填</div><div class="hist-sum-val" id="hist-month-val" style="color: var(--accent); font-weight:bold;">0h</div></div>
                            <div style="width:1px; background:#444;"></div>
                            <div class="hist-sum-item"><div>本季已填</div><div class="hist-sum-val" id="hist-quarter-val" style="color: var(--accent); font-weight:bold;">0h</div></div>
                        </div>
                        <div id="inventory-list" class="inventory-list"></div>
                        <button id="btn-clear-hist" class="sub-btn">清空历史</button>
                    </div>
                </div>
            </div>

            <div id="manual-modal">
                <div class="manual-header" id="manual-header"><h2>📘 DJWebTool操作手册 V44.5</h2><div class="close-manual" id="close-manual">×</div></div>
                <div class="manual-content">
                    <h3>❤️ V44.5 版本更新</h3>
                    <ul>
                        <li>
                        <strong> 工时系统修复</strong>
                        <li>
                            工时系统参考往日修改功能完善，可以支持多条选择
                        </li>
                        </li>
                    </ul>
					<h3>❤️ V44.4 版本更新</h3>
                    <ul>
                        <li>
                        <strong> 考勤修复调整</strong>
                        <li>
                            加班时长会统计进周末数据
                        </li>
                        </li>
                    </ul>
                    <h3>❤️ V44.2 版本更新</h3>
                    <ul>
                        <li>
                        <strong> 薪资查询及表单显示修复调整</strong>
                        <li>
                            薪资查询支持跨年份查询
                        </li>
                        <li>
                            修复关闭再打开面板表单消失问题
                        </li>
                        </li>
                    </ul>
                    <h3>😀 V44.1 版本更新</h3>
                    <ul>
                        <li>
                        <strong>加入工时系统模块</strong>
                        <li>
                            新增工时的增删改查、导出工时数据为excel
                        </li>
                        <li>
                            支持填写<strong>任意时间</strong>工时以及对应的修改删除
                        </li>
                        <li>
                            支持<strong>任意时间</strong>的工时信息查询
                        </li>
                        </li>
                    </ul>
                    <h3>✌ V43.5 版本更新</h3>
                    <ul>
                        <li><strong>加入考勤功能</strong>可在查薪资/考勤下，查询考勤、加班时长等信息，可下载报表</li>
                    </ul>
                    <h3>✌ V43.0 修正版更新</h3>
                    <ul>
                        <li><strong>工作量内网查询修复</strong>修复内网工作量网站登录的用户查询不到工作量问题</li>
                    </ul>
                    <h3>🏆 V42.8 修正版更新</h3>
                    <ul>
                        <li><strong>UI显示修复</strong>：修复了表单显示不全的问题，面板高度恢复为固定700px（从min-height改为固定height），添加overflow: hidden处理，确保所有内容正常显示和滚动。</li>
                        <li><strong>查询功能修复</strong>：修复了分页查询中pageInfo处理的问题，兼容数组和对象两种返回结构，当返回数组时pageInfo为null，确保分页逻辑正确执行，查询结果正常显示。</li>
                        <li><strong>面板显示优化</strong>：修复了轮盘点击后面板不显示的问题，确保QUERY模式下点击Q1/Q2/Q3/Q4/本月后面板正确显示，添加了面板显示状态的强制设置。</li>
                        <li><strong>表单滚动优化</strong>：为add-form添加overflow-y: auto和padding-right，确保表单内容过长时可以正常滚动查看。</li>
                    </ul>

                    <h3>📋 V42.7 修正版更新</h3>
                    <ul>
                        <li><strong>二级菜单点击修复</strong>：修复了二级菜单点击无响应的问题，添加了独立的click事件监听器处理二级菜单的点击操作，确保Q1/Q2/Q3/Q4/本月、提交/清空等功能正常响应。</li>
                        <li><strong>点击事件优化</strong>：主菜单使用mouseup事件（支持拖拽排序），二级菜单使用click事件（确保点击响应），两种事件互不干扰，提升交互体验。</li>
                    </ul>

                    <h3>📋 V42.6 修正版更新</h3>
                    <ul>
                        <li><strong>二级菜单恢复</strong>：恢复了V41版本的二级菜单功能，工作量统计支持选择当前月、Q1、Q2、Q3、Q4等快捷日期范围，填写工作量支持通过轮盘点击提交和清空操作，提升操作效率。</li>
                        <li><strong>轮盘交互优化</strong>：主菜单支持拖拽排序，二级菜单支持快速选择，中心Hub显示当前模式（MENU/BACK），点击Hub可返回主菜单。</li>
                        <li><strong>日期范围快捷设置</strong>：在查询工作量时，点击Q1/Q2/Q3/Q4自动设置对应季度的日期范围，点击"本月"自动设置当前月份的日期范围。</li>
                    </ul>

                    <h3>📋 V42.5 修正版更新</h3>
                    <ul>
                        <li><strong>项目匹配逻辑增强</strong>：恢复了完整的项目模糊匹配功能，支持双向包含匹配（项目名包含Jira项目名或Jira项目名包含项目名）和前缀匹配（提取Jira项目名称前缀进行匹配），大幅提升项目自动匹配成功率。</li>
                        <li><strong>匹配状态提示优化</strong>：项目匹配成功时显示"项目已匹配: XXX"，匹配失败时显示"未找到匹配项目: XXX"，让用户清楚了解匹配结果。</li>
                    </ul>

                    <h3>📋 V42.4 修正版更新</h3>
                    <ul>
                        <li><strong>Jira日期自动填充</strong>：点击"Jira"或"Ex抓取"按钮时，自动从Jira系统获取Bug的创建日期和解决日期（或更新时间），并自动填充到"开始日期"和"完成日期"字段，无需手动输入日期。</li>
                        <li><strong>Jira API优化</strong>：优先使用Jira REST API获取信息，支持更准确的日期和项目信息提取，失败时自动回退到HTML解析方式，确保兼容性。</li>
                    </ul>

                    <h3>📋 V42.3 修正版更新</h3>
                    <ul>
                        <li><strong>版本说明书交互优化</strong>：版本说明书支持拖动功能，可通过标题栏拖动窗口到任意位置，提升使用体验。</li>
                        <li><strong>智能关闭机制</strong>：点击版本说明书外部区域（轮盘、信息面板、背景等）时自动关闭，点击内部内容时保持打开状态。</li>
                    </ul>

                    <h3>📋 V42.2 修正版更新</h3>
                    <ul>
                        <li><strong>查询逻辑修复</strong>：修复了总积分和总工时计算错误的问题，恢复V41的分页查询逻辑，确保获取所有数据。</li>
                        <li><strong>积分计算优化</strong>：通过gradeName匹配等级并使用SCORE_RULES计算积分，兼容grade数字映射，确保积分准确计算。</li>
                        <li><strong>作者信息显示</strong>：所有表单页面统一显示"core 42，作者DJ"标识。</li>
                    </ul>

                    <h3>📋 V42版本与V41版本的主要区别</h3>
                    <h4>✨ 新增功能</h4>
                    <ul>
                        <li><strong>Mobiwire薪资报表模块</strong>：全新添加薪资报表功能，支持自动登录Mobiwire系统，批量抓取指定月份范围的薪资数据，生成包含总计和平均值的CSV报表。支持年份和月份范围选择，自动处理Session管理。</li>
                        <li><strong>轮盘菜单拖拽排序</strong>：支持通过拖拽方式自定义轮盘菜单顺序，排序结果自动保存到本地存储，下次打开时保持自定义顺序。</li>
                        <li><strong>8菜单项设计</strong>：从V41的7个菜单项扩展为8个，新增"薪资报表"菜单项，菜单布局为8等分圆形轮盘。</li>
                        <li><strong>版本说明书</strong>：新增版本说明书弹窗，可通过轮盘左下角按钮打开，查看版本特性和功能说明。</li>
                    </ul>

                    <h4>🔄 界面优化</h4>
                    <ul>
                        <li><strong>中文轮盘菜单</strong>：所有菜单项使用中文标签（工作量统计、填写工作量、历史记录、薪资报表、账号设置、跳转Jira、跳转Ex、工时系统），提升用户体验。</li>
                        <li><strong>轮盘交互优化</strong>：采用点击式交互替代V41的多级菜单模式，点击轮盘扇形区域直接进入对应功能，操作更直观。</li>
                        <li><strong>悬停高亮效果</strong>：鼠标悬停在轮盘扇形区域时，扇形和标签会高亮显示，中心Hub显示当前菜单项名称。</li>
                        <li><strong>面板布局调整</strong>：右侧信息面板宽度从550px调整为600px，高度改为自适应（min-height: 650px），提升内容展示空间。</li>
                        <li><strong>表单样式统一</strong>：所有表单使用统一的深色主题，输入框、下拉框、文本域样式一致，支持焦点高亮效果。</li>
                        <li><strong>Hub交互</strong>：中心Hub显示当前模式（MENU/BACK），支持点击返回主菜单；点击缩放动画统一为wheel-click-anim。</li>
                    </ul>

                    <h4>🔧 功能增强</h4>
                    <ul>
                        <li><strong>账号设置扩展</strong>：新增Mobiwire系统账号配置，支持Sagereal和Mobiwire双系统账号管理，密码支持明文和MD5两种格式。</li>
                        <li><strong>项目搜索优化</strong>：项目选择支持关键词搜索，实时过滤匹配项目，点击下拉选项自动填充项目ID和名称。</li>
                        <li><strong>Jira抓取增强</strong>：保留V41的双源Jira抓取功能（内网/外网），按钮样式区分（绿色内网/橙色外网），自动匹配项目名称。</li>
                        <li><strong>查询结果兼容</strong>：增强查询结果解析，兼容Array和workLoadData两种数据结构，支持HTML错误页检测。</li>
                        <li><strong>历史记录优化</strong>：历史记录列表支持删除单条记录，显示本月和本季已填工时统计，记录上限200条。</li>
                        <li><strong>二级菜单恢复</strong>：工作量统计提供Q1/Q2/Q3/Q4/本月快速选择；填写工作量提供提交/清空；各模式提供返回扇区。</li>
                    </ul>

                    <h3>📢 全功能详解</h3>
                    <ul>
                        <li><strong>📊 工作量统计</strong>：按月/季度查询工时，自动统计积分与等级分布；支持自定义日期范围与快捷选择（本月/Q1-Q4）。</li>
                        <li><strong>📝 填写工作量</strong>：支持Jira/Ex抓取摘要与日期，项目搜索实时过滤，工时/等级/类型选择，防重复提交提示。</li>
                        <li><strong>💰 薪资报表</strong>：输入Mobiwire账号，按年份与月份范围抓取薪资明细，生成包含汇总/平均值的CSV数据；UI对齐深色主题。</li>
                        <li><strong>⚙️ 账号设置</strong>：Sagereal与Mobiwire双系统账号管理；支持明文/MD5密码；保存后自动缓存到本地存储。</li>
                        <li><strong>📜 填报历史</strong>：展示历史记录，支持单项删除；统计本月与本季已填总工时，限200条；高亮交互与滚动容器优化。</li>
                        <li><strong>⏱️ 工时系统</strong>：预留入口，提示开发中；交互与样式与其他面板一致，保证一致体验。</li>
                    </ul>

                    <h4>🛡️ 核心保留</h4>
                    <ul>
                        <li><strong>明文密码逻辑</strong>：完全保留V41的明文密码自动MD5加密逻辑，密码长度小于30自动转换为MD5，确保登录稳定性。</li>
                        <li><strong>分页查询机制</strong>：保留V41的分页查询逻辑，自动循环获取所有页数据，确保统计结果完整准确。</li>
                        <li><strong>积分计算规则</strong>：保留V41的SCORE_RULES积分规则（S:32.0, A:14.0, B:7.2, C:2.0, D:1.0, E:0.3），通过gradeName匹配等级计算。</li>
                        <li><strong>跨季度拦截</strong>：保留工作量提交的跨季度检查，防止跨季度填写，需要拆分为多条记录。</li>
                        <li><strong>重复提交检测</strong>：保留重复提交拦截功能，检测code: -1错误并提示用户。</li>
                    </ul>

                    <h4>📝 完整功能列表</h4>
                    <ul>
                        <li><strong>工作量统计</strong>：支持日期范围查询，显示总积分、总工时、各等级数量统计（S/A/B/C/D/E），支持分页数据汇总。</li>
                        <li><strong>填写工作量</strong>：支持开始/完成日期、项目选择、Bug号、Bug类型（普通/Block/技术突破）、Bug等级（S/A/B/C/D/E）、实际工时（0.5-100小时）、工作内容、备注填写。</li>
                        <li><strong>Jira信息抓取</strong>：支持内网和外网Jira抓取，自动填充Bug标题和项目名称，支持项目名称模糊匹配。</li>
                        <li><strong>填报历史</strong>：记录最近200条提交记录，显示Bug号、日期、内容、工时，支持按月份和季度统计已填工时，支持删除单条记录。</li>
                        <li><strong>薪资报表</strong>：支持Mobiwire系统登录，批量抓取指定年份和月份范围的薪资数据，生成CSV报表（包含总计和平均值），支持GBK编码解析。</li>
                        <li><strong>账号设置</strong>：支持Sagereal和Mobiwire双系统账号配置，密码支持明文/MD5格式，配置自动保存到本地存储。</li>
                        <li><strong>快捷跳转</strong>：支持快速跳转到Jira内网和外网登录页，支持跳转到工时系统页面。</li>
                        <li><strong>轮盘交互</strong>：8等分圆形轮盘，支持点击选择、拖拽排序、悬停高亮，中心Hub显示当前菜单项。</li>
                    </ul>

                    <h4>🎨 界面细节</h4>
                    <ul>
                        <li><strong>深色主题</strong>：整体采用深色背景（#1e1e1e），金色高亮（#eab543），提升视觉体验。</li>
                        <li><strong>响应式布局</strong>：轮盘和信息面板并排显示，支持全屏遮罩，点击遮罩关闭界面。</li>
                        <li><strong>动画效果</strong>：轮盘点击缩放动画、悬停高亮过渡、面板淡入淡出效果。</li>
                        <li><strong>快捷键支持</strong>：Alt+S 快速打开/关闭轮盘界面。</li>
                        <li><strong>状态提示</strong>：所有操作都有实时状态提示，显示当前操作进度和结果。</li>
                    </ul>

                    <h4>🔐 安全特性</h4>
                    <ul>
                        <li><strong>本地存储</strong>：账号密码、提交历史、菜单顺序等数据存储在浏览器本地，不上传到服务器。</li>
                        <li><strong>Session管理</strong>：自动管理登录Session，支持Session失效自动重连。</li>
                        <li><strong>错误处理</strong>：完善的错误处理机制，网络错误、解析错误、登录失败等都有相应提示。</li>
                    </ul>
                </div>
            </div>
        `;

        const themeSelect = overlay.querySelector('#theme-select');
        const savedTheme = GM_getValue(KEY_THEME, 'gold');
        const themesAll = ['gold','blue','green','purple','red','cream','mint','teal','olive','forest','slate','cyan','amber','neutral','greige','emerald','navy','mauve','seasalt','graphite','dawn'];
        themesAll.forEach(t=>overlay.classList.remove('theme-'+t));
        overlay.classList.add('theme-' + savedTheme);
        if (themeSelect) {
            themeSelect.value = savedTheme;
            themeSelect.addEventListener('change', function(){
                const name = themeSelect.value;
                themesAll.forEach(t=>overlay.classList.remove('theme-'+t));
                overlay.classList.add('theme-' + name);
                GM_setValue(KEY_THEME, name);
            });
        }
        document.body.appendChild(overlay);

        // 绑定数据与事件
        const SCORE_RULES = { 'S': 32.0, 'A': 14.0, 'B': 7.2, 'C': 2.0, 'D': 1.0, 'E': 0.3 };
        document.getElementById('grade-grid').innerHTML = Object.keys(SCORE_RULES).map(k => { const isHigh = (k === 'S' || k === 'A'); return `<div class="grade-item ${isHigh ? 'high-tier' : ''}"><span class="g-label">${k}级</span><span class="g-val" id="cnt-${k}">0</span></div>`; }).join('');

        const panel = document.getElementById('panel-right');
        const searchInput = document.getElementById('add-proj-search');
        const dropdown = document.getElementById('proj-dropdown');
        const modal = document.getElementById('manual-modal');

        ['mousedown', 'mouseup', 'keydown', 'keyup'].forEach(evt => panel.addEventListener(evt, e => e.stopPropagation()));
        searchInput.addEventListener('click', () => { renderProjectDropdown(searchInput.value); dropdown.style.display = 'block'; });
        searchInput.addEventListener('input', (e) => { renderProjectDropdown(e.target.value); dropdown.style.display = 'block'; });
        document.getElementById('btn-refresh-proj').onclick = () => fetchProjects(true);
        panel.addEventListener('click', (e) => { if (e.target !== searchInput && e.target.id !== 'btn-refresh-proj' && !dropdown.contains(e.target)) dropdown.style.display = 'none'; });
        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                toggleOverlay(false);
            }
            // 点击版本说明书外部区域（overlay背景或其他元素，但不是modal）时关闭modal
            if (modal.style.display === 'block' && !modal.contains(e.target) && e.target.id !== 'btn-open-manual') {
                modal.style.display = 'none';
            }
        });

        // 版本说明书功能
        document.getElementById('btn-open-manual').onclick = () => modal.style.display = 'block';
        document.getElementById('close-manual').onclick = () => modal.style.display = 'none';

        // 版本说明书拖动功能
        const manualHeader = document.getElementById('manual-header');
        let isDraggingManual = false;
        let manualDragStart = { x: 0, y: 0 };
        let manualStartPos = { left: 0, top: 0 };

        manualHeader.addEventListener('mousedown', (e) => {
            if (e.target.id === 'close-manual' || e.target.closest('.close-manual')) return; // 关闭按钮不触发拖动
            isDraggingManual = true;
            manualDragStart.x = e.clientX;
            manualDragStart.y = e.clientY;
            const rect = modal.getBoundingClientRect();
            manualStartPos.left = rect.left;
            manualStartPos.top = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDraggingManual) {
                const deltaX = e.clientX - manualDragStart.x;
                const deltaY = e.clientY - manualDragStart.y;
                modal.style.left = (manualStartPos.left + deltaX) + 'px';
                modal.style.top = (manualStartPos.top + deltaY) + 'px';
                modal.style.right = 'auto'; // 取消right定位
            }
        });

        document.addEventListener('mouseup', () => {
            isDraggingManual = false;
        });

        // 阻止modal内部点击事件冒泡（防止点击内容时关闭overlay和modal）
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const now = new Date();
        document.getElementById('cs-start').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        document.getElementById('cs-end').value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        document.getElementById('add-start').value = now.toISOString().split('T')[0];
        document.getElementById('add-end').value = now.toISOString().split('T')[0];
        const attStartEl = document.getElementById('att-start');
        const attEndEl = document.getElementById('att-end');
        if (attStartEl && attEndEl) {
            attStartEl.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            attEndEl.value = now.toISOString().split('T')[0];
        }

        // 绑定按钮事件
        document.getElementById('btn-buy').onclick = queryWorkload;
        document.getElementById('btn-save-cfg').onclick = saveSettings;
        document.getElementById('btn-clear-hist').onclick = clearHistory;

        document.getElementById('btn-load-salary').onclick = executeMobiwireFlow;
        const tabSalary = document.getElementById('tab-salary');
        const tabAtt = document.getElementById('tab-att');
        if (tabSalary && tabAtt) {
            tabSalary.onclick = () => toggleMwTabs('salary');
            tabAtt.onclick = () => toggleMwTabs('att');
        }
        Array.from(document.querySelectorAll('#btn-att-set-year')).forEach(el => {
            el.onclick = () => {
                const panel = el.closest('.view-container') || document;
                const yInput = panel.querySelector('#att-year');
                const sInput = panel.querySelector('#att-start');
                const eInput = panel.querySelector('#att-end');
                const y = parseInt(yInput && yInput.value, 10);
                if (!isNaN(y)) {
                    if (sInput) sInput.value = `${y}-01-01`;
                    if (eInput) eInput.value = `${y}-12-31`;
                }
            };
        });
        Array.from(document.querySelectorAll('#btn-load-attendance')).forEach(el => { el.onclick = executeAttendanceFlow; });
        document.getElementById('btn-fetch-jira').onclick = () => fetchJiraInfo(document.getElementById('add-bug').value.trim(), 'INT', (m)=>document.getElementById('add-status').innerText=m).then(fillJira);
        document.getElementById('btn-fetch-ex').onclick = () => fetchJiraInfo(document.getElementById('add-bug').value.trim(), 'EX', (m)=>document.getElementById('add-status').innerText=m).then(fillJira);
        document.getElementById('btn-submit-work').onclick = submitWorkloadAction;

        function fillJira(info) {
            if(info) {
                document.getElementById('add-content').value = info.summary;
                // 项目匹配逻辑已移到fetchJiraInfo函数中，这里不再需要重复匹配
            }
        }

        bindGlobalKeys();
        initWheel();
    }

    function toggleMwTabs(which) {
        const tabSalary = document.getElementById('tab-salary');
        const tabAtt = document.getElementById('tab-att');
        const panelSalary = document.getElementById('mw-salary-panel');
        const panelAtt = document.getElementById('mw-att-panel');
        if (!tabSalary || !tabAtt || !panelSalary || !panelAtt) return;
        if (which === 'salary') {
            tabSalary.classList.add('active');
            tabAtt.classList.remove('active');
            panelSalary.style.display = 'block';
            panelAtt.style.display = 'none';
        } else {
            tabAtt.classList.add('active');
            tabSalary.classList.remove('active');
            panelAtt.style.display = 'block';
            panelSalary.style.display = 'none';
            const now = new Date();
            const s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const e = now.toISOString().split('T')[0];
            const attS = document.getElementById('att-start');
            const attE = document.getElementById('att-end');
            if (attS && attE) { attS.value = s; attE.value = e; }
        }
    }
    // ================= 轮盘逻辑 (V42.6 恢复二级菜单) =================
    const DEFAULT_MENUS = [
        { id: 'query', label: '工作量统计', desc: 'Stats', locked: true },
        { id: 'add', label: '填写工作量', desc: 'Add Work', locked: true },
        { id: 'history', label: '历史记录', desc: 'History', locked: true },
        { id: 'salary', label: '薪资/考勤查询', desc: 'Salary', locked: true },
        { id: 'settings', label: '账号设置', desc: 'Account', locked: false },
        { id: 'jira', label: '跳转Jira', desc: 'Intranet', locked: false },
        { id: 'jira-ex', label: '跳转Ex', desc: 'Extranet', locked: false },
        { id: 'timesheet', label: '工时系统', desc: 'Timesheet', locked: true }
    ];

    // ★★★ V42.6 恢复：二级菜单定义 ★★★
    const MENUS = {
        'MENU': {
            sectors: DEFAULT_MENUS,
            hub: 'MENU',
            count: DEFAULT_MENUS.length
        },
        'QUERY': {
            sectors: [
                { id: 'q1', label: 'Q1', desc: 'Jan-Mar' },
                { id: 'q2', label: 'Q2', desc: 'Apr-Jun' },
                { id: 'q3', label: 'Q3', desc: 'Jul-Sep' },
                { id: 'q4', label: 'Q4', desc: 'Oct-Dec' },
                { id: 'curr', label: '本月', desc: 'Current' }
            ],
            hub: 'BACK',
            count: 5
        },
        'ADD': {
            sectors: [
                { id: 'submit', label: '提交', desc: 'Submit' },
                { id: 'reset', label: '清空', desc: 'Reset' },
                { id: 'back', label: '返回', desc: 'Back', isBack: true }
            ],
            hub: 'BACK',
            count: 3
        },
        'SETTINGS': { sectors: [{ id: 'back', label: '返回', desc: 'Back', isBack: true }], hub: 'BACK', count: 1 },
        'HISTORY': { sectors: [{ id: 'back', label: '返回', desc: 'Back', isBack: true }], hub: 'BACK', count: 1 },
        'SALARY': { sectors: [{ id: 'back', label: '返回', desc: 'Back', isBack: true }], hub: 'BACK', count: 1 },
        'ATTENDANCE': { sectors: [{ id: 'back', label: '返回', desc: 'Back', isBack: true }], hub: 'BACK', count: 1 },
        'TIMESHEET': { sectors: [{ id: 'back', label: '返回', desc: 'Back', isBack: true }], hub: 'BACK', count: 1 }
    };

    const PATH_BACK = describeArc(200, 200, 200, 180, 360);

    function initWheel() {
        const sensor = document.getElementById('wheel-sensor');
        const svgMain = document.getElementById('wheel-svg-main');
        const labelsContainer = document.getElementById('wheel-labels');
        const hub = document.getElementById('wheel-hub');
        const panel = document.getElementById('panel-right');
        const cx = 200, cy = 200, r = 200;
        let isDragging = false;
        let dragStartSector = null;
        let dragStartPos = { x: 0, y: 0 };
        let justDragged = false; // 标记是否刚刚完成拖拽，用于阻止拖拽后的点击
        let currentMode = 'MENU';
        let activeSector = null;
        let menuOrder = JSON.parse(GM_getValue(KEY_MENU_ORDER, '[]'));
        if (menuOrder.length !== DEFAULT_MENUS.length) menuOrder = DEFAULT_MENUS.map(m => m.id);

        // ★★★ V42.6 恢复：支持多模式渲染的renderWheel函数 ★★★
        function renderWheel(mode) {
            currentMode = mode || currentMode;
            const data = MENUS[currentMode];
            const isAuth = checkAuthReady();

            hub.innerHTML = `<span class="hub-text">${data.hub}</span>`;

            while (svgMain.firstChild) svgMain.removeChild(svgMain.firstChild);
            labelsContainer.innerHTML = '';

            let svgHtml = '', labelHtml = '';

            if (data.count === 1 && data.sectors[0].isBack) {
                svgHtml = `<path id="sec-back" class="svg-sector" d="${PATH_BACK}"></path>`;
                labelHtml = `<div id="lbl-back" class="wedge-label" style="top:50%; left:40px; transform:translateY(-50%);"><div>返回</div></div>`;
            } else if (currentMode === 'ADD') {
                const p1 = describeArc(cx, cy, r, 0, 90);
                const p2 = describeArc(cx, cy, r, 90, 180);
                svgHtml += `<path id="sec-submit" class="svg-sector" d="${p1}"></path>`;
                svgHtml += `<path id="sec-reset" class="svg-sector" d="${p2}"></path>`;
                svgHtml += `<path id="sec-back" class="svg-sector" d="${PATH_BACK}"></path>`;
                const l1 = polarToCartesian(cx, cy, 140, 45);
                const l2 = polarToCartesian(cx, cy, 140, 135);
                labelHtml += `<div id="lbl-submit" class="wedge-label" style="left:${l1.x-40}px; top:${l1.y-20}px"><div>提交</div></div>`;
                labelHtml += `<div id="lbl-reset" class="wedge-label" style="left:${l2.x-40}px; top:${l2.y-20}px"><div>清空</div></div>`;
                labelHtml += `<div id="lbl-back" class="wedge-label" style="top:50%; left:40px; transform:translateY(-50%);"><div>返回</div></div>`;
            } else {
                const step = 360 / data.count;
                const sectors = currentMode === 'MENU' ? menuOrder.map(id => DEFAULT_MENUS.find(m => m.id === id)) : data.sectors;

                sectors.forEach((s, i) => {
                    if (!s) return;
                    const start = i * step;
                    const end = (i + 1) * step;
                    const path = describeArc(cx, cy, r, start, end);
                    let isDisabled = (currentMode === 'MENU' && s.locked && !isAuth);
                    svgHtml += `<path id="sec-${s.id}" class="svg-sector ${isDisabled?'disabled':''}" d="${path}"></path>`;
                    const mid = start + step / 2;
                    const pos = polarToCartesian(cx, cy, 140, mid);
                    labelHtml += `<div id="lbl-${s.id}" class="wedge-label ${isDisabled?'disabled':''}" style="left:${pos.x - 40}px; top:${pos.y - 20}px"><div>${s.label}</div><div style="font-size:10px;opacity:0.7">${s.desc}</div></div>`;
                });
            }

            svgMain.innerHTML = svgHtml;
            labelsContainer.innerHTML = labelHtml;

            if(currentMode === 'MENU') {
                panel.style.opacity = '0';
                panel.style.pointerEvents = 'none';
            } else {
                panel.style.opacity = '1';
                panel.style.pointerEvents = 'auto';
                document.querySelectorAll('.view-container').forEach(v => v.classList.add('hidden'));
                if(currentMode === 'QUERY') document.getElementById('view-query').classList.remove('hidden');
                if(currentMode === 'ADD') { document.getElementById('view-add').classList.remove('hidden'); fetchProjects(); }
                if(currentMode === 'SETTINGS') { document.getElementById('view-settings').classList.remove('hidden'); loadSettings(); }
                if(currentMode === 'HISTORY') { document.getElementById('view-history').classList.remove('hidden'); renderHistory(); }
                if(currentMode === 'SALARY') document.getElementById('view-salary').classList.remove('hidden');
                if(currentMode === 'ATTENDANCE') document.getElementById('view-attendance').classList.remove('hidden');
                if(currentMode === 'TIMESHEET') { document.getElementById('view-timesheet').classList.remove('hidden'); initTimesheet(); }
            }
        }

        renderWheel('MENU');

        // ★★★ V41对齐：拖拽功能（仅主菜单） ★★★
        sensor.addEventListener('mousedown', (e) => {
            if (currentMode !== 'MENU') return; // 只在主菜单时允许拖拽排序
            const rect = sensor.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
            if (angle < 0) angle += 360;
            const idx = Math.floor(angle / (360 / MENUS[currentMode].count));
            if (idx >= 0 && idx < MENUS[currentMode].count) {
                dragStartSector = idx;
                dragStartPos = { x: e.clientX, y: e.clientY };
                isDragging = false;
            }
        });

        // ★★★ V41对齐：恢复mousemove跟踪activeSector（用于悬停高亮和点击） ★★★
        sensor.addEventListener('mousemove', (e) => {
            // 如果正在拖拽，只处理拖拽逻辑
            if (dragStartSector !== null && currentMode === 'MENU') {
                const dist = Math.sqrt(Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2));
                if (dist > 10) {
                    isDragging = true;
                    document.querySelectorAll('.svg-sector').forEach(el => el.classList.remove('drag-target'));
                    const rect = sensor.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
                    if (angle < 0) angle += 360;
                    const currentIdx = Math.floor(angle / (360 / MENUS[currentMode].count));
                    if(currentIdx !== dragStartSector && svgMain.children[currentIdx]) {
                        svgMain.children[currentIdx].classList.add('drag-target');
                    }
                }
                return; // 拖拽时不再更新activeSector
            }

            // V41逻辑：跟踪activeSector用于悬停高亮和点击
            const rect = sensor.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
            if (angle < 0) angle += 360;

            let targetId = null;
            const data = MENUS[currentMode];

            if (data.count === 1 && data.sectors[0].isBack) {
                if (angle >= 180 && angle <= 360) targetId = 'back';
            } else if (currentMode === 'ADD') {
                if (angle >= 0 && angle < 90) targetId = 'submit';
                else if (angle >= 90 && angle < 180) targetId = 'reset';
                else if (angle >= 180 && angle <= 360) targetId = 'back';
            } else {
                const step = 360 / data.count;
                const idx = Math.floor(angle / step);
                if (currentMode === 'MENU') {
                    // 主菜单使用menuOrder映射
                    if (idx >= 0 && idx < menuOrder.length) {
                        targetId = menuOrder[idx];
                    }
                } else {
                    // 其他模式直接使用sectors
                    if (data.sectors[idx]) targetId = data.sectors[idx].id;
                }
            }

            if (activeSector !== targetId) {
                activeSector = targetId;
                document.querySelectorAll('.svg-sector').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.wedge-label').forEach(el => el.classList.remove('active'));
                if (targetId) {
                    const sec = document.getElementById(`sec-${targetId}`);
                    const lbl = document.getElementById(`lbl-${targetId}`);
                    if(sec && !sec.classList.contains('disabled')) sec.classList.add('active');
                    if(lbl && !lbl.classList.contains('disabled')) lbl.classList.add('active');
                }
            }
        });

        // ★★★ V41对齐：mouseup处理拖拽交换 ★★★
        document.addEventListener('mouseup', (e) => {
            if (dragStartSector !== null && currentMode === 'MENU') {
                if (isDragging) {
                    // 拖拽交换逻辑（仅主菜单）
                    const rect = sensor.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
                    if (angle < 0) angle += 360;
                    const dropIdx = Math.floor(angle / (360 / MENUS[currentMode].count));
                    if (dropIdx !== dragStartSector && dropIdx >= 0 && dropIdx < MENUS[currentMode].count) {
                        const temp = menuOrder[dragStartSector];
                        menuOrder[dragStartSector] = menuOrder[dropIdx];
                        menuOrder[dropIdx] = temp;
                        GM_setValue(KEY_MENU_ORDER, JSON.stringify(menuOrder));
                        renderWheel('MENU');
                    }
                    // 标记刚刚完成拖拽，阻止后续的click事件
                    justDragged = true;
                } else {
                    // 即使没有拖拽，如果dragStartSector不为null，说明用户可能想要拖拽
                    // 但移动距离不够，这种情况下也应该阻止点击（避免误触发）
                    // 但如果移动距离很小（< 5px），可能是正常点击，允许点击
                    const dist = Math.sqrt(Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2));
                    if (dist > 5) {
                        justDragged = true;
                    }
                }
                // 在下一个事件循环中重置标志，确保click事件能检测到
                setTimeout(() => { justDragged = false; }, 10);
            }
            dragStartSector = null;
            isDragging = false;
            document.querySelectorAll('.svg-sector').forEach(el => el.classList.remove('drag-target'));
        });



        // ★★★ V41对齐：使用click事件和activeSector处理所有点击 ★★★
        sensor.addEventListener('click', () => {
            // 如果正在拖拽或刚刚完成拖拽，不处理点击
            if (isDragging || justDragged) return;

            if (!activeSector) return;
            const el = document.getElementById(`sec-${activeSector}`);
            if (el && el.classList.contains('disabled')) {
                alert("⚠️ 请先在[账号设置]中配置萨瑞系统账号");
                renderWheel('SETTINGS');
                return;
            }

            const wrapper = document.getElementById('wheel-wrapper');
            wrapper.classList.add('wheel-click-anim');
            setTimeout(() => wrapper.classList.remove('wheel-click-anim'), 100);

            if (currentMode === 'MENU') {
                if (activeSector === 'query') { renderWheel('QUERY'); setDates('curr'); }
                else if (activeSector === 'add') renderWheel('ADD');
                else if (activeSector === 'settings') renderWheel('SETTINGS');
                else if (activeSector === 'history') renderWheel('HISTORY');
                else if (activeSector === 'salary') renderWheel('SALARY');
                else if (activeSector === 'timesheet') renderWheel('TIMESHEET');
                else if (activeSector === 'jira') GM_openInTab(URL_LOGIN_INT, { active: true });
                else if (activeSector === 'jira-ex') GM_openInTab(URL_LOGIN_EXT, { active: true });
            } else if (currentMode === 'QUERY') {
                setDates(activeSector);
            } else if (currentMode === 'ADD') {
                if (activeSector === 'submit') submitWorkloadAction();
                else if (activeSector === 'reset') {
                    document.getElementById('add-bug').value='';
                    document.getElementById('add-content').value='';
                }
                else if (activeSector === 'back') renderWheel('MENU');
            } else if (activeSector === 'back') {
                renderWheel('MENU');
            }
        });

        // 悬停高亮
        sensor.addEventListener('mousemove', (e) => {
            if (isDragging) return;
            const rect = sensor.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
            if (angle < 0) angle += 360;

            const data = MENUS[currentMode];
            let targetId = null;

            if (data.count === 1 && data.sectors[0].isBack) {
                if (angle >= 180 && angle <= 360) targetId = 'back';
            } else if (currentMode === 'ADD') {
                if (angle >= 0 && angle < 90) targetId = 'submit';
                else if (angle >= 90 && angle < 180) targetId = 'reset';
                else if (angle >= 180 && angle <= 360) targetId = 'back';
            } else {
                const step = 360 / data.count;
                const idx = Math.floor(angle / step);
                if (data.sectors[idx]) {
                    if (currentMode === 'MENU') {
                        targetId = menuOrder[idx];
                    } else {
                        targetId = data.sectors[idx].id;
                    }
                }
            }

            if (activeSector !== targetId) {
                activeSector = targetId;
                document.querySelectorAll('.svg-sector').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.wedge-label').forEach(el => el.classList.remove('active'));
                if (targetId) {
                    const sec = document.getElementById(`sec-${targetId}`);
                    const lbl = document.getElementById(`lbl-${targetId}`);
                    if(sec && !sec.classList.contains('disabled')) sec.classList.add('active');
                    if(lbl && !lbl.classList.contains('disabled')) lbl.classList.add('active');

                    if (currentMode === 'MENU') {
                        const item = DEFAULT_MENUS.find(m => m.id === targetId);
                        if(item) {
                            hub.style.background = '#333';
                            document.querySelector('.hub-text').innerText = item.label.substring(0, 4);
                        }
                    } else {
                        const item = data.sectors.find(s => s.id === targetId);
                        if(item) {
                            hub.style.background = '#333';
                            document.querySelector('.hub-text').innerText = item.label.substring(0, 4);
                        }
                    }
                }
            }
        });

        sensor.addEventListener('mouseleave', () => {
            document.querySelectorAll('.svg-sector').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.wedge-label').forEach(el => el.classList.remove('active'));
            hub.style.background = '#222';
            const data = MENUS[currentMode];
            document.querySelector('.hub-text').innerText = data.hub;
            activeSector = null;
        });

        hub.addEventListener('click', () => {
            if (currentMode !== 'MENU') renderWheel('MENU');
        });
    }

    // ★★★ V42.6 恢复：设置日期范围函数 ★★★
    function setDates(type) {
        const year = new Date().getFullYear();
        let s, e;
        if (type === 'q1') {
            s = `${year}-01-01`;
            e = `${year}-03-31`;
        } else if (type === 'q2') {
            s = `${year}-04-01`;
            e = `${year}-06-30`;
        } else if (type === 'q3') {
            s = `${year}-07-01`;
            e = `${year}-09-30`;
        } else if (type === 'q4') {
            s = `${year}-10-01`;
            e = `${year}-12-31`;
        } else if (type === 'curr') {
            const now = new Date();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
            s = `${year}-${m}-01`;
            e = `${year}-${m}-${String(lastDay).padStart(2, '0')}`;
        }
        document.getElementById('cs-start').value = s;
        document.getElementById('cs-end').value = e;
    }

    // ================= 功能函数 =================
    function toggleOverlay(forceState) {
        const overlay = document.getElementById('csgo-overlay');
        const isActive = overlay.classList.contains('active');
        const newState = forceState !== undefined ? forceState : !isActive;
        if (newState) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    function bindGlobalKeys() {
        document.addEventListener('keydown', (e) => { if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); toggleOverlay(); }});
    }
    function saveSettings() {
        const srJob = document.getElementById('cfg-sr-job').value.trim();
        const srPwd = document.getElementById('cfg-sr-pwd').value.trim();
        const mwEmp = document.getElementById('cfg-mw-emp').value.trim();
        const mwPwd = document.getElementById('cfg-mw-pwd').value.trim();
        const tsUser = (document.getElementById('cfg-ts-user') && document.getElementById('cfg-ts-user').value.trim()) || '';
        const tsPwd = (document.getElementById('cfg-ts-pwd') && document.getElementById('cfg-ts-pwd').value.trim()) || '';
        const auth = { sagereal: { jobNum: srJob, password: srPwd }, mobiwire: { emp: mwEmp, pwd: mwPwd }, timesheet: { user: tsUser, password: tsPwd } };
        GM_setValue(STORAGE_KEY_AUTH, JSON.stringify(auth));
        alert("✅ 配置已保存！");
    }
    function loadSettings() {
        const auth = JSON.parse(GM_getValue(STORAGE_KEY_AUTH, '{}'));
        if (auth.sagereal) { document.getElementById('cfg-sr-job').value = auth.sagereal.jobNum || ""; document.getElementById('cfg-sr-pwd').value = auth.sagereal.password || ""; }
        if (auth.mobiwire) { document.getElementById('cfg-mw-emp').value = auth.mobiwire.emp || ""; document.getElementById('cfg-mw-pwd').value = auth.mobiwire.pwd || ""; }
        if (auth.timesheet) { const uEl = document.getElementById('cfg-ts-user'); const pEl = document.getElementById('cfg-ts-pwd'); if(uEl) uEl.value = auth.timesheet.user || ""; if(pEl) pEl.value = auth.timesheet.password || ""; }
    }
    async function fetchProjects(force) {
        let projects = await fetchProjectList((m)=>document.getElementById('add-status').innerText=m, force);
        if(projects === null && await performAutoLogin((m)=>document.getElementById('add-status').innerText=m)) projects = await fetchProjectList((m)=>{}, true);
        if(projects) renderProjectDropdown('');
    }
    function renderProjectDropdown(filter) {
        const dropdown = document.getElementById('proj-dropdown');
        const filtered = PROJECT_LIST_CACHE.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
        dropdown.innerHTML = filtered.length ? filtered.map(p => `<div class="proj-option" data-id="${p.id}">${p.name}</div>`).join('') : '<div style="padding:10px;color:#666">无匹配项目</div>';
        dropdown.querySelectorAll('.proj-option').forEach(el => el.onclick = () => {
            document.getElementById('add-proj-search').value = el.innerText;
            document.getElementById('add-proj-id').value = el.getAttribute('data-id');
            dropdown.style.display = 'none';
        });
    }
    async function queryWorkload() {
        await ensureSagerealSession((m)=>document.getElementById('status-bar').innerText=m);
        if(SESSION_TOKEN === "") await performAutoLogin((m)=>document.getElementById('status-bar').innerText=m);
        const btn = document.getElementById('btn-buy'); btn.disabled = true; btn.innerText = "查询中...";
        const statusBar = document.getElementById('status-bar');
        const startDate = document.getElementById('cs-start').value;
        const endDate = document.getElementById('cs-end').value;

        // ★★★ 修复：恢复V41的分页查询逻辑，确保获取所有数据
        let currentPage = 1; let hasMore = true; let allItems = [];
        const SCORE_RULES = { 'S': 32.0, 'A': 14.0, 'B': 7.2, 'C': 2.0, 'D': 1.0, 'E': 0.3 };
        let totalScore = 0, totalHours = 0;
        const counts = { 'S':0, 'A':0, 'B':0, 'C':0, 'D':0, 'E':0 };

        try {
            while (hasMore) {
                statusBar.innerText = `获取: ${currentPage}页`;
                const params = new URLSearchParams();
                params.append('action', 'workLoadList');
                params.append('currentPage', currentPage.toString());
                params.append('startDate', startDate);
                params.append('endDate', endDate);
                params.append('token', SESSION_TOKEN);
                params.append('projectId', '');
                params.append('userId', '');
                params.append('type', '');
                params.append('bugNumber', '');
                params.append('content', '');

                const responseText = await new Promise((resolve, reject) => {
                    const sr = srEndpoints();
                    GM_xmlhttpRequest({
                        method: "POST", url: sr.apiData, headers: getHeaders(), data: params.toString(), withCredentials: true,
                        onload: (res) => {
                            if(res.status === 200) resolve(res.responseText);
                            else reject(`HTTP ${res.status}`);
                        },
                        onerror: () => reject("Network Error")
                    });
                });

                // ★★★ 修复：增加对HTML错误页的预判
                if(responseText.trim().startsWith('<')) {
                    statusBar.innerText = "重连中...";
                    await ensureSagerealSession((m)=>statusBar.innerText=m);
                    if(await performAutoLogin((m)=>statusBar.innerText=m)) {
                        continue;
                    } else {
                        statusBar.innerText = "⚠️ Session失效或服务异常";
                        btn.disabled = false; btn.innerText = "确认查询";
                        return;
                    }
                }

                let resJson;
                try {
                    resJson = JSON.parse(responseText);
                } catch(e) {
                    statusBar.innerText = "重连中...";
                    await ensureSagerealSession((m)=>statusBar.innerText=m);
                    if(await performAutoLogin((m)=>statusBar.innerText=m)) {
                        // 重试当前页
                        continue;
                    } else {
                        statusBar.innerText = "❌ 解析失败";
                        btn.disabled = false; btn.innerText = "确认查询";
                        return;
                    }
                }

                if (resJson.code !== 1 || !resJson.data) {
                    hasMore = false;
                    break;
                }

                // ★★★ 修复：兼容两种返回结构
                const list = Array.isArray(resJson.data) ? resJson.data : (resJson.data.workLoadData || []);
                const pageInfo = Array.isArray(resJson.data) ? null : (resJson.data.page || null);

                if (list.length === 0) {
                    hasMore = false;
                    break;
                }

                // ★★★ 修复：恢复V41的积分计算逻辑（通过gradeName匹配等级，使用SCORE_RULES计算）
                list.forEach(item => {
                    let matchedLevel = null;
                    const gradeName = item.gradeName || "";
                    // 优先使用gradeName字符串匹配
                    for (let level in SCORE_RULES) {
                        if (gradeName.includes(level)) {
                            matchedLevel = level;
                            break;
                        }
                    }
                    // 如果gradeName匹配失败，尝试使用grade数字映射（兼容）
                    if (!matchedLevel && item.grade) {
                        const map = ['','S','A','B','C','D','E'];
                        matchedLevel = map[item.grade] || 'E';
                    }

                    if (matchedLevel && SCORE_RULES[matchedLevel] !== undefined) {
                        const score = SCORE_RULES[matchedLevel];
                        const hours = parseFloat(item.actualWorkHours) || parseFloat(item.workHours) || 0;
                        totalScore += score;
                        totalHours += hours;
                        counts[matchedLevel]++;
                        allItems.push(item);
                    }
                });

                // 检查是否还有更多页
                if (pageInfo) {
                    if (currentPage >= parseInt(pageInfo.totalPage || 1)) {
                        hasMore = false;
                    } else {
                        currentPage++;
                    }
                } else {
                    // 如果没有分页信息，假设只有一页
                    hasMore = false;
                }
            }

            // 更新显示
            document.getElementById('disp-score').innerText = totalScore.toFixed(1);
            document.getElementById('disp-hours').innerText = totalHours.toFixed(1) + 'h';
            Object.keys(counts).forEach(k => document.getElementById(`cnt-${k}`).innerText = counts[k]);
            statusBar.innerText = `✅ 成功: ${allItems.length} 条`;

        } catch(e) {
            statusBar.innerText = "❌ 查询失败: " + e.message;
            console.error(e);
        } finally {
            btn.disabled = false;
            btn.innerText = "确认查询";
        }
    }

    let TS_TOKEN = "";
    let TS_UID = "";
    const TS_DATA = { devProjects: [], preProjects: [], comProjects: [], lastQueryResult: [], editingId: null };

    function initTimesheet() {
        TS_TOKEN = "";
        TS_UID = "";
        const now = new Date();
        const ymd = now.toISOString().split('T')[0];
        const sEl = document.getElementById('ts-query-start');
        const eEl = document.getElementById('ts-query-end');
        const dEl = document.getElementById('ts-date');
        if (sEl) sEl.value = ymd;
        if (eEl) eEl.value = ymd;
        if (dEl) dEl.value = ymd;
        const tabFill = document.getElementById('ts-tab-fill');
        const tabQuery = document.getElementById('ts-tab-query');
        if (tabFill && tabQuery) {
            tabFill.onclick = () => { tabFill.classList.add('active'); tabQuery.classList.remove('active'); document.getElementById('ts-panel-fill').style.display = 'block'; document.getElementById('ts-panel-query').style.display = 'none'; };
            tabQuery.onclick = () => { tabQuery.classList.add('active'); tabFill.classList.remove('active'); document.getElementById('ts-panel-fill').style.display = 'none'; document.getElementById('ts-panel-query').style.display = 'block'; };
        }
        const typeSel = document.getElementById('ts-type');
        const p0 = document.getElementById('ts-project-0');
        const p1 = document.getElementById('ts-project-1');
        const p2 = document.getElementById('ts-project-2');
        function rerenderProjectInputs() {
            const t = typeSel.value;
            if (p0 && p1 && p2) {
                p0.style.display = t === '0' ? '' : 'none';
                p1.style.display = t === '1' ? '' : 'none';
                p2.style.display = t === '2' ? '' : 'none';
            }
        }
        if (typeSel) { typeSel.onchange = rerenderProjectInputs; rerenderProjectInputs(); }
        const devInput = document.getElementById('ts-project-1');
        if (devInput) devInput.addEventListener('change', handleDevProjectChange);
        const btnSubmit = document.getElementById('ts-btn-submit');
        if (btnSubmit) btnSubmit.onclick = handleTsSubmit;
        const btnSearch = document.getElementById('ts-btn-search');
        if (btnSearch) btnSearch.onclick = handleTsQuery;
        const btnExport = document.getElementById('ts-btn-export');
        if (btnExport) btnExport.onclick = handleTsExport;
        const btnCopy = document.getElementById('ts-btn-copy-yesterday');
        if (btnCopy) btnCopy.onclick = handleTsCopyYesterday;
        ensureTsLogin().then((ok)=>{ if(ok) loadTsAllData(); });
    }

    function ensureTsLogin() {
        if (TS_TOKEN) return Promise.resolve(true);
        const auth = JSON.parse(GM_getValue(STORAGE_KEY_AUTH, '{}'));
        const ts = (auth && auth.timesheet) || {};
        if (!ts.user || !ts.password) { alert("请先在【账号设置】中配置工时系统(TS)账号"); renderWheel('SETTINGS'); return Promise.resolve(false); }
        return new Promise((resolve) => {
            GM_xmlhttpRequest({ method: "POST", url: TS_URL_LOGIN, headers: { "Content-Type": "application/json" }, data: JSON.stringify({ userName: ts.user, password: ts.password, rememberMe: false }), onload: function(res) {
                try { const data = JSON.parse(res.responseText); if (res.status === 200 && data.code === 200) { TS_TOKEN = data.token; TS_UID = data.userId; resolve(true); } else resolve(false); } catch(e) { resolve(false); }
            }, onerror: () => resolve(false) });
        });
    }

    function loadTsAllData() {
        const token = TS_TOKEN; const uid = TS_UID;
        GM_xmlhttpRequest({ method: "POST", url: TS_URL_PROJ_DEV, headers: { "Content-Type": "application/x-www-form-urlencoded", "token": token }, data: "", onload: function(res) {
            try { const data = JSON.parse(res.responseText); if(data.code === 200 && data.developmentProject) {
                TS_DATA.devProjects = data.developmentProject;
                let opts = ''; let forms = new Set();
                data.developmentProject.forEach(p => { opts += `<option value="${p.projectName}">`; if(p.productForm) forms.add(p.productForm); });
                const dl1 = document.getElementById('list-project-1'); if (dl1) dl1.innerHTML = opts;
                let htmlF = '<option value="">请选择产品形态</option>'; forms.forEach(f => htmlF += `<option value="${f}">${f}</option>`);
                const formSel = document.getElementById('ts-form'); if (formSel) formSel.innerHTML = htmlF;
            } } catch(e) {}
        }});
        GM_xmlhttpRequest({ method: "POST", url: TS_URL_PROJ_PRE, headers: { "Content-Type": "application/json", "token": token }, data: "{}", onload: function(res) {
            try { const data = JSON.parse(res.responseText); const list = data.lists || []; TS_DATA.preProjects = list; let opts = ''; list.forEach(p => { opts += `<option value="${p.preResearchProjectName}">`; }); const dl0 = document.getElementById('list-project-0'); if (dl0) dl0.innerHTML = opts; } catch(e) {}
        }});
        if (uid) {
            GM_xmlhttpRequest({ method: "POST", url: TS_URL_PROJ_COM, headers: { "Content-Type": "application/x-www-form-urlencoded", "token": token }, data: `userId=${uid}`, onload: function(res) {
                try { const data = JSON.parse(res.responseText); const list = data.commonProjects || []; TS_DATA.comProjects = list; let opts = ''; list.forEach(p => { opts += `<option value="${p.commonProjectName}">`; }); const dl2 = document.getElementById('list-project-2'); if (dl2) dl2.innerHTML = opts; } catch(e) {}
            }});
        }
        GM_xmlhttpRequest({ method: "POST", url: TS_URL_STAGES, headers: { "Content-Type": "application/json", "token": token }, data: "{}", onload: function(res) {
            try { const data = JSON.parse(res.responseText); if(data.npiNodeList) { let h='<option value="">请选择</option>'; data.npiNodeList.forEach(n=>h+=`<option value="${n.nodeName}">${n.nodeName}</option>`); const s = document.getElementById('ts-stage'); if (s) s.innerHTML=h; } } catch(e){}
        }});
        if (uid) {
            GM_xmlhttpRequest({ method: "POST", url: TS_URL_CHECKER, headers: { "Content-Type": "application/x-www-form-urlencoded", "token": token }, data: `userId=${uid}`, onload: function(res) {
                try { const data = JSON.parse(res.responseText); const list = data.checkPersons || []; if(list.length>0){ let h=''; list.forEach(p=>{ h+=`<option value="${p.userId}">${p.userNick}</option>`; }); const r = document.getElementById('ts-reviewer'); if (r) r.innerHTML = h; } } catch(e) {}
            }});
        }
    }

    function handleDevProjectChange() {
        const name = document.getElementById('ts-project-1').value;
        const project = TS_DATA.devProjects.find(p=>p.projectName===name);
        if(project){ const d = document.getElementById('ts-dept'); if (project.businessDepartment && d) d.innerHTML = `<option value="${project.businessDepartment}" selected>${project.businessDepartment}(自动匹配)</option>`; const f = document.getElementById('ts-form'); if (project.productForm && f) f.value = project.productForm; }
    }

    function handleTsQuery() {
        const token = TS_TOKEN; const uid = TS_UID; if(!token) return alert('请先登录');
        const start = document.getElementById('ts-query-start').value; const end = document.getElementById('ts-query-end').value; const btn = document.getElementById('ts-btn-search'); if(btn){ btn.innerText='查询中...'; btn.disabled=true; }
        const payload = { currPage: 1, pageSize: 100, dataForm: { workTimes: [`${start} 00:00:00`, `${end} 23:59:59`], creatorId: uid, workloadType: "", preResearchProjectId: "", commonProjectId: "", projectCategory: "", outerProjectCategory: "", businessDepartment: "", workloadNpiNode: "", productForm: "", workModuleId: "", workSubModuleId: "", workContent: "", workHour: "", remark: "", inspectorId: "", checkStatus: "", checkTimes: [], checkFeedback: "" } };
        GM_xmlhttpRequest({ method: "POST", url: TS_URL_QUERY, headers: { "Content-Type": "application/json", "token": token }, data: JSON.stringify(payload), onload: function(res){ if(btn){ btn.innerText='查询'; btn.disabled=false; } try{ const d = JSON.parse(res.responseText); if(d.code===200){ TS_DATA.lastQueryResult = d.record || []; renderTsTable(d.record || []); } else alert('查询失败: '+d.msg); } catch(e){ alert('查询解析异常'); } } });
    }

    function resolveTsProjectName(item) {
        if (item.workloadType == '1') return item.projectCategory || '';
        if (item.workloadType == '0') { const p = TS_DATA.preProjects.find(i=> String(i.preResearchProjectId) === String(item.preResearchProjectId)); return p ? p.preResearchProjectName : ''; }
        if (item.workloadType == '2') { const p = TS_DATA.comProjects.find(i=> String(i.commonProjectId) === String(item.commonProjectId)); return p ? p.commonProjectName : ''; }
        return '';
    }

    function renderTsTable(list) {
        const tbody = document.getElementById('ts-table-body'); const empty = document.getElementById('ts-query-empty'); if(!tbody || !empty) return; tbody.innerHTML = ''; if(list.length===0){ empty.style.display='block'; return; } empty.style.display='none';
        list.forEach(item=>{ const tr = document.createElement('tr'); const typeLabel = item.workloadType == '1' ? '<span class="ts-tag ts-tag-dev">开发</span>' : (item.workloadType == '0' ? '<span class="ts-tag ts-tag-pre">预研</span>' : '<span class="ts-tag ts-tag-com">Common</span>'); const projectName = resolveTsProjectName(item); const date = item.workTime ? item.workTime.split('T')[0] : ''; tr.innerHTML = `<td>${date}</td><td>${typeLabel} <b>${projectName}</b><br><span style="color:#666; display:block; margin-top:4px;">${item.workContent}</span></td><td style="text-align:center">${item.workHour}</td><td style="text-align:center"><button class="sub-btn ts-op-edit">编辑</button><button class="sub-btn ts-op-del" style="margin-top:4px; color:#e74c3c;">删除</button></td>`; tr.querySelector('.ts-op-edit').onclick = () => loadTsRecordToForm(item, projectName); tr.querySelector('.ts-op-del').onclick = () => deleteTsRecord(item.workloadRecordId); tbody.appendChild(tr); });
    }

    function handleTsExport() {
        const list = TS_DATA.lastQueryResult;
        if (!list || list.length === 0) { alert('请先查询后再导出'); return; }
        let csv = '日期,类型,项目名称,工作内容,工时(H),阶段/形态,检查人\n';
        list.forEach(item => {
            const date = item.workTime ? item.workTime.split('T')[0] : '';
            const type = item.workloadType == '1' ? '开发' : (item.workloadType == '0' ? '预研' : 'Common');
            const project = resolveTsProjectName(item).replace(/,/g, ' ');
            const content = (item.workContent || '').replace(/[\r\n,]/g, ' ');
            const hours = item.workHour || 0;
            const extra = item.workloadType == '1' ? `${item.workloadNpiNode || ''}/${item.productForm || ''}` : '-';
            const inspector = item.inspector ? ((item.inspector.userNick || item.inspector.userName) || '') : (item.inspectorId || '');
            csv += `${date},${type},${project},${content},${hours},${extra},${inspector}\n`;
        });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `工时记录_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function loadTsRecordToForm(record, resolvedProjectName) {
        const tabFill = document.getElementById('ts-tab-fill'); if (tabFill) tabFill.click(); TS_DATA.editingId = record.workloadRecordId; const tip = document.getElementById('ts-edit-tip'); const idEl = document.getElementById('ts-edit-id'); if (tip) tip.style.display='block'; if (idEl) idEl.innerText = record.workloadRecordId; const btn = document.getElementById('ts-btn-submit'); if (btn) btn.innerText = '确认修改'; const typeSel = document.getElementById('ts-type'); if (typeSel){ typeSel.value = String(record.workloadType); typeSel.dispatchEvent(new Event('change')); }
        setTimeout(()=>{ if(record.workloadType == '1') { const p1 = document.getElementById('ts-project-1'); if(p1) p1.value = record.projectCategory; } else if(record.workloadType == '0'){ const p0 = document.getElementById('ts-project-0'); if(p0) p0.value = resolvedProjectName; } else if(record.workloadType == '2'){ const p2 = document.getElementById('ts-project-2'); if(p2) p2.value = resolvedProjectName; } const c = document.getElementById('ts-content'); if(c) c.value = record.workContent; const h = document.getElementById('ts-hours'); if(h) h.value = record.workHour; const d = document.getElementById('ts-date'); if(d) d.value = record.workTime.split('T')[0]; const r = document.getElementById('ts-reviewer'); if(r && record.inspectorId) r.value = record.inspectorId; if(record.workloadType == '1'){ const st = document.getElementById('ts-stage'); if(st) st.value = record.workloadNpiNode; const f = document.getElementById('ts-form'); if(f) f.value = record.productForm; handleDevProjectChange(); } }, 100);
    }

    function resetTsFormToCreate() { TS_DATA.editingId = null; const tip = document.getElementById('ts-edit-tip'); if(tip) tip.style.display='none'; const btn = document.getElementById('ts-btn-submit'); if(btn) btn.innerText='提交保存'; const c = document.getElementById('ts-content'); if(c) c.value=''; }

    function deleteTsRecord(id) {
        if(!confirm('确定要删除这条工时记录吗？')) return;
        const token = TS_TOKEN;
        GM_xmlhttpRequest({ method: "POST", url: TS_URL_DELETE, headers: { "Content-Type": "application/x-www-form-urlencoded", "token": token }, data: `workloadRecordId=${id}`, onload: function(res){ try{ const d = JSON.parse(res.responseText); if(d.code===200){ alert('🗑️ 删除成功'); handleTsQuery(); } else { alert('删除失败: '+d.msg); } } catch(e){ alert('删除异常'); } } });
    }

    function handleTsSubmit() {
        const token = TS_TOKEN; const uid = TS_UID; const type = document.getElementById('ts-type').value; const dateStr = document.getElementById('ts-date').value;
        const payload = { workloadType: type, preResearchProjectId: "", commonProjectId: "", projectCategory: "", outerProjectCategory: "", businessDepartment: document.getElementById('ts-dept').value, workloadNpiNode: "", productForm: "", workModuleId: "null", workSubModuleId: "", workContent: document.getElementById('ts-content').value, workHour: Number(document.getElementById('ts-hours').value), workTime: new Date(dateStr + "T09:00:00").toISOString(), remark: "", inspectorId: document.getElementById('ts-reviewer').value, creatorId: uid, checkStatus: "0", checkTime: null, checkFeedback: "" };
        if (TS_DATA.editingId) payload.workloadRecordId = TS_DATA.editingId;
        if(type == '1') { const projName = document.getElementById('ts-project-1').value; payload.projectCategory = projName; payload.outerProjectCategory = projName; payload.workloadNpiNode = document.getElementById('ts-stage').value; payload.productForm = document.getElementById('ts-form').value; }
        else if(type == '0') { const name = document.getElementById('ts-project-0').value; const p = TS_DATA.preProjects.find(i=> i.preResearchProjectName === name); if(p) payload.preResearchProjectId = p.preResearchProjectId; else return alert('请选择有效的预研项目'); }
        else if(type == '2') { const name = document.getElementById('ts-project-2').value; const p = TS_DATA.comProjects.find(i=> i.commonProjectName === name); if(p) payload.commonProjectId = p.commonProjectId; else return alert('请选择有效的Common项目'); }
        if(!payload.workContent) return alert('请填写工作内容');
        const btn = document.getElementById('ts-btn-submit'); const isEdit = !!TS_DATA.editingId; if(btn){ btn.innerText = isEdit ? '修改中...' : '提交中...'; btn.disabled = true; }
        GM_xmlhttpRequest({ method: "POST", url: TS_URL_SAVE, headers: { "Content-Type": "application/json", "token": token }, data: JSON.stringify(payload), onload: function(res){ if(btn){ btn.innerText = isEdit ? '确认修改' : '提交保存'; btn.disabled = false; } try{ const d = JSON.parse(res.responseText); if(d.code===200){ alert(isEdit ? '✅ 修改成功！' : '✅ 提交成功！'); if(isEdit) resetTsFormToCreate(); } else if(d.code===500 && d.msg && d.msg.includes('16H')) alert('❌ 失败：该日期累计工时已超过 16 小时！'); else alert('❌ 失败: '+d.msg); } catch(e){ alert('解析响应失败'); } } });
    }

    function handleTsCopyYesterday() {
        const token = TS_TOKEN; const uid = TS_UID; if(!token) return alert('请先登录');
        const btn = document.getElementById('ts-btn-copy-yesterday'); if(!btn) return; const originalText = btn.innerText; btn.innerText='查询中...'; btn.disabled=true;
        const picker = document.getElementById('ts-copy-picker'); if (picker) { picker.style.display='none'; picker.innerHTML=''; }
        const today = new Date(); let foundDate = null; let foundList = null;
        function queryByDate(dateStr, done) {
            const payload = { currPage: 1, pageSize: 50, dataForm: { workTimes: [`${dateStr} 00:00:00`, `${dateStr} 23:59:59`], creatorId: uid, workloadType: "", preResearchProjectId: "", commonProjectId: "", projectCategory: "", outerProjectCategory: "", businessDepartment: "", workloadNpiNode: "", productForm: "", workModuleId: "", workSubModuleId: "", workContent: "", workHour: "", remark: "", inspectorId: "", checkStatus: "", checkTimes: [], checkFeedback: "" } };
            GM_xmlhttpRequest({ method: "POST", url: TS_URL_QUERY, headers: { "Content-Type": "application/json", "token": token }, data: JSON.stringify(payload), onload: function(res){ try{ const d = JSON.parse(res.responseText); done(d && d.code===200 ? (d.record||[]) : []); } catch(e){ done([]); } }, onerror: ()=>done([]) });
        }
        (async function(){
            for(let i=1;i<=30;i++){
                const dt = new Date(today); dt.setDate(dt.getDate()-i); const ds = dt.toISOString().split('T')[0];
                const list = await new Promise(resolve => queryByDate(ds, resolve));
                if (list && list.length>0) { foundDate = ds; foundList = list; break; }
            }
            btn.innerText = originalText; btn.disabled=false;
            if (!foundList || foundList.length===0) { alert('最近未找到可参考记录'); return; }
            const htmlItems = foundList.map(rec => {
                const typeLabel = rec.workloadType == '1' ? '<span class="ts-tag ts-tag-dev">开发</span>' : (rec.workloadType == '0' ? '<span class="ts-tag ts-tag-pre">预研</span>' : '<span class="ts-tag ts-tag-com">Common</span>');
                const name = resolveTsProjectName(rec);
                const date = rec.workTime ? rec.workTime.split('T')[0] : foundDate;
                return `<div class="inv-item" style="margin-bottom:8px;"><div style="flex:1"><div>${typeLabel} <b>${name}</b> <span style="color:#666">${date}</span></div><div style="font-size:12px;color:#aaa">${rec.workContent || ''}</div></div><div style="display:flex;align-items:center;gap:8px;"><div style="font-weight:bold">${rec.workHour || 0}h</div><button class="sub-btn ts-pick-apply">应用</button></div></div>`;
            }).join('');
            if (picker) {
                picker.innerHTML = `<div style="font-weight:bold; margin-bottom:8px; color: var(--accent);">选择近期记录作为模板（${foundDate}）</div>${htmlItems}`;
                picker.style.display = 'block';
                Array.from(picker.querySelectorAll('.ts-pick-apply')).forEach((btnEl, idx) => {
                    btnEl.onclick = () => {
                        const rec = foundList[idx];
                        const typeSel = document.getElementById('ts-type'); if(typeSel){ typeSel.value = String(rec.workloadType); typeSel.dispatchEvent(new Event('change')); }
                        setTimeout(()=>{ if(rec.workloadType=='1'){ const p1 = document.getElementById('ts-project-1'); if(p1) p1.value = rec.projectCategory || ''; const st = document.getElementById('ts-stage'); if(st) st.value = rec.workloadNpiNode || ''; const f = document.getElementById('ts-form'); if(f) f.value = rec.productForm || ''; handleDevProjectChange(); } else if(rec.workloadType=='0'){ const p0 = document.getElementById('ts-project-0'); const nm = resolveTsProjectName(rec); if(p0) p0.value = nm || ''; } else if(rec.workloadType=='2'){ const p2 = document.getElementById('ts-project-2'); const nm2 = resolveTsProjectName(rec); if(p2) p2.value = nm2 || ''; } const c = document.getElementById('ts-content'); if(c) c.value = rec.workContent || ''; const h = document.getElementById('ts-hours'); if(h) h.value = rec.workHour || 8; const d = document.getElementById('ts-date'); if(d) d.value = new Date().toISOString().split('T')[0]; const r = document.getElementById('ts-reviewer'); if(r && rec.inspectorId) r.value = rec.inspectorId; }, 100);
                        picker.style.display = 'none';
                    };
                });
            }
        })();
    }
    function submitWorkloadAction() {
        const data = {
            startDate: document.getElementById('add-start').value, endDate: document.getElementById('add-end').value,
            projectId: document.getElementById('add-proj-id').value, bugNumber: document.getElementById('add-bug').value.trim(),
            grade: document.getElementById('add-grade').value, type: document.getElementById('add-type').value,
            hours: document.getElementById('add-hours').value, content: document.getElementById('add-content').value.trim(),
            note: document.getElementById('add-note').value.trim()
        };
        if(!data.projectId) { alert("请选择项目"); return; }
        if(!data.bugNumber || !data.content) { alert("请补全Bug号和内容"); return; }
        submitWorkLoad(data, (msg)=>document.getElementById('add-status').innerText=msg).then(success => {
            if(success) {
                document.getElementById('add-status').innerText = "✅ 提交成功";
                renderHistory();
            }
        });
    }
    function renderHistory() {
        const list = document.getElementById('inventory-list');
        list.innerHTML = '';
        const hist = JSON.parse(GM_getValue(STORAGE_KEY_SUBMIT_HISTORY, '[]'));
        let mTotal = 0, qTotal = 0; const now = new Date(); const curM = now.getMonth(); const curQ = Math.floor(curM/3);
        hist.forEach((item, idx) => {
            const d = new Date(item.workDate);
            if(d.getFullYear() === now.getFullYear()) { if(d.getMonth() === curM) mTotal += item.hours; if(Math.floor(d.getMonth()/3) === curQ) qTotal += item.hours; }
            const div = document.createElement('div'); div.className = 'inv-item';
            div.innerHTML = `<div style="flex:1"><div style="font-weight:bold;color: var(--accent)">${item.bug} <span style="font-size:12px;color:#666">${item.workDate}</span></div><div style="font-size:12px;color:#aaa">${item.content}</div></div><div style="font-weight:bold">${item.hours}h</div><div class="inv-del">×</div>`;
            div.querySelector('.inv-del').onclick = (e) => { e.stopPropagation(); if(confirm('删除记录?')) { hist.splice(idx, 1); GM_setValue(STORAGE_KEY_SUBMIT_HISTORY, JSON.stringify(hist)); renderHistory(); }};
            list.appendChild(div);
        });
        document.getElementById('hist-month-val').innerText = mTotal.toFixed(1) + 'h';
        document.getElementById('hist-quarter-val').innerText = qTotal.toFixed(1) + 'h';
    }
    function clearHistory() { if(confirm('清空历史?')) { GM_setValue(STORAGE_KEY_SUBMIT_HISTORY, '[]'); renderHistory(); } }

    // 启动
    window.addEventListener('load', boot);
    setTimeout(boot, 1000); // Fallback
})();
