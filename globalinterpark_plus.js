// ==UserScript==
// @name         globalinterpark plus
// @namespace    https://raw.githubusercontent.com/hlianghsun/tampemonkeyUserscripts/main/globalinterpark_plus.js
// @version      0.4.1
// @description  lets get globalinterpark booking quickly!
// @author       Lucian Huang
// @match        https://www.globalinterpark.com/detail/*
// @match        https://ticket.globalinterpark.com/*
// @match        https://gpoticket.globalinterpark.com/Global/Play/Book/*
// @icon         https://openimage.interpark.com/UI/favicon/ticket_favicon.ico
// @grant        none
// ==/UserScript==


(async function() {
    'use strict';
    const settings = {
        date: "20230804", //表演日期
        time: "6:00 PM",  //表演場次時間
        numOfTickets: 1,  //訂購票數, 若超出場次購票上限，已上限為主
        bookingInfo: {    //訂購人資訊
            name: "YUYA HUANG",
            b_year: "1986",
            b_month: "03",
            b_date: "11",
            // email: "slhs00837@gmail.com",
            phone: "0910000000",
            cellPhone: "0910000000"
        },
        payment: {        //付款資訊
            type: "Visa", //Visa, Master, JCB, Other (credit cards)
            card: ["8888","8888","8888","8888"],
            expired: ["2121","12"],
        },
        autoFindSeatsDelay: 0.5, //自動換下一區座位表延遲秒數，若<0則不會啟動自動掃區。建議不要設０，系統好像會擋
        autoFindSeatsStart: true,
        autoNextPage: {        //自動跳轉下一步
            BookDatetime: true,
            BookSeat: false,
            BookPrice: true,
            BookDelivery: true,
            BookPayment: true,
            BookConfirm: true,
        }
    }

    const id = `globalinterpark-plus-${settings.date}`;

    const isPath = (pathName) => (location.pathname.indexOf(pathName) == 0);

    const getParams = () => {
        const str = location.search ? location.search.substr(1): "";
        const params = Object.fromEntries(new URLSearchParams(str));
        return params;
    }

    const waiting = (condition, dalay = 200) => {
        return new Promise((resolve) => {
            const id = setInterval(() => {
                if (condition()) {
                    clearInterval(id);
                    resolve();
                }
            }, dalay);
        });
    }

    const trigger = (el, etype) => {
        const evt = new Event( etype, { bubbles: true } );
        el.dispatchEvent( evt );
    };

    const insertMessageBox = (defaultMessage = 'globalinterpark(+) ready') => {
        const div = document.createElement('div');
        div.id = `${id}-msgbox`;
        div.className = `globalinterpark-plus-msgbox`;
        div.style.position = 'fixed';
        div.style.bottom = '10px';
        div.style.left = '10px';
        div.style.maxWidth = '100%'
        div.style.color = 'white';
        div.style.fontSize = '16px';
        div.style.background = 'black';
        div.style.padding = '10px 5px';
        div.style.zIndex = 999;
        div.style.borderRadius = "3px";
        div.style.boxShadow = '0 0 5px 5px rgba(0,0,0,0.3)';
        div.innerHTML = defaultMessage;
        document.body.appendChild(div);
        return div;
    }

    const setMessage = (message, color='white') => {
        let testWindow = window;
        let msg = document.getElementById(`${id}-msgbox`);
        while(!msg) {
            if (testWindow == testWindow.parent) {
                break;
            }
            testWindow = testWindow.parent;
            msg = testWindow.document.getElementById(`${id}-msgbox`);
        }
        if (msg) {
            msg.innerHTML = message;
            msg.style.color = color;
        }
        return msg;
    }

    const hideRecaptcha = () => {
        const fn = (hidId) => {
            const elem = document.getElementById(hidId);
            if (elem) {
                elem.style.display = 'none';
                window.CaptchaYN = 'N';
                console.log(`hide ${hidId} @ ${location.pathname}`);
            }
        }
        fn('divRecaptcha');
        fn('divRecaptchaWrap');
    }

    const selectOption = async (elem, optionValue, isValue = true) => {
        if (!elem) {
            return;
        }
        const selectId = elem.id || elem.name;

        setMessage(`setting selection => ${selectId}`);
        trigger(elem, 'click');
        setMessage(`waiting options => ${selectId}`);

        let option;
        await waiting(() => {
            for (var i = 0; i < elem.children.length; i++ ){
                const o = elem.children[i];
                const value = isValue ? o.value : o.innerText;
                if (optionValue) {
                    if (value == optionValue ) {
                        option = o;
                        break;
                    }
                } else {
                    if (value != null && value !== "" ) {
                        option = o;
                        break;
                    }
                }
            }
            return !!option;
        });
        setMessage(`choose option => ${selectId} = ${option.innerHTML}`);

        for (let i = 0; i < elem.children.length; i++ ){
            elem.children[i].selected = (elem.children[i] == option);
        }
        elem.setAttribute('value', option.getAttribute('value'));
        trigger(elem, 'change');
    }

    const fillField = (eid, valuePath) => {
        const elem = document.getElementById(eid);
        if (elem) {
            let value = settings;
            for (let i = 0; i<valuePath.length; i++) {
                value = value[valuePath[i]];
            }
            elem.value = value;
        }
    }

    // console.log(location.pathname);
    // console.log(getParams());

    if(isPath('/detail/edetail')){
        const currentURL = location.href;

        const div = document.createElement('div');
        div.id = `${id}-config`;
        div.className = `globalinterpark-plus-config`;
        div.style.position = 'fixed';
        div.style.top = '130px';
        div.style.left = '10px';
        div.style.maxWidth = '100%'
        div.style.fontSize = '16px';
        div.style.padding = '10px 5px';
        div.style.zIndex = 999;
        div.style.border = '2px solid yellow';
        div.style.borderRadius = "3px";
        div.style.boxShadow = '0 0 5px 5px rgba(255,255,0,0.3)';
        div.style.background = 'rgba(255,255,255,0.7)';

        div.appendChild(document.createTextNode('Reload Page every  '));
        const input = document.createElement('input');
        input.type = 'number';
        input.value = 0.3;
        input.step = 0.1;
        input.min = 0;
        input.style.width = '50px';
        input.onchange = (e) => {
            const match = document.getElementById('product_detail_area').src.match(/^(.*)#([\d.]+)$/);
            if (match) {
                document.getElementById('product_detail_area').src = `${match[1]}#${e.target.value}`;
            }
        }
        div.appendChild(input);
        div.appendChild(document.createTextNode('  second(s).  '));

        const button = document.createElement('button');
        button.type = 'button';
        button.innerHTML = 'Start/Stop';
        button.onclick = (e) => {
            const src = document.getElementById('product_detail_area').src;
            const match = src.match(/^(.*)#([\d.]+)$/);
            if (!match) {
                document.getElementById('product_detail_area').src = `${src}#${e.target.parentNode.children[0].value}`;
            } else {
                document.getElementById('product_detail_area').src = match[1];
            }
        }
        div.appendChild(button);

        document.body.appendChild(div);
        return div;
    } else if (isPath('/Global/Play/CBT/GoodsInfo_CBT.asp')) {
        const match = location.href.match(/^(.*)#([\d.]+)$/);
        const now = new Date();
        const msgBox = insertMessageBox(`Auto-Reload: ${match ? ` ${match[2]}sec.`: 'OFF'}<br/><br/>Play Date: ${settings.date}<br/><br/>Update Time: ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`);
        msgBox.style.bottom = 'unset';
        msgBox.style.top = '0';

        if(!document.getElementsByClassName('btn_Booking').length) {
            if (match) {
                setTimeout(() => location.reload(), 1000 * match[2]);
            }
        } else {
            selectOption(document.getElementById('play_date'), settings.date);
            await waiting(() => document.getElementById('play_time').value );
            if (match) {
                window.fnNormalBooking();
                setMessage('<b>Window open</b><br/>Reload stopped.', 'yellow');
                location.replcae(match[1]);
            } else {
                setMessage('<b>Ready</b>', 'yellow');
            }
        }

    } else if (isPath('/Global/Play/Book/BookMain.asp')) {
        insertMessageBox();

    } else if (isPath('/Global/Play/Book/BookDatetime.asp')) {
        setMessage(`BookDatetime`);
        if (!window.$F("PlayDate")) {
            window.fnSelectPlayDate(0, settings.date);
            setMessage(`set date = ${settings.date}`);
            let cellPlaySeq;
            await waiting(() => {
                cellPlaySeq = document.getElementsByName('CellPlaySeq');
                return cellPlaySeq.length > 0;
            })
            for (let i = 0; i<cellPlaySeq.length; i++ ){
                if (cellPlaySeq[i].innerText == settings.time) {
                    setMessage(`set date = ${settings.date} / time = ${settings.time}`);
                    trigger(cellPlaySeq[i], 'click');
                    break;
                }
            }
        }
        settings.autoNextPage.BookDatetime && window.top.fnNextStep('P');
    } else if (isPath('/Global/Play/Book/BookSeat.asp')) {
        setMessage(`BookSeat`);
        // hideRecaptcha();
        let input = document.getElementsByClassName('validationTxt');
        if (input.length) {
            trigger(input[0], 'click');
        }

        if (settings.autoFindSeatsDelay < 0) {
            return;
        }
        await waiting(() => window.BlockBuffer.index > 0)
        const blocks = window.BlockBuffer.Data.slice(0, window.BlockBuffer.index);
        let blockCnt = {};
        for(let i = 0; i < blocks.length; i++) {
            const floor = blocks[i].SeatBlock.substr(0,1);
            const seq = blocks[i].SeatBlock.substr(1);
            const grade = blocks[i].SeatGrade;
            const key = `${grade}${floor}`;
            blockCnt[key] ? blockCnt[key].push(seq) : (blockCnt[key] = [seq]);
        }
        // console.log(blockCnt);
        const maxSeats = Math.min(settings.numOfTickets, window.TicketCnt_Max);
        const getBlockCode = (b) => {
            const floor = b.SeatBlock.substr(0,1);
            const seq = b.SeatBlock.substr(1);
            const grade = b.SeatGrade;
            const key = `${grade}${floor}`;
            const countOfZone = blockCnt[key].length;
            let new_seq = Math.floor(Math.abs(blockCnt[key].indexOf(seq) - ((countOfZone-1)/2)));
            let zone;
            if (floor == '0') {
                zone = 0;
            } else {
                zone = new_seq <= (Math.floor(countOfZone/4)) ? 0 : 1;
                zone = zone + Math.ceil((floor-1)/3);
            }
            return `${9-Math.min(b.RemainCnt,maxSeats,9)}${grade}${zone}${floor}${new_seq < 10 ? "0" : ""}${new_seq}`;
        }
        blocks.sort((a, b) => getBlockCode(a) - getBlockCode(b));

        const div = document.createElement('div');
        div.id = `${id}-blocks`;
        div.style.position = 'fixed';
        div.style.top = '60px';
        div.style.right = '240px';
        div.style.maxWidth = '100%';
        div.style.maxHeight = 'calc(100vh - 100px)';
        div.style.overflowY = 'auto';
        div.style.padding = '10px 5px';
        div.style.zIndex = 999;
        div.style.boxShadow = '0px 0px 5px 5px rgba(0,0,0,0.3)';
        div.style.background = 'rgba(255,255,255,0.7)';

        for(let i = 0; i < blocks.length; i++) {
            const a = document.createElement('div');
            a.id = `block-${blocks[i].SeatBlock}`;
            a.style.fontSize = '9px';
            a.style.display = 'block';
            a.style.color = 'black';
            a.style.cursor = 'pointer';
            a.onclick = () => {
                div.setAttribute('data-target', i);
                a.style.color = 'red';
                window.fnBlockSeatUpdate('', '', blocks[i].SeatBlock)
            };
            a.innerHTML = `${blocks[i].SeatBlock} ${blocks[i].SeatGradeName}(${blocks[i].RemainCnt})`;
            div.appendChild(a);
        }
        document.body.appendChild(div);

        if(settings.autoFindSeatsStart === true){
            trigger(div.children[0], 'click');
        }

    } else if (isPath('/Global/Play/Book/BookSeatDetail.asp')) {
        if (!document.getElementsByClassName("SeatT").length) {
            // setMessage(`can not select seat(s) in this page.`);
            return;
        }
        const seats = document.getElementsByName('Seats');
        if (seats.length == 0) {
            setMessage(`Block: ${document.getElementsByTagName('font')[0].innerText} find 0 seat(s)`, 'red');
            const blockList = settings.autoFindSeatsDelay > 0 ?
                  window.parent.document.getElementById(`${id}-blocks`) :
                  null;
            if (blockList) {
                let target = parseInt(blockList.getAttribute('data-target'));
                if (parseInt(target) === Number.NaN) {
                    window.parent.fnSeatUpdate();
                    return;
                }
                blockList.children[target].style.color = 'lightgray';
                target++;
                if (blockList.children.length <= (target)){
                    window.parent.location.reload();
                }
                await new Promise(r=>{setTimeout(() => r(), settings.autoFindSeatsDelay * 1000)})
                trigger(blockList.children[target], 'click');
                blockList.scrollTop = blockList.children[target].offsetTop;
            } else {
                window.parent.fnSeatUpdate();
            }
            return;
        }
        setMessage(`find ${seats.length} seat(s)`);

        const maxSeats = Math.min(seats.length, settings.numOfTickets, window.parent.TicketCnt_Max);
        if (!maxSeats) {
            return;
        }
        for (let i = 0 ; i < maxSeats ; i++ ) {
            setMessage(`find ${seats.length} seat(s) / selecting (${i+1}/${maxSeats})`);
            trigger(seats[i], 'click');
            await waiting(() => window.parent.document.getElementById('SelectedSeatCount').innerHTML == (i+1), 50);
        }
        if (settings.autoNextPage.BookSeat === true) {
            if (window.parent.document.getElementById("rcckYN").value != "Y") {
                setMessage(`waiting page locker`);
                await waiting(() => window.parent.document.getElementById("rcckYN").value == "Y");
            }
            window.parent.fnSelect(); // next page;
        }
    } else if (isPath('/Global/Play/Book/BookPrice.asp')) {
        setMessage(`BookPrice`);
        const elem = document.getElementsByName("SeatCount")[0];
        const totalTix = window.parent.document.getElementById('MySelectedSeatCnt').innerText;
        await selectOption(elem, ((totalTix > 0) ? totalTix : settings.numOfTickets));

        setMessage(`set ${elem.value} seat(s)`);
        await waiting(() => window.parent.document.getElementById('MyTotalAmt').innerText != '0', 50);

        settings.autoNextPage.BookPrice && window.parent.fnNextStep('P'); // next page;

    } else if (isPath('/Global/Play/Book/BookDelivery.asp')) {
        setMessage(`BookDelivery`);
        fillField('MemberName',['bookingInfo','name']);
        fillField('BirYear',['bookingInfo','b_year']);
        fillField('BirMonth',['bookingInfo','b_month']);
        fillField('BirDay',['bookingInfo','b_date']);
        // fillField('Email',['bookingInfo','email']);
        fillField('PhoneNo',['bookingInfo','phone']);
        fillField('HpNo',['bookingInfo','cellPhone']);

        settings.autoNextPage.BookDelivery && window.parent.fnNextStep('P'); // next page;

    } else if (isPath('/Global/Play/Book/BookPayment.asp')) {
        setMessage(`BookPayment`);
        const radios = document.getElementsByName('PaymentSelect');
        const radio = radios[radios.length -1];
        radio.checked = true;
        window.fnPaymentSelect('G1');
        await selectOption(document.getElementById('DiscountCardGlobal'), settings.payment.type, false);

        await(() => document.getElememtById('CardNo1'), 50);
        fillField('CardNo1', ['payment', 'card', 0]);
        fillField('CardNo2', ['payment', 'card', 1]);
        fillField('CardNo3', ['payment', 'card', 2]);
        fillField('CardNo4', ['payment', 'card', 3]);
        fillField('ValidMonth', ['payment', 'expired', 1]);
        fillField('ValidYear', ['payment', 'expired', 0]);

        settings.autoNextPage.BookPayment && window.parent.fnNextStep('P'); // next page;
    } else if (isPath('/Global/Play/Book/BookConfirm.asp')) {
        setMessage(`BookConfirm`);
        document.getElementById('CancelAgree').checked = true;
        document.getElementById('CancelAgree2').checked = true;

        settings.autoNextPage.BookConfirm && window.parent.fnNextStep('P'); // next page;
    }
})();
