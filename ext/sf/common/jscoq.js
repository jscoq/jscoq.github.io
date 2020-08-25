/**
 * Injects jsCoq into an existing page.
 * This script has to be at the end of the body so that it runs after
 * the page DOM has loaded.
 */

function jsCoqInject() {
    $(document.body).attr('id', 'ide-wrapper').addClass('toggled')
        .addClass(isTerse() ? 'terse' : 'full')
        .append($('<link href="common/css/jscoq.css" rel="stylesheet" type="text/css"/>'))
        .append($('<div id="jscoq-plug">').click(jsCoqStart));
}

var jsCoqShow = (localStorage.jsCoqShow === 'true');

var jscoq_ids  = ['#main > div.code'];
var jscoq_opts = {
    layout:    'flex',
    show:      jsCoqShow,
    focus:     false,
    replace:   true,
    base_path: '../../node_modules/jscoq/',
    editor:    { mode: { 'company-coq': true }, keyMap: 'default', className: 'jscoq code-tight' },
    init_pkgs: ['init'],
    all_pkgs:  { '+': ['coq'], '../../coq-pkgs': ['software-foundations'] },
    init_import: ['utf8']
};

function jsCoqLoad() {
    // - remove empty code fragments (coqdoc generates some spurious ones)
    $('#main > div.code').each(function() {
        if ($(this).text().match(/^\s*$/)) $(this).remove();
    });

    //throw new Error;
    var page = document.querySelector('#page');
    page.setAttribute('tabindex', -1);
    page.focus();

    JsCoq.start(jscoq_ids, jscoq_opts)
        .then(coq => {
            window.coq = coq;
            window.addEventListener('beforeunload', () => { localStorage.jsCoqShow = coq.layout.isVisible(); })

            $('#panel-wrapper #toolbar').prepend($('<button>').addClass('close').text('×')
                .click(() => coq.layout.hide()));
        });
}

function jsCoqStart() {
    coq.layout.show();
}

function isTerse() {
    return $('[src$="/slides.js"]').length > 0;
}

if (location.search === '') {
    jsCoqInject();
    window.addEventListener('DOMContentLoaded', jsCoqLoad);
}
