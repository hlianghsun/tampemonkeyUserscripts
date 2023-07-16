// ==UserScript==
// @name         globalinterpark plus
// @namespace    https://github.com/hlianghsun/tampemonkeyMods/edit/main/JCB_starbucks
// @version      0.1
// @description  lets get globalinterpark booking quickly!
// @author       Lucian Huang
// @match        https://ticket.globalinterpark.com/*
// @match        https://gpoticket.globalinterpark.com/Global/Play/Book/*
// @icon         https://openimage.interpark.com/UI/favicon/ticket_favicon.ico
// @grant        none
// ==/UserScript==


(async function() {
    'use strict';
    const settings = {
        prdNo:23008985,
        date: 20230813,
        seats: 4,
        bookingInfo: {
            name: "LUCIAN HUANG",
            b_year: 1985,
            b_month: 12,
            b_date: 13,
            // email: "slhs00837@gmail.com",
            phone: "0911123123",
            cellPhone: "0911123123"
        },
        payment: {
            type: "Visa", //Visa, Master, JCB, Other (credit cards)
            card: ["7573","7573","7573","7573"],
            expired: ["2027","11"]
        },
        autoNextPage: {
            BookDatetime: true,
            BookSeat: true,
            BookPrice: true,
            BookDelivery: true,
            BookPayment: true,
            BookConfirm: false,
        }
    }

    const id = `globalinterpark-${settings.prdNo}-${settings.date}`;

    const isPath = (pathName) => (location.pathname.indexOf(pathName) == 0);

    const getParams = () => {
        const str = location.search ? location.search.substr(1): "";
        const params = Object.fromEntries(new URLSearchParams(str));
        console.log(params);
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

    if (isPath('/Global/Play/CBT/GoodsInfo_CBT.asp')) {
        const msgBox = insertMessageBox();
        msgBox.style.bottom = "unset";
        msgBox.style.top = 0;
        setMessage(`prdNo = ${getParams()?.GoodsCode}`);

        await selectOption(document.getElementById('play_date'), (settings.prdNo == getParams()?.GoodsCode) ? settings.date : null);
        await selectOption(document.getElementById('play_time'));

        setMessage(`Ready for next!!!!`, 'yellow').style.fontSize = '30px';

        return;

    } else if (isPath('/Global/Play/Book/BookMain.asp')) {
        insertMessageBox();

    } else if (isPath('/Global/Play/Book/BookDatetime.asp')) {
        setMessage(`BookDatetime`);
        settings.autoNextPage.BookDatetime && window.top.fnNextStep('P');
    } else if (isPath('/Global/Play/Book/BookSeat.asp')) {
        setMessage(`BookSeat`);
        // hideRecaptcha();
        let input = document.getElementsByClassName('validationTxt');
        if (input.length) {
            trigger(input[0], 'click');
        }
    } else if (isPath('/Global/Play/Book/BookSeatDetail.asp')) {
        if (!document.getElementsByClassName("SeatT").length) {
            // setMessage(`can not select seat(s) in this page.`);
            return;
        }
        const seats = document.getElementsByName('Seats');
        if (seats.length == 0) {
            setMessage(`Block: ${document.getElementsByTagName('font')[0].innerText} find 0 seat(s), back to map`, 'red');
            window.parent.fnSeatUpdate();
            return;
        }
        setMessage(`find ${seats.length} seat(s)`);

        const maxSeats = Math.min(seats.length, settings.seats, window.parent.TicketCnt_Max);
        if (!maxSeats) {
            return;
        }
        for (let i = 0 ; i < maxSeats ; i++ ) {
            setMessage(`find ${seats.length} seat(s) / selecting (${i+1}/${maxSeats})`);
            trigger(seats[i], 'click');
            await waiting(() => window.parent.document.getElementById('SelectedSeatCount').innerHTML == (i+1), 50);
        }
        settings.autoNextPage.BookSeat && window.parent.fnSelect(); // next page;

    } else if (isPath('/Global/Play/Book/BookPrice.asp')) {
        setMessage(`BookPrice`);
        const elem = document.getElementsByName("SeatCount")[0];
        const totalTix = window.parent.document.getElementById('MySelectedSeatCnt').innerText;
        await selectOption(elem, ((totalTix > 0) ? totalTix : settings.seats));

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

