// ==UserScript==
// @name         TPI ERP WorkAdd plugin
// @namespace    https://raw.githubusercontent.com/hlianghsun/tampemonkeyUserscripts/main/TPIWorkAdd_Plugin.js
// @icon         https://www.elite-erp.com.tw/erp/favicon.ico
// @description  TPI ERP WorkAdd plugin
// @version      0.2.2
// @author       Lucian Huang
// @match        *://www.elite-erp.com.tw/erp/workHour/work/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';
    const defaultTime = "09:00";

    const targets = [
        {id: "detailForms0.refPjCustCode", value: "CONNING & COMPANY"},
        {id: "detailForms0.refPjCode", value: "(主)Taipei Development Centre-2023"},
        {id: "detailForms0.refTaskId", value: "程式開發"},
        {id: "detailForms0.workhours", value: "8"}
    ]

    function init() {
        if($(".title h3").text() != "工時填寫") {
            return;
        }
        initDate();
        initTime();
        applyTargets();
    }

    function fillZero(i) {
        return i < 10 ? `0${i}` : `${i}`
    }

    function initDate() {
        const input = $('input#workDate');
        const container = $("<div>")
            .css('position', 'absolute')
            .css('top', 40)
            .css('right', -2)
            .css('text-align', 'right')
            .css('white-space', 'nowrap')
            .appendTo(input.parents('.day_box').first());

        const fillDateList = unsafeWindow.fillDateList || [];
        
        let daseDate = new Date();
        let day = daseDate.getDay();
        let diff = daseDate.getDate() - day + (day == 0 ? -7:0);

        const days = ["日","一","二","三","四","五","六"];

        [diff - 7 , diff].forEach((diff1) => {
            [1,2,3,4,5,6].forEach((diff2) => {
                const d = new Date(daseDate.getFullYear(), daseDate.getMonth(), diff1 + diff2);
                const fill = `${d.getFullYear()}/${fillZero(d.getMonth()+1)}/${fillZero(d.getDate())}`;
                const isFilled = fillDateList.indexOf(fill) >= 0;
                const isHoliday = holidayList.indexOf(fill) >= 0;
                const isLeave = leaveApproveSet.indexOf(fill) >= 0;
                const notCompleteYet = smallThanEight.indexOf(fill) >= 0;
                const isMatch = input.val() == fill;
                const disabled = isHoliday || isFilled || (d > daseDate);

                let color, background;
                if(notCompleteYet){
                    background = '#DFFFDF';
                    color = '#000000';
                } else if(isLeave){
                    background = '#ffcc99';
                    color = '#000000';
                } else if(isFilled){
                    background = '#FFFFBB';
                    color = '#000000';
                }

                // console.log(`${d}: cy:${fillDateList.indexOf(fill)}, hd:${holidayList.indexOf(fill)}, le:${leaveApproveSet.indexOf(fill)}, st8:${smallThanEight.indexOf(fill)}`);

                $('<button type="button" />')
                    .addClass('btn')
                    .css('color', color)
                    .css('background-color', background)
                    .css("margin", "2px")
                    .css("padding", isMatch ? "3px" : "6px")
                    .css("border", isMatch ? '3px solid red' : '')
                    .attr('disabled', disabled)
                    .html(`${fillZero(d.getMonth()+1)}/${fillZero(d.getDate())}<br/>(${days[diff2]})`)
                    .appendTo(container)
                    .click(
                    () => {
                        if (isMatch) { return; }
                        input.val(fill);
                        unsafeWindow.requeryPage('ADD', "false");
                    }
                );
            });
            $('<br/>').appendTo(container);
        });
    }

    function initTime() {
        const input = $('input#workStartTime');

        if (input.val() != defaultTime) {
            input.focus();
            input.val(defaultTime);
            input.blur();
        }

        input.parents('.day_box').first().parent().css('padding-bottom', '130px');

        const container = $("<div>")
            .css('position', 'absolute')
            .css('top', 40)
            .css('right', -2)
            .css('text-align', 'right')
            .css('white-space', 'nowrap')
            .appendTo(input.parents('.day_box').first());

        $('<button type="button" />')
            .addClass('btn')
            .css("margin", "2px")
            .css("padding", "6px")
            .css("width", "49.05px")
            .attr('disabled', true)
            .text("　")
            .appendTo(container);
        
        ["08:30","08:35","08:40","08:45","08:50","08:55","09:00","09:05","09:10","09:15","09:20","09:25","09:30"].forEach((time, i) => {
            const isMatch = input.val() == time;
            $('<button type="button" />')
                .addClass('btn')
                .addClass(isMatch ? 'btn-primary' : '')
                .css("margin", "2px")
                .css("padding", "6px")
                .text(time)
                .appendTo(container)
                .click((e) => {
                    input.focus();
                    input.val(time);
                    input.blur();
                    container.find('.btn-primary').removeClass('btn-primary');
                    $(e.target).addClass('btn-primary');
                });

            if ((i+2)%5 == 0) {
                $('<br/>').appendTo(container);
            }
        });

        $('<button type="button" />')
            .addClass('btn')
            .css("margin", "2px")
            .css("padding", "6px")
            .css("width", "49.05px")
            .attr('disabled', true)
            .text("　 ")
            .appendTo(container);
    }

    async function applyTargets() {
        let result = true;
        for (let i = 0; i< targets.length; i++) {
            const r = await execTarget(targets[i]);
            result = result && r;
        };
    }

    async function execTarget(target, retries = 0) {

        if (retries > 5) {
            return new Promise( r => r(false));
        }

        const input = $(document.getElementById(target.id));

        if(input.is('input')) {
            input.focus().val(target.value).blur();
            return new Promise( r => r(true));
        }

        if(input.is('select')) {
            const options = input.parent().find('.dropdown-menu a .text');
            if (options.length <= 1){
                return new Promise( (resolve) => setTimeout(() => {
                    execTarget(target, retries++).then((r) => resolve(r));
                }), 100);
            }

            options.filter((i, o) => {
                // console.log(`${$(o).text()} == ${target.value};`)
                return $(o).text() == target.value;
            }).click();

            // console.log(`${input.val()} == ${target.value};`)
            return new Promise( r => r(!!input.val()));
        }
    }

    init();
})();
