/**
 * Mass Edit (w/o async/await)
 * GPLv3 or later
 * CC BY-SA 4.0 or later
 * 
 * Adapted from Mass Edit by Eizen <dev.fandom.com/wiki/User_talk:Eizen>.
 * https://dev.fandom.com/wiki/MediaWiki:MassEdit/code.js
 * @external window.dev.modal
 * @external mediawiki.api
 */

(function (window, $, mw) {
    'use strict';

    if (
        window.isMassEditLoaded ||
        !/sysop|staff|moderator/.test(mw.config.get('wgUserGroups').join())
    ) {
        return;
    }
    window.isMassEditLoaded = true;

    var api;
    var modalPromise, modal;

    function initFindReplacePanel(modal) {
        var findReplacePanel = new OO.ui.TabPanelLayout('Find and replace', {
            label: 'Find and replace',
            padded: true,
            scrollable: false,
            expanded: false
        });
        findReplacePanel.$element.css({
            padding: 0
        });

        var inputListType = new OO.ui.FieldLayout(
            new OO.ui.DropdownInputWidget({
                options: [
                    { data: 'Pages', label: 'Pages' },
                    { data: 'Categories', label: 'Categories' },
                    { data: 'Namespaces', label: 'Namespaces' }
                ]
            })
        );
        var useRegexCheckbox = new OO.ui.FieldLayout(
            new OO.ui.CheckboxInputWidget({
                value: 'regex'
            }),
            {
                align: 'left',
                label: 'Use regex'
            }
        );
        var caseSensitiveCheckbox = new OO.ui.FieldLayout(
            new OO.ui.CheckboxInputWidget({
                value: 'case-sensitive'
            }),
            {
                align: 'left',
                label: 'Case sensitive'
            }
        );

        var redirectFilter = new OO.ui.FieldLayout(
            new OO.ui.DropdownInputWidget({
                options: [
                    { data: 'all', label: 'Include redirects' },
                    { data: 'nonredirects', label: 'Exclude redirects' },
                    { data: 'redirects', label: 'Use only redirects' },
                ]
            }),
            {
                label: 'Filter redirects',
            }
        );
        redirectFilter.toggle(false);

        var findInput = new OO.ui.FieldLayout(
            new OO.ui.MultilineTextInputWidget({
                autosize: true,
                rows: 1,
                maxRows: 4,
                allowLinebreaks: true
            }),
            {
                align: 'top',
                label: 'Find'
            }
        );

        var replaceIndex = new OO.ui.FieldLayout(
            new OO.ui.TextInputWidget({}),
            {
                align: 'top',
                label: 'Specific instances'
            }
        );

        var replaceInput = new OO.ui.FieldLayout(
            new OO.ui.MultilineTextInputWidget({
                autosize: true,
                rows: 1,
                maxRows: 4,
                allowLinebreaks: true
            }),
            {
                align: 'top',
                label: 'Replace'
            }
        );

        var pageSelection = new OO.ui.FieldLayout(
            new OO.ui.MultilineTextInputWidget({
                autosize: true,
                rows: 4,
                maxRows: 8,
                allowLinebreaks: true
            }),
            {
                align: 'top',
                label: 'Pages to edit (separate by newline)'
            }
        );

        inputListType.fieldWidget.on('change', function (change) {
            var label;
            switch (change) {
                case 'Namespaces':
                    label = 'Namespace members to edit (separate by newline)';
                    break;
                case 'Categories':
                    label = 'Category members to edit (separate by newline)';
                    break;
                case 'Pages':
                default:
                    label = 'Pages to edit (separate by newline)';
                    break;
            }
            pageSelection.setLabelContent(label);
            switch (change) {
                case 'Namespaces':
                    redirectFilter.toggle(true);
                    break;
                case 'Categories':
                case 'Pages':
                default:
                    redirectFilter.toggle(false);
                    break;
            }
        });

        var editSummary = new OO.ui.FieldLayout(
            new OO.ui.TextInputWidget(),
            {
                align: 'top',
                label: 'Edit summary'
            }
        );

        var startButton = new OO.ui.ButtonWidget({
            label: 'Replace',
            title: 'Replace'
        });

        var clearButton = new OO.ui.ButtonWidget({
            label: 'Clear',
            title: 'Clear'
        });

        var statusMessage = new OO.ui.PanelLayout({ padded: true, expanded: false, framed: true, scrollable: true });
        statusMessage.append = function (msg) {
            statusMessage.$element.append(msg).append('<br />');
        };
        statusMessage.scrollToBottom = function () {
            let messageElement = statusMessage.$element.get(0);
            messageElement.scrollTop = messageElement.scrollHeight;
        }
        statusMessage.clear = function () {
            statusMessage.$element.empty();
        };
        statusMessage.$element.css({
            'max-height': '12vh',
            'box-sizing': 'border-box',
        });

        var findReplacePanelContent = new OO.ui.PanelLayout({ padded: true, scrollable: false, expanded: false });

        findReplacePanelContent.$element.css({
            'max-height': '60vh',
            'overflow-y': 'auto'
        });

        var findReplacePanelActions = new OO.ui.PanelLayout({ padded: true, scrollable: false, expanded: false });
        findReplacePanel.$element
            .append(findReplacePanelContent.$element
                .append(inputListType.$element)
                .append(useRegexCheckbox.$element)
                .append(caseSensitiveCheckbox.$element)
                .append(redirectFilter.$element)
                .append(findInput.$element)
                .append(replaceInput.$element)
                .append(replaceIndex.$element)
                .append(pageSelection.$element)
                .append(editSummary.$element)
                .append(statusMessage.$element)
            ).append(findReplacePanelActions.$element
                .append(startButton.$element)
                .append(clearButton.$element)
            );

        var panel = {
            getInputListType: () => inputListType.fieldWidget.getValue(),
            shouldUseRegex: () => useRegexCheckbox.fieldWidget.isSelected(),
            isCaseSensitive: () => caseSensitiveCheckbox.fieldWidget.isSelected(),
            getRedirectFilter: () => redirectFilter.fieldWidget.getValue(),
            getFindText: () => findInput.fieldWidget.getValue(),
            getReplaceText: () => replaceInput.fieldWidget.getValue(),
            getReplaceIndices: () => {
                var text = replaceIndex.fieldWidget.getValue();
                if (text !== undefined && text !== null) {
                    return text.split(',')
                        .filter(e => e.trim().length !== 0)
                        .map(e => Number(e))
                        .filter(e => isFinite(e))
                        .filter(e => e >= 0)
                        .sort();
                } else {
                    return [];
                }
            },
            getPageSelectionText: () => pageSelection.fieldWidget.getValue(),
            getEditSummaryText: () => editSummary.fieldWidget.getValue(),
            printStatusMessage: (message) => {
                statusMessage.append(message);
                statusMessage.scrollToBottom();
            },
            clearInputs: () => {
                inputListType.fieldWidget.setValue('Pages');
                useRegexCheckbox.fieldWidget.setSelected(false);
                caseSensitiveCheckbox.fieldWidget.setSelected(false);
                redirectFilter.fieldWidget.setValue('all');
                findInput.fieldWidget.setValue('');
                replaceInput.fieldWidget.setValue('');
                replaceIndex.fieldWidget.setValue('');
                pageSelection.fieldWidget.setValue('');
                editSummary.fieldWidget.setValue('');
            },
            clearOutputs: () => {
                statusMessage.clear();
            }
        };

        clearButton.onClick = function () {
            OO.ui.confirm('Clear the form?').done(confirmed => {
                if (confirmed) {
                    panel.clearInputs();
                    panel.clearOutputs();
                }
                else {
                    // no-op cancel
                }
            });
        };
        clearButton.on('click', clearButton.onClick);

        startButton.onClick = function () {
            OO.ui.confirm('Are you sure you want to mass edit? Try testing on a sandbox page first and using find to ensure the correct pages are edited.').done(confirmed => {
                if (confirmed) { startButton.replaceAction(); }
                else {
                    // no-op cancel
                }
            });
        };
        startButton.replaceAction = function () {
            const findText = panel.getFindText();
            if (findText === '') {
                panel.printStatusMessage("Empty input text.");
                return;
            }
            const findRegex = buildRegExp(findText, panel.shouldUseRegex(), panel.isCaseSensitive());
            const replaceIndices = panel.getReplaceIndices();
            const replaceText = panel.getReplaceText();
            var replaceFunc;
            if (replaceIndices.length !== 0) {
                replaceFunc = (pageText) => replaceWithIndices(pageText, findRegex, replaceText, replaceIndices);
            } else {
                replaceFunc = (pageText) => pageText.replace(findRegex, replaceText);
            }
            const inputMembers = panel.getPageSelectionText()
                .split('\n')
                .map(member => member.trim())
                .filter(member => member.length > 0);
            const inputListType = panel.getInputListType();

            var editCount = 0;
            var pageCount = 0;
            var skipCount = 0;
            var editSummary = panel.getEditSummaryText();
            var replaceThenEdit = function (page) {
                return new Promise((resolve, reject) => {
                    const { ns, pageid, title, missing } = page;
                    // const revision = page?.revisions?.[0]?.slots?.main;
                    const revision = page && page.revisions && page.revisions[0] && page.revisions[0].slots ? page.revisions[0].slots.main : undefined;
                    pageCount++;
                    if (missing || revision === undefined) { // error missing revision;
                        skipCount++;
                        panel.printStatusMessage("Failed to get revision for " + title);
                        resolve();
                    } else {
                        const newText = replaceFunc(revision.content);
                        if (newText === revision.content) {
                            skipCount++;
                            panel.printStatusMessage("No changes for " + title + " {pageid:" + pageid + ",ns:" + ns + "}");
                            resolve();
                        } else {
                            editCount++;
                            panel.printStatusMessage("Editing " + title + " {pageid:" + pageid + ",ns:" + ns + "}");
                            editPage(title, (oldText) => newText, editSummary)
                                .then(response => {
                                    // default edit limits
                                    // 8 per minute for anon users
                                    // await delay(7500);
                                    // 90 per minute for autoconfirmed
                                    return delay(700).then(() => response);
                                })
                                .then(editResponse => resolve(editResponse), error => {
                                    console.error(error);
                                    panel.printStatusMessage("Failed to edit " + title + " {pageid:" + pageid + ",ns:" + ns + "}: " + error.message);
                                    resolve(error);
                                });
                        }
                    }
                });
            };

            let additionalParams = {};
            if (inputListType === 'Namespaces') {
                additionalParams['gapfilterredir'] = panel.getRedirectFilter();
            }

            handlePages(inputMembers, inputListType, additionalParams, replaceThenEdit)
                .then(() => {
                    panel.printStatusMessage("Edited " + editCount + " pages");
                    panel.printStatusMessage("Skipped " + skipCount + " pages");
                    panel.printStatusMessage("Total " + pageCount + " pages");
                })
                .catch(error => panel.printStatusMessage(error));
        };
        startButton.on('click', startButton.onClick);

        return findReplacePanel;
    }

    function initFindPanel(modal) {
        var findPanel = new OO.ui.TabPanelLayout('Find', {
            label: 'Find',
            padded: true,
            scrollable: false,
            expanded: false
        });
        findPanel.$element.css({
            padding: 0
        });

        var inputListType = new OO.ui.FieldLayout(
            new OO.ui.DropdownInputWidget({
                options: [
                    { data: 'Pages', label: 'Pages' },
                    { data: 'Categories', label: 'Categories' },
                    { data: 'Namespaces', label: 'Namespaces' }
                ]
            })
        );
        var useRegexCheckbox = new OO.ui.FieldLayout(
            new OO.ui.CheckboxInputWidget({
                value: 'regex'
            }),
            {
                align: 'left',
                label: 'Use regex'
            }
        );
        var caseSensitiveCheckbox = new OO.ui.FieldLayout(
            new OO.ui.CheckboxInputWidget({
                value: 'case-sensitive'
            }),
            {
                align: 'left',
                label: 'Case sensitive'
            }
        );

        var redirectFilter = new OO.ui.FieldLayout(
            new OO.ui.DropdownInputWidget({
                options: [
                    { data: 'all', label: 'Include redirects' },
                    { data: 'nonredirects', label: 'Exclude redirects' },
                    { data: 'redirects', label: 'Use only redirects' },
                ]
            }),
            {
                label: 'Filter redirects',
            }
        );
        redirectFilter.toggle(false);

        var findInput = new OO.ui.FieldLayout(
            new OO.ui.MultilineTextInputWidget({
                autosize: true,
                rows: 1,
                maxRows: 4,
                allowLinebreaks: true
            }),
            {
                align: 'top',
                label: 'Find'
            }
        );

        var pageSelection = new OO.ui.FieldLayout(
            new OO.ui.MultilineTextInputWidget({
                autosize: true,
                rows: 4,
                maxRows: 8,
                allowLinebreaks: true
            }),
            {
                align: 'top',
                label: 'Pages to search (separate by newline)'
            }
        );

        inputListType.fieldWidget.on('change', function (change) {
            var label;
            switch (change) {
                case 'Namespaces':
                    label = 'Namespace members to search (separate by newline)';
                    break;
                case 'Categories':
                    label = 'Category members to search (separate by newline)';
                    break;
                case 'Pages':
                default:
                    label = 'Pages to search (separate by newline)';
                    break;
            }
            pageSelection.setLabelContent(label);
            switch (change) {
                case 'Namespaces':
                    redirectFilter.toggle(true);
                    break;
                case 'Categories':
                case 'Pages':
                default:
                    redirectFilter.toggle(false);
                    break;
            }
        });

        var startButton = new OO.ui.ButtonWidget({
            label: 'Find',
            title: 'Find'
        });

        var clearButton = new OO.ui.ButtonWidget({
            label: 'Clear',
            title: 'Clear'
        });


        var findResults = new OO.ui.PanelLayout({ padded: true, expanded: false, framed: true, scrollable: true });
        findResults.append = function (msg) {
            findResults.$element.append(msg).append('<br />');
        };
        findResults.scrollToBottom = function () {
            let messageElement = findResults.$element.get(0);
            messageElement.scrollTop = messageElement.scrollHeight;
        }
        findResults.isScrolledToBottom = function () {
            let messageElement = findResults.$element.get(0);
            if (messageElement.scrollTop == messageElement.scrollHeight) {
                return true;
            } else {
                return false;
            }
        }
        findResults.clear = function () {
            findResults.$element.empty();
        };
        findResults.$element.css({
            'max-height': '12vh',
            'box-sizing': 'border-box',
        });

        var statusMessage = new OO.ui.PanelLayout({ padded: true, expanded: false, framed: true, scrollable: true });
        statusMessage.append = function (msg) {
            statusMessage.$element.append(msg).append('<br />');
        };
        statusMessage.scrollToBottom = function () {
            let messageElement = statusMessage.$element.get(0);
            messageElement.scrollTop = messageElement.scrollHeight;
        }
        statusMessage.clear = function () {
            statusMessage.$element.empty();
        };
        statusMessage.$element.css({
            'max-height': '12vh',
            'box-sizing': 'border-box',
        });

        var findPanelContent = new OO.ui.PanelLayout({ padded: true, scrollable: false, expanded: false });

        findPanelContent.$element.css({
            'max-height': '60vh',
            'overflow-y': 'auto'
        });

        var findPanelActions = new OO.ui.PanelLayout({ padded: true, scrollable: false, expanded: false });
        findPanel.$element
            .append(findPanelContent.$element
                .append(inputListType.$element)
                .append(useRegexCheckbox.$element)
                .append(caseSensitiveCheckbox.$element)
                .append(redirectFilter.$element)
                .append(findInput.$element)
                .append(pageSelection.$element)
                .append(findResults.$element)
                .append(statusMessage.$element)
            ).append(findPanelActions.$element
                .append(startButton.$element)
                .append(clearButton.$element)
            );

        var panel = {
            getInputListType: () => inputListType.fieldWidget.getValue(),
            shouldUseRegex: () => useRegexCheckbox.fieldWidget.isSelected(),
            isCaseSensitive: () => caseSensitiveCheckbox.fieldWidget.isSelected(),
            getRedirectFilter: () => redirectFilter.fieldWidget.getValue(),
            getFindText: () => findInput.fieldWidget.getValue(),
            getPageSelectionText: () => pageSelection.fieldWidget.getValue(),
            printFindResult: (message) => {
                let isScrolledToBottom = findResults.isScrolledToBottom();
                findResults.append(message);
                if (isScrolledToBottom) {
                    findResults.scrollToBottom();
                }
            },
            printStatusMessage: (message) => {
                statusMessage.append(message);
                statusMessage.scrollToBottom();
            },
            clearInputs: () => {
                inputListType.fieldWidget.setValue('Pages');
                useRegexCheckbox.fieldWidget.setSelected(false);
                caseSensitiveCheckbox.fieldWidget.setSelected(false);
                redirectFilter.fieldWidget.setValue('all');
                findInput.fieldWidget.setValue('');
                pageSelection.fieldWidget.setValue('');
            },
            clearOutputs: () => {
                findResults.clear();
                statusMessage.clear();
            }
        };

        clearButton.onClick = function () {
            OO.ui.confirm('Clear the form?').done(confirmed => {
                if (confirmed) {
                    panel.clearInputs();
                    panel.clearOutputs();
                }
                else {
                    // no-op cancel
                }
            });
        };
        clearButton.on('click', clearButton.onClick);

        startButton.onClick = function () {
            OO.ui.confirm('Are you sure you want to find?').done(confirmed => {
                if (confirmed) { startButton.findAction(); }
                else {
                    // no-op cancel
                }
            });
        };
        startButton.findAction = function () {
            const findText = panel.getFindText();
            if (findText === '') {
                panel.printStatusMessage("Empty input text.");
                return;
            }
            const findRegex = buildRegExp(findText, panel.shouldUseRegex(), panel.isCaseSensitive());
            const inputMembers = panel.getPageSelectionText()
                .split('\n')
                .map(member => member.trim())
                .filter(member => member.length > 0);
            const inputListType = panel.getInputListType();

            var foundCount = 0;
            var pageCount = 0;
            var skipCount = 0;
            var find = function (page) {
                return new Promise((resolve, reject) => {
                    const { ns, pageid, title, missing } = page;
                    // const revision = page?.revisions?.[0]?.slots?.main;
                    const revision = page && page.revisions && page.revisions[0] && page.revisions[0].slots ? page.revisions[0].slots.main : undefined;
                    pageCount++;
                    if (missing || revision === undefined) { // error missing revision;
                        skipCount++;
                        panel.printStatusMessage("Failed to get revision for " + title);
                    } else {
                        if (revision.content.search(findRegex) >= 0) {
                            foundCount++;
                            panel.printFindResult(title);
                            panel.printStatusMessage("Found " + title + " {pageid:" + pageid + ",ns:" + ns + "}");
                        } else {
                            skipCount++;
                            panel.printStatusMessage("Skipping " + title + " {pageid:" + pageid + ",ns:" + ns + "}");
                        }
                    }
                    resolve();
                });
            };

            let additionalParams = {};
            if (inputListType === 'Namespaces') {
                additionalParams['gapfilterredir'] = panel.getRedirectFilter();
            }

            handlePages(inputMembers, inputListType, additionalParams, find)
                .then(() => {
                    panel.printStatusMessage("Found " + foundCount + " pages");
                    panel.printStatusMessage("Skipped " + skipCount + " pages");
                    panel.printStatusMessage("Total " + pageCount + " pages");
                })
                .catch(error => panel.printStatusMessage(error));
        };
        startButton.on('click', startButton.onClick);

        return findPanel;
    }

    function initAppendPanel(modal) {
        return initSimpleEditPanel(modal, 'Append');
    }

    function initPrependPanel(modal) {
        return initSimpleEditPanel(modal, 'Prepend');
    }

    // type: 'Append' | 'Prepend'
    function initSimpleEditPanel(modal, type) {
        var editPanel = new OO.ui.TabPanelLayout(type, {
            label: type,
            padded: true,
            scrollable: false,
            expanded: false
        });
        editPanel.$element.css({
            padding: 0
        });

        var inputListType = new OO.ui.FieldLayout(
            new OO.ui.DropdownInputWidget({
                options: [
                    { data: 'Pages', label: 'Pages' },
                    { data: 'Categories', label: 'Categories' },
                    { data: 'Namespaces', label: 'Namespaces' }
                ]
            })
        );

        var redirectFilter = new OO.ui.FieldLayout(
            new OO.ui.DropdownInputWidget({
                options: [
                    { data: 'all', label: 'Include redirects' },
                    { data: 'nonredirects', label: 'Exclude redirects' },
                    { data: 'redirects', label: 'Use only redirects' },
                ]
            }),
            {
                label: 'Filter redirects',
            }
        );
        redirectFilter.toggle(false);

        var editInput = new OO.ui.FieldLayout(
            new OO.ui.MultilineTextInputWidget({
                autosize: true,
                rows: 1,
                maxRows: 4,
                allowLinebreaks: true
            }),
            {
                align: 'top',
                label: 'Text to ' + type.toLowerCase()
            }
        );

        var pageSelection = new OO.ui.FieldLayout(
            new OO.ui.MultilineTextInputWidget({
                autosize: true,
                rows: 4,
                maxRows: 8,
                allowLinebreaks: true
            }),
            {
                align: 'top',
                label: 'Pages to edit (separate by newline)'
            }
        );

        var editSummary = new OO.ui.FieldLayout(
            new OO.ui.TextInputWidget(),
            {
                align: 'top',
                label: 'Edit summary'
            }
        );

        inputListType.fieldWidget.on('change', function (change) {
            var label;
            switch (change) {
                case 'Namespaces':
                    label = 'Namespace members to edit (separate by newline)';
                    break;
                case 'Categories':
                    label = 'Category members to edit (separate by newline)';
                    break;
                case 'Pages':
                default:
                    label = 'Pages to edit (separate by newline)';
                    break;
            }
            pageSelection.setLabelContent(label);
            switch (change) {
                case 'Namespaces':
                    redirectFilter.toggle(true);
                    break;
                case 'Categories':
                case 'Pages':
                default:
                    redirectFilter.toggle(false);
                    break;
            }
        });

        var startButton = new OO.ui.ButtonWidget({
            label: type,
            title: type
        });

        var clearButton = new OO.ui.ButtonWidget({
            label: 'Clear',
            title: 'Clear'
        });

        var statusMessage = new OO.ui.PanelLayout({ padded: true, expanded: false, framed: true, scrollable: true });
        statusMessage.append = function (msg) {
            statusMessage.$element.append(msg).append('<br />');
        };
        statusMessage.scrollToBottom = function () {
            let messageElement = statusMessage.$element.get(0);
            messageElement.scrollTop = messageElement.scrollHeight;
        }
        statusMessage.clear = function () {
            statusMessage.$element.empty();
        };
        statusMessage.$element.css({
            'max-height': '12vh',
            'box-sizing': 'border-box',
        });

        var simpleEditPanelContent = new OO.ui.PanelLayout({ padded: true, scrollable: false, expanded: false });

        simpleEditPanelContent.$element.css({
            'max-height': '60vh',
            'overflow-y': 'auto'
        });

        var simpleEditPanelActions = new OO.ui.PanelLayout({ padded: true, scrollable: false, expanded: false });
        editPanel.$element
            .append(simpleEditPanelContent.$element
                .append(inputListType.$element)
                .append(redirectFilter.$element)
                .append(editInput.$element)
                .append(pageSelection.$element)
                .append(editSummary.$element)
                .append(statusMessage.$element)
            ).append(simpleEditPanelActions.$element
                .append(startButton.$element)
                .append(clearButton.$element)
            );

        var panel = {
            getInputListType: () => inputListType.fieldWidget.getValue(),
            getRedirectFilter: () => redirectFilter.fieldWidget.getValue(),
            getEditInputText: () => editInput.fieldWidget.getValue(),
            getPageSelectionText: () => pageSelection.fieldWidget.getValue(),
            getEditSummaryText: () => editSummary.fieldWidget.getValue(),
            printStatusMessage: (message) => {
                statusMessage.append(message);
                statusMessage.scrollToBottom();
            },
            clearInputs: () => {
                inputListType.fieldWidget.setValue('Pages');
                redirectFilter.fieldWidget.setValue('all');
                editInput.fieldWidget.setValue('');
                pageSelection.fieldWidget.setValue('');
                editSummary.fieldWidget.setValue('');
            },
            clearOutputs: () => {
                statusMessage.clear();
            }
        };

        clearButton.onClick = function () {
            OO.ui.confirm('Clear the form?').done(confirmed => {
                if (confirmed) {
                    panel.clearInputs();
                    panel.clearOutputs();
                }
                else {
                    // no-op cancel
                }
            });
        };
        clearButton.on('click', clearButton.onClick);

        startButton.onClick = function () {
            OO.ui.confirm('Are you sure you want to mass edit? Try testing on a sandbox page first and using find to ensure the correct pages are edited.').done(confirmed => {
                if (confirmed) { startButton.editAction(); }
                else {
                    // no-op cancel
                }
            });
        };
        startButton.editAction = function () {
            const editText = panel.getEditInputText();
            if (editText === '') {
                panel.printStatusMessage("Empty input text.");
                return;
            }
            const inputMembers = panel.getPageSelectionText()
                .split('\n')
                .map(member => member.trim())
                .filter(member => member.length > 0);
            const inputListType = panel.getInputListType();

            var editCount = 0;
            var pageCount = 0;
            var skipCount = 0;
            var editSummary = panel.getEditSummaryText();
            var transform;
            if (type === 'Append') {
                transform = (oldText) => oldText + editText;
            } else if (type === 'Prepend') {
                transform = (oldText) => editText + oldText;
            }
            var addText = function (page) {
                return new Promise((resolve, reject) => {
                    const { ns, pageid, title, missing } = page;
                    // const revision = page?.revisions?.[0]?.slots?.main;
                    const revision = page && page.revisions && page.revisions[0] && page.revisions[0].slots ? page.revisions[0].slots.main : undefined;
                    pageCount++;
                    if (missing || revision === undefined) { // error missing revision;
                        skipCount++;
                        panel.printStatusMessage("Failed to get revision for " + title);
                        resolve();
                    } else {
                        editCount++;
                        panel.printStatusMessage("Editing " + title + " {pageid:" + pageid + ",ns:" + ns + "}");
                        editPage(title, transform, editSummary)
                            .then(response => {
                                // default edit limits
                                // 8 per minute for anon users
                                // await delay(7500);
                                // 90 per minute for autoconfirmed
                                return delay(700).then(() => response);
                            })
                            .then(editResponse => resolve(editResponse), error => {
                                console.error(error);
                                panel.printStatusMessage("Failed to edit " + title + " {pageid:" + pageid + ",ns:" + ns + "}: " + error.message);
                                resolve(error);
                            });
                    }
                });
            };

            let additionalParams = {};
            if (inputListType === 'Namespaces') {
                additionalParams['gapfilterredir'] = panel.getRedirectFilter();
            }

            handlePages(inputMembers, inputListType, additionalParams, addText)
                .then(() => {
                    panel.printStatusMessage("Edited " + editCount + " pages");
                    panel.printStatusMessage("Skipped " + skipCount + " pages");
                    panel.printStatusMessage("Total " + pageCount + " pages");
                })
                .catch(error => panel.printStatusMessage(error));
        };
        startButton.on('click', startButton.onClick);

        return editPanel;
    }

    function initModal(modal) {
        modal.size = 'large';

        var closeButton = new OO.ui.ButtonWidget({
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
        var $header = window.dev.modal.createBasicHeaderPanel([], 'Mass Edit', [closeButton.$element]);

        var findReplacePanel = initFindReplacePanel(modal);

        var findPanel = initFindPanel(modal);

        var appendPanel = initAppendPanel(modal);

        var prependPanel = initPrependPanel(modal);

        // var listPagesPanel = new OO.ui.PanelLayout({ padded: true, expanded: false });

        var tabbedPanel = new OO.ui.IndexLayout({
            expanded: false,
            openMatchedPanels: false,
        });
        tabbedPanel.addTabPanels([
            findReplacePanel,
            findPanel,
            appendPanel,
            prependPanel,
            // new OO.ui.TabPanelLayout('List pages', { label: 'List pages', expanded: false })
        ]);
        tabbedPanel.$menu.on('click', function () {
            modal.updateSize();
        });
        let updateSizeObserver = new ResizeObserver(() => modal.updateSize());
        updateSizeObserver.observe(findReplacePanel.$element.get(0), { childList: true, subtree: true });
        updateSizeObserver.observe(findPanel.$element.get(0), { childList: true, subtree: true });
        updateSizeObserver.observe(appendPanel.$element.get(0), { childList: true, subtree: true });
        updateSizeObserver.observe(prependPanel.$element.get(0), { childList: true, subtree: true });

        modal.$body
            .append($header)
            .append(tabbedPanel.$element);
    }

    function editPage(pageTitle, transform, editSummary) {
        return api.edit(pageTitle,
            function (revision) {
                return {
                    text: transform(revision.content),
                    summary: editSummary || '',
                };
            }
        );
    }

    function delay(time) {
        return new Promise((resolve, reject) => setTimeout(resolve, time));
    }

    function buildRegExp(text, isRegex, isCaseSensitive) {
        return new RegExp((isRegex)
            ? text // Example formatting: ([A-Z])\w+
            : text
                .replace(/\r/gi, "")
                .replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"),
            ((isCaseSensitive) ? "g" : "gi") + "m"
        );
    }

    function replaceWithIndices(pageText, findRegex, replaceText, replaceIndices) {
        var matchCounter = 0;
        var ri = 0;
        return pageText.replace(findRegex, (match) => {
            if (ri < replaceIndices.length && matchCounter === replaceIndices[ri]) {
                ri++;
                matchCounter++;
                return match.replace(findRegex, replaceText);
            } else {
                matchCounter++;
                return match;
            }
        });
    }

    // handlePage should be of type async function (page)
    function handlePages(memberList, memberListType, additionalParams, handlePage) {
        var revisionGenerator;
        switch (memberListType) {
            case 'Pages':
                revisionGenerator = getRevisionsInPageList;
                break;
            case 'Categories':
                revisionGenerator = getRevisionsInCategories;
                break;
            case 'Namespaces':
                revisionGenerator = getRevisionsInNamespaces;
                break;
        }

        return runGenerator(() => revisionGenerator(memberList, additionalParams, handlePage));
    }

    /* 
    * Inverted generator pattern, where the generator function runs the main code,
    * and yield is used to delegate to a function that returns a promise.
    * The runner unwraps the promise and resumes the generator with the value.
    * https://davidwalsh.name/async-generators
    * 
    * In this version yield calls in the generator must always return a promise. This makes the final promise return trivial.
    */
    function runGenerator(generator) {
        return new Promise((resolve, reject) => {
            var iterator = generator();
            function iterate(nextPromise) {
                if (nextPromise.done) {
                    resolve();
                } else {
                    nextPromise.value.then(
                        value => iterate(iterator.next(value)),
                        error => iterate(iterator.throw(error))
                    ).catch(error => reject(error));
                }
            }
            iterate(iterator.next());
        });
    }

    function* getRevisionsInPageList(pages, additionalParams, handlePage) {
        let seen = new Set();
        for (let i = 0; i < pages.length; i += 50) {
            let pageBatch = pages.slice(i, i + 50);
            let resultPages = yield getPageRevisionBatch(pageBatch, additionalParams);
            for (const pageId in resultPages) {
                const page = resultPages[pageId];
                if (!seen.add(page.pageid)) continue;
                yield handlePage(page);
            }
        }
    }

    // limited to 50 (or 500 for clients w/ higher limits) pages
    function getPageRevisionBatch(pages, additionalParams) {
        var params = {
            action: "query",
            prop: "revisions",
            rvprop: "timestamp|content|size",
            rvslots: "*",
            titles: pages.join('|'),
            format: "json",
            formatversion: "2",
        };
        if (pages.length == 1) {
            params.rvlimit = "1";
        }
        if (additionalParams) {
            Object.assign(params, additionalParams);
        }
        return api.get(params).then(result => {
            // if (result?.query?.pages === undefined) {
            if (!(result && result.query && result.query.pages)) {
                throw new Error("Failed to get page revisions for pages " + pages.join(', '));
            }
            const resultPages = result.query.pages;
            return resultPages;
        });
    }

    function* getRevisionsInCategories(categories, additionalParams, handlePage) {
        let seen = new Set();
        for (const category of categories) {
            let categoryMemberIterator = getCategoryMemberRevisions(category, additionalParams);
            let categoryMemberPromise;
            while (true) {
                categoryMemberPromise = categoryMemberIterator.next();
                if (categoryMemberPromise.done) break;
                const resultPages = yield categoryMemberPromise.value;
                for (const page of resultPages) {
                    if (!seen.add(page.pageid)) continue;
                    yield handlePage(page);
                }
            }
        }
    }

    function* getCategoryMemberRevisions(category, additionalParams) {
        var params = {
            action: "query",
            prop: "revisions",
            rvprop: "timestamp|content|size",
            rvslots: "*",
            generator: "categorymembers",
            gcmtitle: category, // "Category:Browse",
            format: "json",
            formatversion: "2",
        };
        if (additionalParams) {
            Object.assign(params, additionalParams);
        }

        var shouldContinue = true;
        while (shouldContinue) {
            yield api.get(params).then(result => {
                // if (result?.query?.pages === undefined) {
                if (!(result && result.query && result.query.pages)) {
                    throw new Error("Failed to get category member revisions for category " + category);
                }
                if (result.continue) {
                    let continueKey = result.continue.continue.replace(/\|\|$/, '');
                    params[continueKey] = result.continue[continueKey];
                } else {
                    shouldContinue = false;
                }
                const resultPages = result.query.pages;
                return resultPages;
            });
        }
    }


    function* getRevisionsInNamespaces(namespaces, additionalParams, handlePage) {
        let seen = new Set();
        const namespaceIds = yield toNamespaceIdList(namespaces);
        for (const namespaceId of namespaceIds) {
            let namespaceMemberIterator = getNamespaceMemberRevisions(namespaceId, additionalParams);
            let namespaceMemberPromise;
            while (true) {
                namespaceMemberPromise = namespaceMemberIterator.next();
                if (namespaceMemberPromise.done) break;
                const resultPages = yield namespaceMemberPromise.value;
                for (const page of resultPages) {
                    if (!seen.add(page.pageid)) continue;
                    yield handlePage(page);
                }
            }
        }
    }

    function* getNamespaceMemberRevisions(namespaceId, additionalParams) {
        var params = {
            action: "query",
            prop: "revisions",
            rvprop: "timestamp|content|size",
            rvslots: "*",
            generator: "allpages",
            gapnamespace: namespaceId,
            format: "json",
            formatversion: "2",
        };
        if (additionalParams) {
            Object.assign(params, additionalParams);
        }

        var shouldContinue = true;
        while (shouldContinue) {
            yield api.get(params).then(result => {
                // if (result?.query?.pages === undefined) {
                if (!(result && result.query && result.query.pages)) {
                    throw new Error("Failed to get namespace member revisions for namespace " + namespaceId);
                }
                if (result.continue) {
                    let continueKey = result.continue.continue.replace(/\|\|$/, '');
                    params[continueKey] = result.continue[continueKey];
                } else {
                    shouldContinue = false;
                }
                const resultPages = result.query.pages;
                return resultPages;
            });
        }
    }

    function toNamespaceIdList(namespaces) {
        let nsToNsIdPromise = getNamespaceToNamespaceIds();
        return nsToNsIdPromise.then(nsToNsId => {
            return namespaces.map(namespace => nsToNsId.get(namespace));
        });
    }

    var nsToNsId = new Map();
    function getNamespaceToNamespaceIds() {
        if (nsToNsId.size === 0) {
            var params = {
                action: "query",
                meta: "siteinfo",
                siprop: "namespaces|namespacealiases",
                format: "json",
                formatversion: "2",
            };
            return api.get(params).then(result => {
                // if (result?.query?.namespaces !== undefined) {
                if (result && result.query && result.query.namespaces) {
                    const namespaceResults = result.query.namespaces;
                    for (const nsId in namespaceResults) {
                        const namespace = namespaceResults[nsId];
                        if (namespace.canonical === '') {
                            nsToNsId.set('Main', namespace.id);
                        } else {
                            nsToNsId.set(namespace.canonical, namespace.id);
                        }

                    }
                }
                // if (result?.query?.namespacealiases !== undefined) {
                if (result && result.query && result.query.namespacealiases) {
                    const aliasResults = result.query.namespacealiases;
                    for (const alias of aliasResults) {
                        nsToNsId.set(alias["*"], alias.id);
                    }
                }
                return nsToNsId;
            });
        } else {
            return Promise.resolve(nsToNsId);
        }
    }

    function onToolClick(e) {
        e.preventDefault();
        if (modalPromise !== undefined) {
            if (modal !== undefined) {
                modal.open();
            }
        } else {
            modalPromise = window.dev.modal.createOOUIWindow('Mass Edit', 'Mass Edit', {}, initModal, false, false, false);
            modalPromise.then(dialog => {
                modal = dialog;
                modal.open();
            });
        }
    }

    function initMassEditEditorTool() {
        api = new mw.Api();
        const plink = mw.util.addPortletLink('p-tb', '#', 'Mass edit', 't-mass-edit', 'Mass edit', null, null);
        plink.onclick = onToolClick;
    }
    mw.loader.using(['mediawiki.api', 'oojs-ui-core', 'oojs-ui-widgets']).then(function () {
        initMassEditEditorTool();
    });
})(this, jQuery, mediaWiki);
