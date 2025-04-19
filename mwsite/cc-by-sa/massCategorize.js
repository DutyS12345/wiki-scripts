/**
 * Adapted from Mass Categorization by Dorumin and Ozuzanna.
 * https://dev.fandom.com/wiki/MediaWiki:MassCategorization/code.js
 * @external window.dev.modal
 * @external mediawiki.api
 */

(function (window, $, mw) {
    'use strict';

    if (
        window.isMassCategorizeLoaded ||
        !/sysop|staff|moderator/.test(mw.config.get('wgUserGroups').join())
    ) {
        return;
    }
    window.isMassCategorizeLoaded = true;

    var api;
    var modalPromise, modal;


    function initModal(modal) {
        modal.size = 'large';

        var pageSelection;

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
        var $header = window.dev.modal.createBasicHeaderPanel([], 'Mass Categorize', [closeButton.$element]);

        var contentPanel = new OO.ui.PanelLayout({ padded: true, expanded: false });
        var addCategoryRowButton = new OO.ui.ButtonWidget({
            invisibleLabel: true,
            label: 'Add category row',
            icon: 'add',
            title: 'Add',
            framed: false,
        });
        var removeCategoryRowButton = new OO.ui.ButtonWidget({
            invisibleLabel: true,
            label: 'Remove category row',
            icon: 'subtract',
            title: 'Remove',
            framed: false,
        });
        removeCategoryRowButton.toggle(false);

        var categoryRows = [];

        var categoryRowActionButtons = new OO.ui.PanelLayout({ padded: false, expanded: false });
        categoryRowActionButtons.$element.css({
            'float': 'right',
        });
        categoryRowActionButtons.$element
            .append(addCategoryRowButton.$element)
            .append(removeCategoryRowButton.$element);

        var categoryRowsPanel = new OO.ui.PanelLayout({ padded: false, expanded: false });
        categoryRowsPanel.$element.css({
            clear: 'both'
        });

        // can turn this into real a ooui widget or class later
        function createCategoryUpdateRow() {
            var updateRow = {
                type: new OO.ui.DropdownInputWidget({
                    options: [
                        { data: 'add', label: 'Add' },
                        { data: 'remove', label: 'Remove' },
                        { data: 'replace', label: 'Replace' }
                    ]
                }),
                categoryFindLabel: new OO.ui.LabelWidget({ label: 'Category:' }),
                categoryFind: new OO.ui.TextInputWidget(),
                categoryLabel: new OO.ui.LabelWidget({ label: 'Category:' }),
                category: new OO.ui.TextInputWidget(),
            };
            updateRow.type.$element.css({ width: 'auto' });
            updateRow.categoryFind.$element.css({ width: 'auto' });
            updateRow.category.$element.css({ width: 'auto' });
            function showUpdateRowLabels(type) {
                switch (type) {
                    case 'replace':
                        updateRow.categoryFindLabel.toggle(true);
                        updateRow.categoryFind.toggle(true);
                        updateRow.categoryLabel.setLabelContent('with Category:');
                        break;
                    case 'add':
                    case 'remove':
                    default:
                        updateRow.categoryFindLabel.toggle(false);
                        updateRow.categoryFind.toggle(false);
                        updateRow.categoryLabel.setLabelContent('Category:');
                        break;
                }
            }
            showUpdateRowLabels('add');
            updateRow.type.on('change', showUpdateRowLabels);
            updateRow.layout = new OO.ui.HorizontalLayout({
                items: [updateRow.type, updateRow.categoryFindLabel, updateRow.categoryFind, updateRow.categoryLabel, updateRow.category]
            });
            updateRow.$element = updateRow.layout.$element;
            updateRow.getUpdate = function () {
                const category = updateRow.category.getValue().replaceAll('_', '').trim();
                if (category !== '') {
                    var update = {
                        type: updateRow.type.getValue()
                    };
                    if (update.type === 'add') {
                        update.newCategory = category;
                    } else if (update.type === 'remove') {
                        update.oldCategory = category;
                    } else if (update.type === 'replace') {
                        update.newCategory = category;
                        const categoryFind = updateRow.categoryFind.getValue().replaceAll('_', '').trim();
                        update.oldCategory = categoryFind;
                    }
                    return update;
                }
                return undefined;
            };
            return updateRow;
        }

        var options = new OO.ui.FieldLayout(new OO.ui.CheckboxMultiselectWidget({
            items: [
                new OO.ui.CheckboxMultioptionWidget({
                    data: 'noinclude',
                    label: 'Do not include in transclusion (for templates)',
                }),
                new OO.ui.CheckboxMultioptionWidget({
                    data: 'case-sensitive',
                    label: 'Case sensitive (remove and replace only)',
                }),
                new OO.ui.CheckboxMultioptionWidget({
                    data: 'suppress-edit-summary',
                    label: 'Suppress (automatic) from the edit summary',
                })
            ]
        }),
            {
                align: 'top',
                label: 'Options'
            }
        );

        var addCategoryInput = new OO.ui.ActionFieldLayout(
            new OO.ui.TextInputWidget({
            }),
            new OO.ui.ButtonWidget({
                label: 'Add Pages'
            }),
            {
                align: 'top',
                label: 'Add pages from category',
                help: 'Omit the "Category:" namespace prefix'
            }
        );
        addCategoryInput.buttonWidget.on('click', function () {
            var category = addCategoryInput.fieldWidget.getValue().trim();
            addCategoryInput.fieldWidget.setValue('');
            if (category !== '') {
                getCategoryContents(category)
                    .then(function (categories) {
                        var selection = pageSelection.fieldWidget.getValue();
                        if (selection.length === 0 || selection.slice(-1) === '\n') {
                            pageSelection.fieldWidget.setValue(pageSelection.fieldWidget.getValue() + categories.join('\n'));
                        } else {
                            pageSelection.fieldWidget.setValue(pageSelection.fieldWidget.getValue() + '\n' + categories.join('\n'));
                        }
                    })
                    .catch(function (code) {
                        errorMessage.append('GetContents ' + category + ' error ' + code);
                    });
            }
        });

        pageSelection = new OO.ui.FieldLayout(
            new OO.ui.MultilineTextInputWidget({
                autosize: true,
                rows: 4,
                maxRows: 8,
                allowLinebreaks: true
            }),
            {
                align: 'top',
                label: 'Pages to categorize (separate by newline)'
            }
        );

        var statusMessage = new OO.ui.PanelLayout({ padded: true, expanded: false, framed: true, scrollable: true });
        statusMessage.append = function (msg) {
            statusMessage.$element.append(msg).append('<br />');
        };

        var startStopButton = new OO.ui.ButtonWidget({
            label: 'Start',
            title: 'Start'
        });

        var panel = {
            addCategoryRow: function () {
                let newCategoryRow = createCategoryUpdateRow();
                categoryRows.push(newCategoryRow);
                categoryRowsPanel.$element.append(newCategoryRow.$element);
                removeCategoryRowButton.toggle(true);
            },
            removeCategoryRow: function () {
                let lastCategoryRow = categoryRows.pop();
                lastCategoryRow.$element.remove();
                if (categoryRows.length <= 1) {
                    removeCategoryRowButton.toggle(false);
                }
            },
            getCategoryUpdates: function () {
                const updateList = categoryRows.map(updateRow => updateRow.getUpdate()).filter(update => update !== undefined);
                var updates = {
                    addUpdates: [],
                    removeUpdates: [],
                    replaceUpdates: [],
                };
                for (const update of updateList) {
                    if (update.type === 'add' && update.newCategory.trim() !== '') {
                        updates.addUpdates.push(update);
                    } else if (update.type === 'remove' && update.oldCategory.trim() !== '') {
                        updates.removeUpdates.push(update);
                    } else if (update.type === 'replace' && update.oldCategory.trim() !== '' && update.newCategory.trim() !== '') {
                        updates.replaceUpdates.push(update);
                    }
                }
                return updates;
            },
            getOptions: function () {
                let ret = {
                    'noinclude': false,
                    'case-sensitive': false,
                    'suppress-edit-summary': false
                };
                let checkboxes = options.fieldWidget.findSelectedItemsData();
                for (let checkbox of checkboxes) {
                    ret[checkbox] = true;
                }
                return ret;
            },
            printStatusMessage: (message) => statusMessage.append(message),
        };
        panel.addCategoryRow();
        addCategoryRowButton.on('click', () => panel.addCategoryRow());
        removeCategoryRowButton.on('click', () => panel.removeCategoryRow());

        contentPanel.$element
            .append(categoryRowActionButtons.$element)
            .append(categoryRowsPanel.$element)
            .append(options.$element)
            .append(addCategoryInput.$element)
            .append(pageSelection.$element)
            .append(statusMessage.$element)
            .append(startStopButton.$element);
        modal.$body
            .append($header)
            .append(contentPanel.$element);
        let updateSizeObserver = new ResizeObserver(() => modal.updateSize());
        updateSizeObserver.observe(modal.$body.get(0), { childList: true, subtree: true });
        var paused = true;
        startStopButton.onClick = function () {
            if (paused) {
                startCategorize();
            } else {
                stopCategorize();
            }
        };
        startStopButton.on('click', startStopButton.onClick);

        function startCategorize() {
            paused = false;
            startStopButton.setLabel('Stop');
            const updates = panel.getCategoryUpdates();
            const options = panel.getOptions();
            process(updates, options);
        }

        function stopCategorize() {
            paused = true;
            startStopButton.setLabel('Start');
        }

        function process(updates, options) {
            if (paused) {
                return;
            }
            var textField = pageSelection.fieldWidget;
            var pages = textField.getValue().split('\n');
            var currentPage = pages[0].trim();
            pages = pages.slice(1, pages.length);
            textField.setValue(pages.join('\n'));
            if (!currentPage) {
                statusMessage.append('Done');
                stopCategorize();
            } else {
                performAction(currentPage, updates, options);
            }
        }

        function performAction(currentPage, updates, options) {
            return Promise.all([getPageAndCategories(currentPage), getNamespaceIdsToNamespace()])
                .then((results) => {
                    const [page, nsIdToNs] = results;
                    const { ns, pageid, title, missing } = page;
                    // const revision = page?.revisions?.[0]?.slots?.main;
                    const revision = page && page.revisions && page.revisions[0] && page.revisions[0].slots ? page.revisions[0].slots.main : undefined;
                    // const categories = page?.categories;
                    var skipCount = 0;
                    const categories = page && page.categories ? page.categories : undefined;
                    if (missing || revision === undefined || categories === undefined) { // error missing page, revision, or categories;
                        skipCount++;
                        panel.printStatusMessage("Failed to get revision and categories for " + title);
                        return;
                    }
                    var oldPageText = revision.content;
                    var pageText = revision.content;
                    const { addUpdates, removeUpdates, replaceUpdates } = updates;
                    const {
                        'noinclude': noInclude,
                        'case-sensitive': caseSensitive,
                        'suppress-edit-summary': suppressEditSummary
                    } = options;

                    const categoryAliases = nsIdToNs.get(14);
                    const categoryTitles = categories.map(category => category.title.slice(category.title.indexOf(':') + 1));
                    const categorySet = caseSensitive ? new Set(categoryTitles) : new Set(categoryTitles.map(title => title.toLowerCase()));
                    const changes = [];
                    for (let replaceUpdate of replaceUpdates) {
                        const matchCat = caseSensitive ? capitalizeFirst(replaceUpdate.oldCategory) : replaceUpdate.oldCategory.toLowerCase();
                        if (categorySet.has(matchCat)) {
                            const regex = buildCategoryRegex(categoryAliases, replaceUpdate.oldCategory, caseSensitive);
                            pageText = pageText.replaceAll(regex, '[[$1:' + replaceUpdate.newCategory + ']]');
                            changes.push("Replaced " + categoryAliases[0] + ":" + replaceUpdate.oldCategory + " with " + categoryAliases[0] + ":" + replaceUpdate.newCategory);
                        }
                    }
                    for (let removeUpdate of removeUpdates) {
                        const matchCat = caseSensitive ? capitalizeFirst(removeUpdate.oldCategory) : removeUpdate.oldCategory.toLowerCase();
                        if (categorySet.has(matchCat)) {
                            const regex = buildCategoryRegex(categoryAliases, removeUpdate.oldCategory, caseSensitive);
                            pageText = pageText.replaceAll(regex, '');
                            changes.push("Removed " + categoryAliases[0] + ":" + removeUpdate.oldCategory);
                        }
                    }
                    var linksToAdd = '';
                    for (let addUpdate of addUpdates) {
                        const matchCat = caseSensitive ? capitalizeFirst(addUpdate.newCategory) : addUpdate.newCategory.toLowerCase();
                        if (!categorySet.has(matchCat)) {
                            const newCategoryLink = '[[' + categoryAliases[0] + ':' + addUpdate.newCategory + ']]';
                            linksToAdd += newCategoryLink;
                            changes.push("Added " + categoryAliases[0] + ":" + addUpdate.newCategory);
                        }
                    }
                    if (linksToAdd.length !== 0) {
                        if (noInclude) {
                            let regex = /<\/noinclude>\s*$/i;
                            if (regex.test(pageText)) {
                                pageText = pageText.replace(regex, linksToAdd + '</noinclude>');
                            } else {
                                pageText += '<noinclude>' + linksToAdd + '</noinclude>';
                            }
                        } else {
                            pageText += linksToAdd;
                        }
                    }
                    if (oldPageText !== pageText) {
                        return editPage(title, (oldContents) => pageText, suppressEditSummary ? '' : '(automatic)')
                            .then(() => {
                                panel.printStatusMessage('Edited ' + title + '\n\t' + JSON.stringify(changes));
                                setTimeout(() => process(updates, options), 2000);
                            }, (error) => {
                                panel.printStatusMessage('Error editing ' + title + ' ' + error.message);
                                setTimeout(() => process(updates, options), 2000);
                            });
                    } else {
                        // no changes
                        panel.printStatusMessage('No changes to ' + title);
                        setTimeout(() => process(updates, options), 2000);
                        return;
                    }
                }, (error) => {
                    panel.printStatusMessage('Could not get ' + currentPage + ' ' + error.message);
                    setTimeout(() => process(updates, options), 2000);
                });
        }

        return;
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

    function capitalizeFirst(title) {
        if (title.length < 1) {
            return title;
        } else {
            return title[0].toUpperCase() + title.slice(1);
        }
    }

    function buildCategoryRegex(categoryAliases, category, caseSensitive) {
        return new RegExp('\\[\\[' + '(' + categoryAliases.join('|') + ')' + ':(' + category + ')((?:\\|.*?)?)\\]\\]', caseSensitive ? 'gi' : 'g');
    }

    function getPageAndCategories(title) {
        return api.get({
            action: "query",
            prop: "revisions|categories",
            rvprop: "timestamp|content|size",
            rvslots: "*",
            rvlimit: "1",
            titles: title,
            format: "json",
            formatversion: "2",
        }).then(result => {
            if (!(result && result.query && result.query.pages && result.query.pages[0])) {
                throw new Error("Failed to get page revisions for page " + title);
            }
            const resultPages = result.query.pages[0];
            return resultPages;
        });
    }

    var nsIdToNs = new Map(); // map nsid to list of aliases 
    function getNamespaceIdsToNamespace() {
        if (nsIdToNs.size === 0) {
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
                        const ns = namespace.canonical === '' ? 'Main' : namespace.canonical;
                        if (nsIdToNs.has(namespace.id)) {
                            if (!nsIdToNs.get(namespace.id).includes(ns)) {
                                nsIdToNs.get(namespace.id).push(ns);
                            }
                        } else {
                            nsIdToNs.set(namespace.id, [ns]);
                        }
                    }
                }
                // if (result?.query?.namespacealiases !== undefined) {
                if (result && result.query && result.query.namespacealiases) {
                    const aliasResults = result.query.namespacealiases;
                    for (const alias of aliasResults) {
                        const ns = alias["*"];
                        if (nsIdToNs.has(alias.id)) {
                            if (!nsIdToNs.get(alias.id).includes(ns)) {
                                nsIdToNs.get(alias.id).push(ns);
                            }
                        } else {
                            nsIdToNs.set(alias.id, [ns]);
                        }
                    }
                }
                return nsIdToNs;
            });
        } else {
            return Promise.resolve(nsIdToNs);
        }
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

    function onToolClick(e) {
        e.preventDefault();
        if (modalPromise !== undefined) {
            if (modal !== undefined) {
                modal.open();
            }
        } else {
            modalPromise = window.dev.modal.createOOUIWindow('Mass Categorize', 'Mass Categorize', {}, initModal, false, false, false);
            modalPromise.then(dialog => {
                modal = dialog;
                modal.open();
            });
        }
    }

    function initMassCategorizeEditorTool() {
        api = new mw.Api();
        const plink = mw.util.addPortletLink('p-tb', '#', 'Mass categorize', 't-mass-categorize', 'Mass categorize', null, null);
        plink.onclick = onToolClick;
    }
    mw.loader.using(['mediawiki.api', 'oojs-ui-core', 'oojs-ui-widgets']).then(function () {
        initMassCategorizeEditorTool();
    });
})(this, jQuery, mediaWiki);
