/**
 * Inspired by NewPage on Runescape Wiki.
 * https://runescape.wiki/w/MediaWiki:Gadget-newPage.js
 * @external window.dev.modal
 */
(function (window, $, mw) {
    'use strict';
    if (window.isCreateNewPageLoaded) {
        return;
    }
    window.isCreateNewPageLoaded = true;

    var modalPromise, modal;

    function createModal(modal) {
        var contentPanel = new OO.ui.PanelLayout({ padded: true, expanded: false });
        var closeButton = new OO.ui.ButtonWidget({
            invisibleLabel: true,
            label: 'Close',
            icon: 'close',
            title: 'Close',
            framed: false
        });
        closeButton.onClick = function () {
            modal.close();
        };
        closeButton.on('click', closeButton.onClick);
        var $header = window.dev.modal.createBasicHeaderPanel([], 'Create a new page', [closeButton.$element]);

        var pagenameInput = new OO.ui.TextInputWidget({ placeholder: 'Full page name including namespace', type: 'text', id: 'gadget-newpage-pagename' });
        var submitButton = new OO.ui.ButtonInputWidget({ label: 'Create', flags: ['primary', 'progressive'] });

        function submitAction(modal) {
            var page = pagenameInput.getValue();
            if (page === '') return;
            var url = mw.util.getUrl(page, { action: 'edit' });
            window.location.assign(url);
        }

        submitButton.on('click', submitAction);
        pagenameInput.on('enter', submitAction);

        var pagenameInputField = new OO.ui.ActionFieldLayout(
            pagenameInput,
            submitButton,
            {
                align: 'top',
            }
        )
        contentPanel.$element
            .append(pagenameInputField.$element);
        modal.$body
            .append($header)
            .append(contentPanel.$element);
    }

    function onToolClick(e) {
        e.preventDefault();
        if (modalPromise !== undefined) {
            if (modal !== undefined) {
                modal.open();
            }
        } else {
            modalPromise = window.dev.modal.createOOUIWindow('Create New Page', 'Create a new page', {}, createModal, false, true, false);
            modalPromise.then(dialog => {
                modal = dialog;
                modal.open();
            });
        }
    }

    function init() {
        mw.loader.using(['mediawiki.util']).then(function () {
            const pTbLink = mw.util.addPortletLink('p-tb', '#', 'Create new page', 't-create-new-page', 'Create new page', null, null);
            pTbLink.onclick = onToolClick;
            const pCActionsLink = mw.util.addPortletLink('p-cactions', '#', 'Create page', 'ca-create-page', 'Create a new page', null, null);
            pCActionsLink.onclick = onToolClick;
        });
    }
    $(init);
})(this, jQuery, mediaWiki);