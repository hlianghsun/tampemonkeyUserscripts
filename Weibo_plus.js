// ==UserScript==
// @name         Weibo+
// @namespace    https://github.com/hlianghsun/tampemonkeyUserscripts/raw/main/Weibo_plus.js
// @version      0.5.3
// @description  Weibo plus
// @author       Lucian Huang
// @match        *://weibo.com/*
// @match        *://www.weibo.com/*
// @icon         https://weibo.com/favicon.ico
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @grant        GM_setClipboard
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';
    const classn = `WeiboPlus-${parseInt(Math.random()*1000000)}`;
    let crtlBox, msgBox;

    function is(hostname){
        const result = new RegExp(`^([a-zA-Z0-9]{2,}[.])?(${hostname})([.][a-zA-Z0-9]{2,})?$`).test(location.hostname);
        // console.log(`is(${hostname}) = ${result}`);
        return result;
    }

    function init() {
        if(location.pathname.indexOf('ttarticle') == 1) {
            init_ttarticle();
            return;
        }

        if(location.pathname.indexOf('tv/show/') == 1) {
            init_tvShow();
            return;
        }

        if(location.pathname.match(/^\/[0-9]{10,10}\/[a-zA-Z0-9]{9,9}$/)) {
            initCtrlBox("Waiting");

            $('<button/>')
            .attr({type: 'button'})
            .text('content Loaded')
            .on('click', init_post)
            .appendTo(crtlBox);

            return;
        }

        initStyle()
    }

    function setMessage(msg, color = 'deeppink') {
         msgBox.text(msg).css('color', color);
    }

    function setClipboard(text, chapter, editChapter = false) {
        if (editChapter) {
            chapter = prompt("Please modify header", chapter);
        }

        chapter = chapter.trim();

        text = `☆ ${chapter} \n${text}\n------- ${chapter} 結束 -------\n\n`;

        GM_setClipboard(text, 'text');

        setMessage(`[${chapter}] copied`, 'green');
    }

    function covretChineseNumeric(title) {
        return title.replace(/第(一|二|三|四|五|六|七|八|九|十)+/g, (match) => {
            match = match.substring(1);
            match = match.replace(/^(一)?十$/, "10");
            match = match.replace(/^(一)?十/, "1");
            match = match.replace(/十$/, "0");
            match = match.replace(/十/g, "");
            match = match.replace(/一/g, "1");
            match = match.replace(/二/g, "2");
            match = match.replace(/三/g, "3");
            match = match.replace(/四/g, "4");
            match = match.replace(/五/g, "5");
            match = match.replace(/六/g, "6");
            match = match.replace(/七/g, "7");
            match = match.replace(/八/g, "8");
            match = match.replace(/九/g, "9");
            return match.length == 1 ? `第0${match}`: `第${match}`;
        });
    }

    const downloadPic = async (url, title) => {
        const extend = /^.*\.(\w{2,})$/.exec(url)[1];
        title = `${title}.${extend}`;

        return new Promise(resolve => {
            console.log(`[Preparing Download] ${title}: ${url}`);
            GM_download({
                url: url,
                name: title,
                onError: (...props) => {
                    setMessage(`[Download failed] ${title}`);
                    console.log(props);
                },
                ontimeout : (...props) => {
                    setMessage(`[Download timeout] ${title}`);
                    console.log(props);
                },
                onprogress: function(...props) {
                    setMessage(`[Download starting (${props[0].status})] ${title}`);
                },
                onload: () => {
                    setMessage(`[Downloaded] ${title}`);
                    setTimeout( resolve, 50);
                },
                headers: {
                    referer: "https://weibo.com/",
                }
            })
        });
    }

    const downloadPicList = async (itemList) => {
        console.log(`[downloadPicList (${itemList.length})]`);
        console.log(itemList);
        for (let i = 0; i < itemList.length; i++){
            await downloadPic(itemList[i].url, itemList[i].title);
        }
        setMessage(`[All Pictures Downloaded (${itemList.length})]`);
    }

    function initStyle() {
        let $style = $(`<style />`)
            .attr({ rel: "stylesheet", type: 'text/css'})
            .text(`.woo-modal-wrap {opacity: 0 !important; } .woo-modal-wrap .woo-modal-main {display: none !important; } `)
            .appendTo(document.head);
    }

    function initCtrlBox(msg, color = 'red') {
        let $style = $(`<style />`)
            .attr({ rel: "stylesheet", type: 'text/css', id: classn })
            .text(`
                .${classn} { position: fixed; top: 0; right: 0; z-index:10000; margin: 10px; padding: 0 5px; background: rgba(225,225,225,0.75); box-shadow: rgb(200,200,200) 0 0 10px; border-radius: 5px; display: flex; align-items: center; min-height: 30px; font-size: 12px; }
                .${classn} .msgBox, .${classn} button {text-shadow: 0 0 5px white, 0 0 5px white, 0 0 5px white, 0 0 5px white, 0 0 7px white; font-weight: bold; color: black; }
                .${classn} button { background: transparent; border-radius: 3px; cursor: pointer; border: 1px solid #000; color: #000; padding: 2px; margin: 0 5px; font-weight: 100; }

                .${classn}-img {z-index: 10; position: absolute; top: 0; left: 0; width: 100%; background: rgba(0,210,200,0.3); display: flex; align-items: center; }
                .${classn}-img button, .lucian-custom-box a { cursor: pointer; background: #EEE; border-radius: 3px; margin: 5px; padding: 3px 5px; font-size: 10px; box-shadow: inset #999 0 0 3px; color: #000; border: 1px solid #000; background: white;}
                .rotateZ img { transform: rotateZ(180deg); }
                .rotateY img { transform: rotateY(180deg); }
                .rotateY.rotateZ img { transform: rotateX(180deg); }
                .hide img {display: none; }

                div[node-type="contentBody"] {height: inherit !important; }
                div[node-type="recommend"] {display: none !important; }
                div[node-type="maskContent"] {margin: unset !important; opacity: 0.3; }
            `)
            .appendTo(document.head);

        crtlBox = $('<div/>').addClass(classn).appendTo(document.body);
        msgBox = $('<span>').addClass('msgBox').appendTo(crtlBox);

        if (msg) setMessage(msg, color);
    }

    function init_ttarticle() {
        initCtrlBox();

        const title = $('div[node-type="articleTitle"]').first().text();

        const copyContent = () => {
            let text = '';

            $('div[node-type="contentBody"] > p').each((i, elem) => {
                text += `${$(elem).text()}\n`;
            })

            setClipboard(text, title, true);
        }

        const imgList = [];
        $('p[img-box="img-box"], figure.image').each((i, elem) => {
            const imgURL = $(elem).find('img').attr('src');
            if (!imgURL) { return; }
            const extend = /^.*\.(\w{2,})$/.exec(imgURL)[1];
            $(elem).css('position', 'relative').css('paddingTop', '35px').css('width', '100%');
            $(elem).addClass('hide');

             const newTitle = `${covretChineseNumeric(title)}-${i+1}`;

            imgList.push({title: newTitle, url: imgURL});
            const seq = imgList.length - 1;
            const id = `${classn}-img-${parseInt(Math.random()*10000)}`;

            $('<div>')
                .attr('id', id)
                .addClass(`${classn}-img`)
                .appendTo(elem)
                .append(
                    $('<button/>')
                       .attr({type: "button"})
                       .css('color', 'red').css('border-color', 'red')
                       .text('download')
                       .on('click', (e) => downloadPic(imgURL, newTitle))
                )
                .append(
                    $('<span/>')
                       .css('flex','1 0')
                       .text(newTitle)
                       .on('click', (e) => {
                           if(!$(elem).hasClass('hide')) {
                               $(elem).addClass('hide');
                               return;
                           }
                           $('p[img-box="img-box"], figure.image').addClass('hide');
                           $(elem).removeClass('hide');
                           setTimeout(() => {
                               $(document).scrollTop($(elem).position().top - 30);
                           }, 1);
                       })
                )
                .append(
                    $('<button/>')
                    .attr({type: "button"})
                    .text('mirror')
                    .on('click', (e) => $(elem).toggleClass('rotateY'))
                )
                .append(
                    $('<button/>')
                    .attr({type: "button"})
                    .text('rotate')
                    .on('click', (e) => $(elem).toggleClass('rotateZ'))
                 )
        })

        $('<button/>')
            .attr({type: 'button'})
            .text('copy text')
            .on('click', () => {
                copyContent();
            })
            .appendTo(crtlBox);

        if(imgList.length) {
            $('<button/>')
            .attr({type: 'button'})
            .text('download pictures')
            .on('click', () => downloadPicList(imgList))
            .appendTo(crtlBox);
        }

        setMessage(`[Initialize] ${title}`);
    }

    function init_post(e) {
        const imgs = $('article.woo-panel-main .woo-picture-img');
        if (!imgs.length) {
            $(`.${classn}`).remove();
            return;
        }
        $(e.target).remove();
         setMessage(`Ready! (${imgs.length})`, "blue")

        $('<button/>')
            .attr({type: "button"})
            .text('download pictures')
            .on('click', (e) => {
                const title = covretChineseNumeric(prompt(`Title for (${imgs.length}) pictures, please:`));
                if(!title){
                    console.log(imgs);
                    return;
                }
                const itemList = [];
                imgs.each((i, img) => {
                    itemList.push({title:`${title}-${i+1}`, url: img.getAttribute('src')});
                });
                downloadPicList(itemList);
            })
            .appendTo(crtlBox);

    }

    function init_tvShow(count = 0) {
        if(count > 20) {
            return;
        }
        let titleDiv = $('div[class^="Detail_tith3_"]');
        let user = $('div.woo-box-flex').filter((i,elem) => elem.className.indexOf('User_h3_') >= 0).text().trim();
        console.log($('div.woo-box-flex').filter((i,elem) => elem.className.indexOf('User_h3_') >= 0));
        if(!titleDiv.text() || !user) {
            setTimeout(() => init_tvShow(count++), 500);
            return;
        }
        const updateTitle = `${covretChineseNumeric(titleDiv.text())} [${user}]`;
        $('head title').text(updateTitle);
        $('video').attr('volumn', '0.05');
        ($('video')[0])?.pause();

        titleDiv.css('color','blue');
    }

    init();
})();
