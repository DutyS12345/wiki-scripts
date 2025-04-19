/**
 * Adapted from MassRename by KnazO.
 * https://dev.fandom.com/wiki/MediaWiki:MassRename/code.js
 * @external window.dev.modal
 * @external mediawiki.api
 */

(function (window, $, mw) {
    'use strict';
    if (
        window.isMassRenameLoaded ||
        !/sysop|staff|moderator/.test(mw.config.get('wgUserGroups').join())
    ) {
        return;
    }
    window.isMassRenameLoaded = true;

    var api;
    var modalPromise, modal;
    var contentPanel,
        closeButton,
        renameReasonInput,
        leaveRedirectCheckbox,
        addCategoryInput,
        pageSelectionInput,
        errorMessage,
        startStopButton;
    var paused = true;

    function initRenameModal(modal) {
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
        var $header = window.dev.modal.createBasicHeaderPanel([], 'Mass Rename', [closeButton.$element]);

        renameReasonInput = new OO.ui.FieldLayout(
            new OO.ui.TextInputWidget({
            }),
            {
                align: 'top',
                label: 'Reason for rename'
            }
        );

        leaveRedirectCheckbox = new OO.ui.FieldLayout(
            new OO.ui.CheckboxInputWidget({
                value: 'leave redirect'
            }),
            {
                align: 'left',
                label: 'Leave a redirect behind'
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
                label: 'Add category',
                help: 'Omit the "Category:" namespace prefix'
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
                allowLinebreaks: true,
                placeholder: 'old_name new_name'
            }),
            {
                align: 'top',
                label: 'Pages to rename',
                help: 'Separate page renames with a newline. Place an old page name and the new page name on the same line with a space in between. Replace any spaces in page names with underscores.',
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
                startRename();
            } else {
                stopRename();
            }
        };
        startStopButton.on('click', startStopButton.onClick);
        contentPanel.$element
            .append(renameReasonInput.$element)
            .append(leaveRedirectCheckbox.$element)
            .append(addCategoryInput.$element)
            .append(pageSelectionInput.$element)
            .append(errorMessage.$element)
            .append(startStopButton.$element);
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
            modalPromise = window.dev.modal.createOOUIWindow('Mass Rename', 'Mass Rename', {}, initRenameModal, false, false, false);
            modalPromise.then(dialog => {
                modal = dialog;
                modal.open();
            });
        }
    }

    function startRename() {
        paused = false;
        startStopButton.setLabel('Stop');
        process();
    }

    function stopRename() {
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
            stopRename();
        } else {
            var pageNames = currentPage.split(' ');
            if (pageNames.length !== 2) {
                errorMessage.append('Invalid line');
                stopRename();
            } else {
                performAction(pageNames[0], pageNames[1], renameReasonInput.fieldWidget.getValue(), leaveRedirectCheckbox.fieldWidget.isSelected());
            }
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
            cmtitle: "Category:" + category,
            cmlimit: 5000
        });
        setTimeout(function () { getPromise.abort(); }, 2000);
        return getPromise.then(function (d) {
            var data = d.query;
            var categories = data.categorymembers.map(cato => cato.title);
            return categories;
        });
    }

    function performAction(oldName, newName, reason, redirect) {
        var params = {
            action: 'move',
            from: oldName.replace('_', ' '),
            to: newName.replace('_', ' '),
            reason: reason,
        }
        if (!redirect) {
            params.noredirect = '';
        }
        api.postWithEditToken(params).fail(function (code) {
            errorMessage.append('Rename' + ' error ' + oldName + ' ' + code);
        })
        setTimeout(process, window.batchRenameDelay || 1000);
    }

    function initMassCategorizeEditorTool() {
        api = new mw.Api();
        const plink = mw.util.addPortletLink('p-tb', '#', 'Mass rename', 't-mass-rename', 'Mass rename', null, null);
        plink.onclick = onToolClick;
    }
    $.when(mw.loader.using(['mediawiki.api', 'mediawiki.util']), $.ready).then(function () {
        initMassCategorizeEditorTool();
    });
})(this, jQuery, mediaWiki);
