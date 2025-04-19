// <pre>
window.ecpButton = true;
(function (window, $, mw) {
    'use strict';
    var config = mw.config.get([
        'wgArticlePath',
        'skin',
    ]);
    function addButton() {
        if (config.skin === 'fandomdesktop') {
            var header = $('.wiki-tools .wds-list');
            if (header.length) {
                var text = 'Editor Color Picker';
                var href = '/wiki/Special:EditorColorPicker';
                header.append(function () {
                    return $('<li>').append($('<a>', {
                        href: href,
                        id: 'ca-editorcolorpicker',
                        text: text,
                    }));
                });
            }
        } else if (config.skin === 'vector') {
            var p = mw.util.addPortlet('p-Editor_tools', 'Editor tools', '#p-tb');
            var plink = mw.util.addPortletLink('p-Editor_tools', config.wgArticlePath.replace('$1', 'Special:EditorColorPicker'), 'Editor color picker', 'et-ecp', 'Change your editor colors with this tool.', null, null);
        }
    }

    mw.hook('wikipage.content').add(function ($content) {
        if (window.ecpButton) {
            mw.loader.using(['mediawiki.util']).then(function (require) {
                addButton();
            });
        }
    });
})(this, jQuery, mediaWiki);
// </pre>
