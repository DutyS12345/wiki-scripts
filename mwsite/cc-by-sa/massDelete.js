/**
 * Adapted from Ajax Batch Delete by Ozank Cx.
 * https://dev.fandom.com/wiki/MediaWiki:AjaxBatchDelete.js
 * @external window.dev.modal
 * @external mediawiki.api
 */

(function (window, $, mw) {
    'use strict';
    if (
        window.isMassDeleteLoaded ||
        !/sysop|staff|moderator/.test(mw.config.get('wgUserGroups').join())
    ) {
        return;
    }
    window.isMassDeleteLoaded = true;

    var api;
    var modalPromise, modal;
    var contentPanel,
        closeButton,
        deleteReasonInput,
        protectCheckbox,
        addCategoryInput,
        pageSelectionInput,
        errorMessage,
        startStopButton;
    var paused = true;

    function onToolClick(e) {
        e.preventDefault();
        if (modalPromise !== undefined) {
            if (modal !== undefined) {
                modal.open();
            }
        } else {
            modalPromise = window.dev.modal.createOOUIWindow('Mass Delete', 'Mass Delete', {}, initDeleteModal, false, false, false);
            modalPromise.then(dialog => {
                modal = dialog;
                modal.open();
            });
        }
    }

    function initDeleteModal(modal) {
        modal.size = 'large';

        contentPanel = new OO.ui.PanelLayout({ padded: true, expanded: false });
        closeButton = new OO.ui.ButtonWidget({
            invisibleLabel: true,
            label: 'Close',
            icon: 'close',
            title: 'Close',
            framed: false,
        });
        closeButton.onClick = function () {
            modal.close();
        };
        closeButton.on('click', closeButton.onClick);
        var $header = window.dev.modal.createBasicHeaderPanel([], 'Mass Delete', [closeButton.$element]);

        deleteReasonInput = new OO.ui.FieldLayout(
            new OO.ui.TextInputWidget({
            }),
            {
                align: 'top',
                label: 'Reason for deletion'
            }
        );
        protectCheckbox = new OO.ui.FieldLayout(
            new OO.ui.CheckboxInputWidget({
                value: 'protect'
            }),
            {
                align: 'left',
                label: 'Protect page after deletion'
            }
        );
        addCategoryInput = new OO.ui.ActionFieldLayout(
            new OO.ui.TextInputWidget({
            }),
            new OO.ui.ButtonWidget({
                label: 'Add Category'
            }),
            {
                align: 'top',
                label: 'Add category (omit Category:)'
            }
        );
        addCategoryInput.buttonWidget.on('click', function () {
            var category = addCategoryInput.fieldWidget.getValue().trim();
            addCategoryInput.fieldWidget.setValue('');
            if (category !== '') {
                getCategoryContents(category)
                    .then(function (categories) {
                        var selection = pageSelectionInput.fieldWidget.getValue();
                        if (selection.length === 0 || selection.slice(-1) === '\n') {
                            pageSelectionInput.fieldWidget.setValue(pageSelectionInput.fieldWidget.getValue() + categories.join('\n'));
                        } else {
                            pageSelectionInput.fieldWidget.setValue(pageSelectionInput.fieldWidget.getValue() + '\n' + categories.join('\n'));
                        }
                    })
                    .catch(function (code) {
                        errorMessage.append('GetContents ' + category + ' error ' + code);
                    });
            }
        });
        pageSelectionInput = new OO.ui.FieldLayout(
            new OO.ui.MultilineTextInputWidget({
                rows: 10,
                allowLinebreaks: true
            }),
            {
                align: 'top',
                label: 'Pages to delete (separate by newline)'
            }
        );
        errorMessage = new OO.ui.PanelLayout({ padded: true, expanded: false, framed: true, scrollable: true });
        errorMessage.append = function (msg) {
            errorMessage.$element.append(msg).append('<br />');
        };
        startStopButton = new OO.ui.ButtonWidget({
            label: 'Start',
            title: 'Start'
        });
        startStopButton.onClick = function () {
            if (paused) {
                startDelete();
            } else {
                stopDelete();
            }
        };
        startStopButton.on('click', startStopButton.onClick);
        contentPanel.$element
            .append(deleteReasonInput.$element)
            .append(protectCheckbox.$element)
            .append(addCategoryInput.$element)
            .append(pageSelectionInput.$element)
            .append(errorMessage.$element)
            .append(startStopButton.$element);
        modal.$body
            .append($header)
            .append(contentPanel.$element);
    }

    function shouldProtect() {
        return protectCheckbox.fieldWidget.isSelected();
    }

    function startDelete() {
        paused = false;
        startStopButton.setLabel('Stop');
        process();
    }

    function stopDelete() {
        paused = true;
        startStopButton.setLabel('Start');
    }

    function process() {
        if (paused) {
            return;
        }
        var textField = pageSelectionInput.fieldWidget;
        var pages = textField.getValue().split('\n');
        var currentPage = pages[0];
        if (!currentPage) {
            errorMessage.append('Done');
            stopDelete();
        } else {
            performAction(currentPage, deleteReasonInput.fieldWidget.getValue());
        }
        pages = pages.slice(1, pages.length);
        textField.setValue(pages.join('\n'));
    }

    function getCategoryContents(category) {
        if (!category) {
            return;
        }
        var getPromise = api.get({
            action: 'query',
            list: 'categorymembers',
            cmtitle: 'Category:' + category,
            cmlimit: 5000
        });
        setTimeout(function () { getPromise.abort(); }, 2000);
        return getPromise.then(function (d) {
            var data = d.query;
            var categories = data.categorymembers.map(cato => cato.title);
            return categories;
        });
    }

    function performAction(page, reason) {
        api.postWithEditToken({
            action: 'delete',
            watchlist: 'preferences',
            title: page,
            reason: reason,
            bot: true
        }).done(function (d) {
            if (shouldProtect()) {
                api.postWithEditToken({
                    action: 'protect',
                    expiry: 'infinite',
                    protections: 'create=sysop',
                    watchlist: 'preferences',
                    title: page,
                    reason: reason
                }).fail(function (err) {
                    errorMessage.append('Protect' + ' error ' + page + ' ' + err);
                });
            }
        }).fail(function (code) {
            errorMessage.append('Delete' + ' error ' + page + ' ' + code);
        });
        setTimeout(process, window.batchDeleteDelay || 1000);
    }

    function initMassDeleteEditorTool() {
        api = new mw.Api();
        const plink = mw.util.addPortletLink('p-tb', '#', 'Mass delete', 't-mass-delete', 'Mass delete', null, null);
        plink.onclick = onToolClick;
    }
    $.when(mw.loader.using(['mediawiki.api', 'mediawiki.util']), $.ready).then(function () {
        initMassDeleteEditorTool();
    });
})(this, jQuery, mediaWiki);
