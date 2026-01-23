// ==UserScript==
// @name         工时统计助手 - CS:GO 战术指挥官 (V42.8 修正版)
// @namespace    http://tampermonkey.net/
// @version      42.8
// @description  V41核心(明文密码/稳定查询) + V55界面(中文轮盘/薪资报表) + 查询修复 + 交互优化 + Jira日期自动填充 + 项目匹配增强 + 二级菜单修复 + UI显示修复
// @author       DJ
// @match        *://*/*
// @include      file:///*
// @connect      work.cqdev.top
// @connect      172.16.1.77
// @connect      jira.transsion.com
// @connect      jira-ex.transsion.com
// @connect      www.mobiwire.com.cn
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    console.log("🔥 [CS:GO] V42.8 修正版启动 - Core 42，作者DJ");

    // ================= V41 核心配置 (绝对保留) =================
    const DOMAIN_BASE = "http://work.cqdev.top";
    const URL_HOME_8989 = `${DOMAIN_BASE}:8989/CqSagereal/`;
    const API_DATA = `${DOMAIN_BASE}:8989/CqSagereal/controller/workLoad`;
    const API_LOGIN = `${DOMAIN_BASE}:8888/api/auth/login`;
    const API_PAGE_ADD = `${DOMAIN_BASE}:8989/CqSagereal/page/performance_workload_add`;

    // Mobiwire 配置
    const MW_URLS = {
        base: "https://www.mobiwire.com.cn",
        init: "https://www.mobiwire.com.cn/",
        login: "https://www.mobiwire.com.cn/login.asp",
        query: "https://www.mobiwire.com.cn/query.asp"
    };

    // Jira 配置
    const JIRA_INTERNAL = "http://jira.transsion.com";
    const JIRA_EXTERNAL = "http://jira-ex.transsion.com:6001";
    const URL_LOGIN_INT = `${JIRA_INTERNAL}/login.jsp`;
    const URL_LOGIN_EXT = `${JIRA_EXTERNAL}/login.jsp`;

    const STORAGE_KEY_AUTH = 'tm_csgo_v42_auth';
    const STORAGE_KEY_SUBMIT_HISTORY = 'tm_csgo_v42_submit_hist';
    const KEY_MENU_ORDER = 'tm_csgo_v42_menu_order';

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
            "Referer": `${URL_HOME_8989}page/main`,
            "Origin": URL_HOME_8989,
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

    async function ensureSagerealSession(updateStatus) {
        return new Promise((resolve) => {
            if (SESSION_ID_8989) { resolve(true); return; }
            GM_xmlhttpRequest({
                method: "GET", url: `${URL_HOME_8989}page/main`, headers: { "Accept": "text/html" }, withCredentials: true,
                onload: function(res) {
                    try {
                        const hdr = res.responseHeaders || "";
                        const lines = hdr.split(/[\r\n]+/);
                        for (let line of lines) {
                            if (line.toLowerCase().startsWith('set-cookie:')) {
                                const raw = line.substring(11).trim();
                                const m = raw.match(/JSESSIONID=([^;]+)/);
                                if (m && m[1]) { SESSION_ID_8989 = m[1]; }
                            }
                        }
                        // 触发一次业务页面以确保服务端会话可用
                        GM_xmlhttpRequest({ method: "GET", url: API_PAGE_ADD, headers: getHeaders(), withCredentials: true });
                    } catch(e) {}
                    resolve(true);
                }, onerror: () => resolve(false)
            });
        });
    }

    async function fetchProjectList(statusCb, forceRefresh = false) {
        if(!forceRefresh && PROJECT_LIST_CACHE.length > 0) return PROJECT_LIST_CACHE;
        await ensureSagerealSession(statusCb);
        statusCb("解析页面...");
        try {
            const html = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET", url: API_PAGE_ADD, headers: getHeaders(), withCredentials: true,
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
                GM_xmlhttpRequest({
                    method: "POST", url: API_DATA, headers: getHeaders(), data: params.toString(), withCredentials: true,
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
                            if (redirectUrl && !redirectUrl.startsWith('http')) redirectUrl = `${MW_URLS.base.replace('/query','')}/${redirectUrl}`;
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

    async function executeMobiwireFlow() {
        const logBox = document.getElementById('mw-log');
        const btn = document.getElementById('btn-load-salary');
        const auth = JSON.parse(GM_getValue(STORAGE_KEY_AUTH, '{}'));
        const mw = auth.mobiwire || {};
        const year = document.getElementById('mw-year').value;
        const start = parseInt(document.getElementById('mw-start').value);
        const end = parseInt(document.getElementById('mw-end').value);

        if(!mw.emp || !mw.pwd) { alert("请先在【账号设置】中配置Mobiwire工号和密码"); return; }
        const log = (msg) => { logBox.innerHTML += `<div>${msg}</div>`; logBox.scrollTop = logBox.scrollHeight; };

        btn.disabled = true; logBox.innerHTML = "> 🚀 初始化连接...<br>";
        COOKIE_JAR = {};

        try {
            await mwRequest("INIT", { url: MW_URLS.init });
            const params = new URLSearchParams();
            params.append("screenwidth", "1536"); params.append("empno", mw.emp);
            params.append("image.x", "37"); params.append("image.y", "26");
            params.append("Password", mw.pwd); params.append("Type", "Salary");

            const loginRes = await mwRequest("LOGIN", {
                method: "POST", url: MW_URLS.login, data: params.toString(),
                headers: { "Content-Type": "application/x-www-form-urlencoded", "Referer": MW_URLS.init, "Origin": "https://www.mobiwire.com.cn" }
            });

            if (!loginRes.redirectUrl) { log("❌ 登录失败，请检查账号密码"); btn.disabled = false; return; }
            await mwRequest("FOLLOW", { url: loginRes.redirectUrl, headers: { "Referer": MW_URLS.login } });
            log("✅ 登录成功，开始抓取...");

            let allMonthsData = []; let allKeys = new Set(["月份", "应发薪资", "实发工资(银行转账)"]);
            for(let m=start; m<=end; m++) {
                log(`📡 扫描 ${m}月...`);
                const qUrl = `${MW_URLS.query}?txt_year=${year}&txt_mon=${m}`;
                const res = await mwRequest("QUERY", { url: qUrl, headers: { "Referer": loginRes.redirectUrl } });

                if (res.text.includes("用户登录") || res.text.length < 500) { log("⚠️ Session失效"); continue; }

                const parser = new DOMParser(); const doc = parser.parseFromString(res.text, "text/html");
                const tds = doc.querySelectorAll('td');
                let monthData = { "月份": `${m}月` }; let hasData = false;
                const exclude = ["项目名称", "金额", "汇总部分", "明细部分", "工资项说明", "工资总额", "关闭", "薪资明细"];

                for (let i = 0; i < tds.length; i++) {
                    let key = tds[i].innerText.replace(/\s+/g, '').trim();
                    if (key.length > 15 || exclude.some(k => key.includes(k)) || !key) continue;
                    const nextTd = tds[i].nextElementSibling;
                    if (nextTd) {
                        const valStr = nextTd.innerText.replace(/,/g, '').trim();
                        if (/^-?\d+(\.\d+)?$/.test(valStr)) {
                            if (key.includes("银行转账")) key = "实发工资(银行转账)";
                            if (key.includes("应发薪资")) key = "应发薪资";
                            monthData[key] = parseFloat(valStr); hasData = true;
                            allKeys.add(key);
                        }
                    }
                }
                if(hasData) { allMonthsData.push(monthData); log(`✅ ${m}月数据获取成功`); }
                else log(`⚪ ${m}月无数据`);
                await new Promise(r => setTimeout(r, 400));
            }

            if(allMonthsData.length === 0) { log("❌ 未找到数据"); btn.disabled = false; return; }

            const headers = Array.from(allKeys);
            let csv = "\uFEFF" + headers.join(",") + "\n";
            allMonthsData.forEach(row => {
                csv += headers.map(h => row[h] !== undefined ? row[h] : 0).join(",") + "\n";
            });
            let totalRow = ["总计"], avgRow = ["平均"];
            for (let i = 1; i < headers.length; i++) {
                let sum = 0, count = 0;
                allMonthsData.forEach(row => { if(typeof row[headers[i]]==='number'){ sum+=row[headers[i]]; count++; } });
                totalRow.push(sum.toFixed(2)); avgRow.push(count ? (sum/count).toFixed(2) : "0.00");
            }
            csv += totalRow.join(",") + "\n" + avgRow.join(",") + "\n";

            const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `Mobiwire薪资_${year}.csv`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            log("🏆 报表已下载！");

        } catch(e) { console.error(e); log("❌ 发生错误"); }
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
        #csgo-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(18, 18, 18, 0.95); z-index: 2147483647; display: none; justify-content: center; align-items: center; font-family: 'Microsoft YaHei', sans-serif; backdrop-filter: blur(5px); opacity: 0; transition: opacity 0.2s; pointer-events: none; user-select: none; }
        #csgo-overlay.active { opacity: 1; pointer-events: auto; display: flex; }
        .csgo-container { display: flex; gap: 60px; align-items: center; flex-direction: row; }
        .left-section { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .wheel-wrapper { position: relative; width: 420px; height: 420px; border-radius: 50%; z-index: 20; transition: transform 0.1s cubic-bezier(0.1, 0.7, 1.0, 0.1); }
        .wheel-click-anim { transform: scale(0.95); }
        .wheel-sensor { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; cursor: crosshair; z-index: 30; }
        .wheel-visual { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle, rgba(50,50,50,1) 30%, rgba(20,20,20,0.8) 100%); border: 4px solid rgba(255, 255, 255, 0.1); box-shadow: 0 0 30px rgba(0,0,0,0.8); pointer-events: none; }
        .svg-sector { fill: transparent; stroke: rgba(255,255,255,0.05); stroke-width: 1; transition: all 0.15s ease; cursor: pointer; }
        .svg-sector.active { fill: rgba(234, 181, 67, 0.8); stroke: #fff; stroke-width: 2px; }
        .svg-sector.drag-target { fill: rgba(0, 255, 255, 0.5) !important; stroke: #00ffff !important; stroke-width: 3px; }
        .wedge-label { position: absolute; color: #888; text-align: center; pointer-events: none; z-index: 10; transition: 0.2s; font-size: 14px; width: 80px; height: 40px; display:flex; flex-direction:column; justify-content:center; align-items:center; }
        .wedge-label.active { color: #fff; font-weight: bold; transform: scale(1.1); text-shadow: 0 0 10px #eab543; }
        .wedge-label.drag-target { color: #00ffff !important; font-weight: bold; transform: scale(1.2); text-shadow: 0 0 10px #00ffff; }
        .center-hub { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px; border-radius: 50%; background: #222; border: 3px solid #eab543; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 40; box-shadow: 0 0 20px rgba(0,0,0,0.5); pointer-events: auto; cursor: pointer; transition: background 0.2s; }
        .center-hub:hover { background: #333; }
        .hub-text { color: #eab543; font-weight: bold; font-size: 16px; }
        .info-panel { width: 600px; height: 750px; background: rgba(30, 30, 30, 0.98); border-left: 4px solid #eab543; padding: 25px 30px; color: #ddd; box-shadow: 10px 10px 40px rgba(0,0,0,0.6); z-index: 50; display: flex; flex-direction: column; position: relative; overflow: hidden; pointer-events: auto !important; border-radius: 0 8px 8px 0; }
        .view-container { display: flex; flex-direction: column; height: 100%; transition: opacity 0.2s; width: 100%; overflow-y: auto; }
        .view-container.hidden { display: none; opacity: 0; }
        .panel-header { font-size: 24px; color: #eab543; margin-bottom: 20px; border-bottom: 1px solid #555; padding-bottom: 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        /* 1. 普通输入框保持不变 */
        .cs-input, .add-input, .add-textarea { background: #111; border: 1px solid #444; color: #fff; padding: 10px; border-radius: 4px; font-family: 'Microsoft YaHei'; cursor: text !important; width: 100%; color-scheme: dark; font-size: 14px; box-sizing: border-box; }
        /* 2. 下拉框单独设置（减小内边距，防止文字被切） */
        .add-select { background: #111; border: 1px solid #444; color: #fff; padding: 5px; border-radius: 4px; font-family: 'Microsoft YaHei'; cursor: pointer; width: 100%; color-scheme: dark; font-size: 14px; box-sizing: border-box; outline: none; }
        .cs-input:focus, .add-input:focus, .add-select:focus { border-color: #eab543; outline: none; background: #000; }
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
        .action-btn { width: 100%; background: #eab543; color: #000; border: none; padding: 12px; font-weight: bold; font-size: 16px; cursor: pointer; border-radius: 4px; margin-top: 15px; transition: 0.2s; }
        .action-btn:hover { background: #f1c40f; transform: translateY(-1px); }
        .sub-btn { background: transparent; border: 1px solid #555; color: #aaa; margin-top: 10px; font-size: 13px; padding: 8px; width: 100%; cursor: pointer; border-radius: 4px; }
        .sub-btn:hover { border-color: #eab543; color: #eab543; }
        .stats-box { background: #222; padding: 20px; border: 1px solid #444; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 6px; }
        .stat-item { text-align: center; flex: 1; }
        .stat-val { font-size: 32px; color: #eab543; font-weight: bold; }
        .stat-lbl { font-size: 14px; color: #888; }
        .grade-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; background: #1a1a1a; padding: 15px; border-radius: 6px; }
        .grade-item { background: #2d2d2d; border: 1px solid #333; padding: 10px; text-align: center; border-radius: 4px; }
        .grade-item.high-tier { border-color: #eab543; background: rgba(234, 181, 67, 0.1); }
        .g-val { font-size: 20px; font-weight: bold; color: #eee; }
        .high-tier .g-val { color: #eab543; }
        .inventory-list { display: flex; flex-direction: column; gap: 10px; overflow-y:auto; max-height:450px; }
        .inv-item { background: #222; border: 1px solid #333; padding: 12px; border-radius: 4px; display: flex; align-items: center; transition: 0.2s; }
        .inv-item:hover { border-color: #eab543; background: #282828; }
        .inv-del { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: #e74c3c; cursor: pointer; font-size: 16px; margin-left: 10px; border-radius: 4px; }
        .inv-del:hover { background: rgba(231, 76, 60, 0.2); }
        .proj-search-wrapper { position: relative; display: flex; gap: 5px; }
        .proj-dropdown { position: absolute; top: 100%; left: 0; width: 100%; max-height: 250px; overflow-y: auto; background: #222; border: 1px solid #444; z-index: 100; display: none; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
        /* 增加了 word-break 和 white-space 属性 */
        .proj-option { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #333; font-size: 14px; transition: 0.1s; white-space: normal; word-break: break-word; line-height: 1.4; }
        .proj-option:hover { background: #eab543; color: #000; }
        .proj-refresh-btn { width: 35px; background: #333; border: 1px solid #444; color: #eab543; cursor: pointer; display:flex; align-items:center; justify-content:center; font-size:16px; border-radius:4px; }
        .proj-refresh-btn:hover { background: #444; }
        .manual-btn { margin-top: 20px; background: #333; color: #888; border: 1px solid #444; padding: 8px 20px; border-radius: 20px; cursor: pointer; font-size: 12px; transition: 0.2s; display: flex; align-items: center; gap: 5px; }
        .manual-btn:hover { color: #eab543; border-color: #eab543; background: #222; }
        #manual-modal { position: fixed; top: 10%; right: 10%; width: 600px; max-height: 80vh; background: rgba(30,30,30,0.95); border: 2px solid #eab543; z-index: 2147483648; display: none; overflow-y: auto; color: #ccc; border-radius: 8px; backdrop-filter: blur(10px); box-shadow: 0 0 50px rgba(0,0,0,0.8); cursor: default; }
        .manual-header { padding: 15px; background: rgba(234, 181, 67, 0.1); border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; }
        .manual-header h2 { margin: 0; color: #eab543; font-size: 18px; }
        .manual-content { padding: 20px; font-size: 14px; line-height: 1.6; }
        .manual-content h3 { color: #fff; border-bottom: 1px solid #555; padding-bottom: 5px; margin-top: 20px; }
        .manual-content ul { padding-left: 20px; }
        .manual-content li { margin-bottom: 8px; }
        .close-manual { color: #888; cursor: pointer; font-size: 24px; transition: 0.2s; }
        .close-manual:hover { color: #fff; }
        .auth-section { background: #252525; padding: 20px; border: 1px solid #444; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .auth-section-title { position: static; background: transparent; font-size: 16px; color: #eab543; font-weight: bold; margin-bottom: 15px; display: block; border-left: 3px solid #eab543; padding-left: 10px; }
        .auth-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
        .auth-label { font-size: 13px; color: #ccc; font-weight: bold; }
        .auth-input { width: 100%; box-sizing: border-box; background: #111; border: 1px solid #444; color: #fff; padding: 12px; border-radius: 4px; font-size: 14px; transition: 0.2s; }
        .auth-input:focus { border-color: #eab543; background: #000; outline: none; }
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
                    <button id="btn-open-manual" class="manual-btn">📘 版本说明书 (V42.8)</button>
                </div>

                <div class="info-panel" id="panel-right" style="opacity:0; pointer-events:none;">
                    <div id="view-query" class="view-container hidden">
                        <div class="panel-header"><div>📊 工作量统计</div><div style="font-size:12px;color:#666;">core 42，作者DJ</div></div>
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
                        <div id="status-bar" style="color: #eab543; font-size: 13px; margin-bottom: 10px; height: 20px; text-align:center;">就绪</div>
                        <button id="btn-buy" class="action-btn">确认查询</button>
                    </div>

                    <div id="view-add" class="view-container hidden">
                        <div class="panel-header"><div>📝 填写工作量</div><div style="font-size:12px;color:#666;">core 42，作者DJ</div></div>
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
                        <div id="add-status" style="color: #eab543; font-size: 13px; margin: 5px 0; text-align:center;"></div>
                        <button id="btn-submit-work" class="action-btn">提交工作量</button>
                    </div>

                    <div id="view-salary" class="view-container hidden">
                        <div class="panel-header"><div>💰 薪资报表 (Mobiwire)</div><div style="font-size:12px;color:#666;">core 42，作者DJ</div></div>
                        <div style="text-align:center; padding: 20px;">
                            <div style="display:flex; gap:12px; justify-content:center; margin-bottom:15px; align-items:center;">
                                <span>年份</span>
                                <input type="number" id="mw-year" value="${new Date().getFullYear()}" class="cs-input" style="width:80px; height:28px; padding:4px 8px;">
                                <select id="mw-start" class="add-select" style="width:90px; height:28px; padding:4px 8px;">${makeMonthOpts(1)}</select>
                                <span>至</span>
                                <select id="mw-end" class="add-select" style="width:90px; height:28px; padding:4px 8px;">${makeMonthOpts(12)}</select>
                            </div>
                            <button id="btn-load-salary" class="action-btn">生成全能报表</button>
                            <div id="mw-log" style="color:#888; font-size:12px; margin-top:10px; text-align:left; height:300px; overflow-y:auto; background:#111; padding:10px; border-radius:4px;">等待查询...</div>
                        </div>
                    </div>

                    <div id="view-settings" class="view-container hidden">
                        <div class="panel-header"><div>⚙️ 账号设置</div><div style="font-size:12px;color:#666;">core 42，作者DJ</div></div>
                        <div class="auth-form">
                            <div class="auth-section">
                                <div class="auth-section-title">工时系统 (Sagereal)</div>
                                <div class="auth-group"><label class="auth-label">工号</label><input type="text" id="cfg-sr-job" class="auth-input" placeholder="请输入工号"></div>
                                <div class="auth-group"><label class="auth-label">密码</label><input type="password" id="cfg-sr-pwd" class="auth-input" placeholder="请输入密码 (支持明文/MD5)"></div>
                            </div>
                            <div class="auth-section">
                                <div class="auth-section-title">薪资系统 (Mobiwire)</div>
                                <div class="auth-group"><label class="auth-label">工号</label><input type="text" id="cfg-mw-emp" class="auth-input" placeholder="请输入工号"></div>
                                <div class="auth-group"><label class="auth-label">密码</label><input type="password" id="cfg-mw-pwd" class="auth-input" placeholder="请输入密码"></div>
                            </div>
                        </div>
                        <button id="btn-save-cfg" class="action-btn">保存配置</button>
                    </div>

                    <div id="view-history" class="view-container hidden">
                        <div class="panel-header"><div>📜 填报历史</div><div style="font-size:12px;color:#666;">core 42，作者DJ</div></div>
                        <div class="hist-summary" style="display:flex; justify-content:space-around; margin-bottom:15px; background:#222; padding:10px; border-radius:4px;">
                            <div class="hist-sum-item"><div>本月已填</div><div class="hist-sum-val" id="hist-month-val" style="color:#eab543; font-weight:bold;">0h</div></div>
                            <div style="width:1px; background:#444;"></div>
                            <div class="hist-sum-item"><div>本季已填</div><div class="hist-sum-val" id="hist-quarter-val" style="color:#eab543; font-weight:bold;">0h</div></div>
                        </div>
                        <div id="inventory-list" class="inventory-list"></div>
                        <button id="btn-clear-hist" class="sub-btn">清空历史</button>
                    </div>
                </div>
            </div>

            <div id="manual-modal">
                <div class="manual-header" id="manual-header"><h2>📘 战术指挥官操作手册 V42.8</h2><div class="close-manual" id="close-manual">×</div></div>
                <div class="manual-content">
                    <h3>🏆 V42.8 修正版更新</h3>
                    <ul>
                        <li><strong>UI显示修复</strong>：修复了表单显示不全的问题，面板高度恢复为固定750px（从min-height改为固定height），添加overflow: hidden处理，确保所有内容正常显示和滚动。</li>
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
        document.body.appendChild(overlay);

        // 绑定数据与事件
        const SCORE_RULES = { 'S': 32.0, 'A': 14.0, 'B': 7.2, 'C': 2.0, 'D': 1.0, 'E': 0.3 };
        document.getElementById('grade-grid').innerHTML = Object.keys(SCORE_RULES).map(k => { const isHigh = (k === 'S' || k === 'A'); return `<div class="grade-item ${isHigh ? 'high-tier' : ''}"><span class="g-label">${k}级</span><span class="g-val" id="cnt-${k}">0</span></div>`; }).join('');

        const panel = document.getElementById('panel-right');
        const searchInput = document.getElementById('add-proj-search');
        const dropdown = document.getElementById('proj-dropdown');
        const modal = document.getElementById('manual-modal');

        ['click', 'mousedown', 'mouseup', 'keydown', 'keyup'].forEach(evt => panel.addEventListener(evt, e => e.stopPropagation()));
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

        // 绑定按钮事件
        document.getElementById('btn-buy').onclick = queryWorkload;
        document.getElementById('btn-save-cfg').onclick = saveSettings;
        document.getElementById('btn-clear-hist').onclick = clearHistory;
        document.getElementById('btn-load-salary').onclick = executeMobiwireFlow;
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

    // ================= 轮盘逻辑 (V42.6 恢复二级菜单) =================
    const DEFAULT_MENUS = [
        { id: 'query', label: '工作量统计', desc: 'Stats', locked: true },
        { id: 'add', label: '填写工作量', desc: 'Add Work', locked: true },
        { id: 'history', label: '历史记录', desc: 'History', locked: true },
        { id: 'salary', label: '薪资报表', desc: 'Salary', locked: true },
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
            count: 8
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
                if(currentMode === 'TIMESHEET') alert("工时系统模块开发中...");
            }
        }
        
        renderWheel('MENU');

        // ★★★ V42.6 恢复：拖拽与点击逻辑（支持二级菜单） ★★★
        sensor.addEventListener('mousedown', (e) => {
            if (currentMode !== 'MENU') return; // 只在主菜单时允许拖拽排序
            const rect = sensor.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
            if (angle < 0) angle += 360;
            if (angle >= 360) angle -= 360;
            if (angle >= 360) angle -= 360;
            if (angle >= 360) angle -= 360;
            if (angle >= 360) angle -= 360;
            if (angle >= 360) angle -= 360;
            const idx = Math.floor(angle / (360 / MENUS[currentMode].count));
            if (idx >= 0 && idx < MENUS[currentMode].count) {
                dragStartSector = idx;
                dragStartPos = { x: e.clientX, y: e.clientY };
                isDragging = false;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (dragStartSector !== null && currentMode === 'MENU') {
                const dist = Math.sqrt(Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2));
                if (dist > 10) {
                    isDragging = true;
                    document.querySelectorAll('.svg-sector').forEach(el => el.classList.remove('drag-target'));
                    const rect = sensor.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
                    if (angle < 0) angle += 360;
                    if (angle >= 360) angle -= 360;
                    const currentIdx = Math.floor(angle / (360 / MENUS[currentMode].count));
                    if(currentIdx !== dragStartSector && svgMain.children[currentIdx]) {
                        svgMain.children[currentIdx].classList.add('drag-target');
                    }
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (dragStartSector !== null) {
                if (isDragging && currentMode === 'MENU') {
                    // 交换逻辑（仅主菜单）
                    const rect = sensor.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
                    if (angle < 0) angle += 360;
                    if (angle >= 360) angle -= 360;
                    const dropIdx = Math.floor(angle / (360 / MENUS[currentMode].count));
                    if (dropIdx !== dragStartSector && dropIdx >= 0 && dropIdx < MENUS[currentMode].count) {
                        const temp = menuOrder[dragStartSector];
                        menuOrder[dragStartSector] = menuOrder[dropIdx];
                        menuOrder[dropIdx] = temp;
                        GM_setValue(KEY_MENU_ORDER, JSON.stringify(menuOrder));
                        renderWheel('MENU');
                    }
                } else if (!isDragging && currentMode === 'MENU') {
                    // 主菜单点击：使用记录的索引直接导航，避免角度重算误判
                    const targetId = menuOrder[dragStartSector];
                    if (targetId) {
                        const el = document.getElementById(`sec-${targetId}`);
                        if (el && el.classList.contains('disabled')) {
                            alert("⚠️ 请先在[账号设置]中配置萨瑞系统账号");
                            renderWheel('SETTINGS');
                        } else {
                            const wrapper = document.getElementById('wheel-wrapper');
                            wrapper.classList.add('wheel-click-anim');
                            setTimeout(() => wrapper.classList.remove('wheel-click-anim'), 100);
                            if (targetId === 'query') { renderWheel('QUERY'); setDates('curr'); }
                            else if (targetId === 'add') renderWheel('ADD');
                            else if (targetId === 'settings') renderWheel('SETTINGS');
                            else if (targetId === 'history') renderWheel('HISTORY');
                            else if (targetId === 'salary') renderWheel('SALARY');
                            else if (targetId === 'timesheet') renderWheel('TIMESHEET');
                            else if (targetId === 'jira') GM_openInTab(URL_LOGIN_INT, { active: true });
                            else if (targetId === 'jira-ex') GM_openInTab(URL_LOGIN_EXT, { active: true });
                        }
                    } else {
                        // 回退：无法获取索引时按角度重算
                        handleWheelClick(e);
                    }
                }
            } else if (currentMode === 'MENU') {
                // 兜底：即使未命中mousedown，也在mouseup时按当前位置计算索引并导航
                const rect = sensor.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
                if (angle < 0) angle += 360;
                if (angle >= 360) angle -= 360;
                const idx = Math.floor(angle / (360 / MENUS[currentMode].count));
                const targetId = menuOrder[idx];
                if (targetId) {
                    const el = document.getElementById(`sec-${targetId}`);
                    if (el && el.classList.contains('disabled')) {
                        alert("⚠️ 请先在[账号设置]中配置萨瑞系统账号");
                        renderWheel('SETTINGS');
                    } else {
                        const wrapper = document.getElementById('wheel-wrapper');
                        wrapper.classList.add('wheel-click-anim');
                        setTimeout(() => wrapper.classList.remove('wheel-click-anim'), 100);
                        if (targetId === 'query') { renderWheel('QUERY'); setDates('curr'); }
                        else if (targetId === 'add') renderWheel('ADD');
                        else if (targetId === 'settings') renderWheel('SETTINGS');
                        else if (targetId === 'history') renderWheel('HISTORY');
                        else if (targetId === 'salary') renderWheel('SALARY');
                        else if (targetId === 'timesheet') renderWheel('TIMESHEET');
                        else if (targetId === 'jira') GM_openInTab(URL_LOGIN_INT, { active: true });
                        else if (targetId === 'jira-ex') GM_openInTab(URL_LOGIN_EXT, { active: true });
                    }
                }
            }
            dragStartSector = null;
            isDragging = false;
            document.querySelectorAll('.svg-sector').forEach(el => el.classList.remove('drag-target'));
        });

        

        // ★★★ V42.6 修复：添加独立的click事件监听器处理二级菜单点击 ★★★
        sensor.addEventListener('click', (e) => {
            // 只在非主菜单模式下处理点击（二级菜单）
            if (currentMode === 'MENU') return; // 主菜单的点击由mouseup处理（支持拖拽）
            
            // 重新计算点击的目标扇区（确保准确性）
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
                    targetId = data.sectors[idx].id;
                }
            }

            if (!targetId) return;
            
            const el = document.getElementById(`sec-${targetId}`);
            if (el && el.classList.contains('disabled')) {
                alert("⚠️ 请先在[账号设置]中配置萨瑞系统账号");
                renderWheel('SETTINGS');
                return;
            }

            const wrapper = document.getElementById('wheel-wrapper');
            wrapper.classList.add('wheel-click-anim');
            setTimeout(() => wrapper.classList.remove('wheel-click-anim'), 100);

            if (currentMode === 'QUERY') {
                setDates(targetId);
                // 确保面板显示
                panel.style.opacity = '1';
                panel.style.pointerEvents = 'auto';
                document.getElementById('view-query').classList.remove('hidden');
            } else if (currentMode === 'ADD') {
                if (targetId === 'submit') submitWorkloadAction();
                else if (targetId === 'reset') {
                    document.getElementById('add-bug').value = '';
                    document.getElementById('add-content').value = '';
                }
                else if (targetId === 'back') renderWheel('MENU');
            } else if (targetId === 'back') {
                renderWheel('MENU');
            }
        });

        // ★★★ V42.6 恢复：点击处理函数（支持二级菜单） ★★★
        function handleWheelClick(e) {
            const data = MENUS[currentMode];
            let targetId = null;
            const rect = sensor.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
            if (angle < 0) angle += 360;

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

            if (!targetId) return;
            
            const el = document.getElementById(`sec-${targetId}`);
            if (el && el.classList.contains('disabled')) {
                alert("⚠️ 请先在[账号设置]中配置萨瑞系统账号");
                renderWheel('SETTINGS');
                return;
            }

            const wrapper = document.getElementById('wheel-wrapper');
            wrapper.classList.add('wheel-click-anim');
            setTimeout(() => wrapper.classList.remove('wheel-click-anim'), 100);

            if (currentMode === 'MENU') {
                if (targetId === 'query') { renderWheel('QUERY'); setDates('curr'); }
                else if (targetId === 'add') renderWheel('ADD');
                else if (targetId === 'settings') renderWheel('SETTINGS');
                else if (targetId === 'history') renderWheel('HISTORY');
                else if (targetId === 'salary') renderWheel('SALARY');
                else if (targetId === 'timesheet') renderWheel('TIMESHEET');
                else if (targetId === 'jira') GM_openInTab(URL_LOGIN_INT, { active: true });
                else if (targetId === 'jira-ex') GM_openInTab(URL_LOGIN_EXT, { active: true });
            } else if (currentMode === 'QUERY') {
                setDates(targetId);
            } else if (currentMode === 'ADD') {
                if (targetId === 'submit') submitWorkloadAction();
                else if (targetId === 'reset') {
                    document.getElementById('add-bug').value = '';
                    document.getElementById('add-content').value = '';
                }
                else if (targetId === 'back') renderWheel('MENU');
            } else if (targetId === 'back') {
                renderWheel('MENU');
            }
        }

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
            document.querySelectorAll('.view-container').forEach(el => el.classList.add('hidden'));
            document.getElementById('panel-right').style.opacity = '0';
            document.getElementById('panel-right').style.pointerEvents = 'none';
        } else overlay.classList.remove('active');
    }
    function bindGlobalKeys() {
        document.addEventListener('keydown', (e) => { if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); toggleOverlay(); }});
    }
    function saveSettings() {
        const srJob = document.getElementById('cfg-sr-job').value.trim();
        const srPwd = document.getElementById('cfg-sr-pwd').value.trim();
        const mwEmp = document.getElementById('cfg-mw-emp').value.trim();
        const mwPwd = document.getElementById('cfg-mw-pwd').value.trim();
        const auth = { sagereal: { jobNum: srJob, password: srPwd }, mobiwire: { emp: mwEmp, pwd: mwPwd } };
        GM_setValue(STORAGE_KEY_AUTH, JSON.stringify(auth));
        alert("✅ 配置已保存！");
    }
    function loadSettings() {
        const auth = JSON.parse(GM_getValue(STORAGE_KEY_AUTH, '{}'));
        if (auth.sagereal) { document.getElementById('cfg-sr-job').value = auth.sagereal.jobNum || ""; document.getElementById('cfg-sr-pwd').value = auth.sagereal.password || ""; }
        if (auth.mobiwire) { document.getElementById('cfg-mw-emp').value = auth.mobiwire.emp || ""; document.getElementById('cfg-mw-pwd').value = auth.mobiwire.pwd || ""; }
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
                    GM_xmlhttpRequest({
                        method: "POST", url: API_DATA, headers: getHeaders(), data: params.toString(), withCredentials: true,
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
            div.innerHTML = `<div style="flex:1"><div style="font-weight:bold;color:#eab543">${item.bug} <span style="font-size:12px;color:#666">${item.workDate}</span></div><div style="font-size:12px;color:#aaa">${item.content}</div></div><div style="font-weight:bold">${item.hours}h</div><div class="inv-del">×</div>`;
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
