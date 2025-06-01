/**
 * Drop-In Editor allows for initializing configurable editors for mediawiki sites, leveraging the extensions below.
 * Copyright (C) 2025 DutyS12345
 * 
 * GPLv3 or later
 * 
 * Uses code from mediawiki WikiEditor extension, licensed under GPLv2 or later
 * https://www.mediawiki.org/wiki/Extension:WikiEditor
 * Uses code from mediawiki CodeEditor extension, licensed under GPLv2 or later
 * https://www.mediawiki.org/wiki/Extension:CodeEditor
 * Uses code from mediawiki CodeMirror extension, licensed under GPLv2 or later
 * https://www.mediawiki.org/wiki/Extension:CodeMirror
 */
(function (window, $, mw) {
    'use strict';

    var config = mw.config.get([
        'wgSiteName',
        'wgFormattedNamespaces',
        'wgPageName',
        'wgCanonicalSpecialPageName',
    ]);
    var api;
    var codeMirrorDependencies = [
        "jquery.ui",
        "jquery.textSelection",
        "ext.CodeMirror",
        "ext.CodeMirror.lib",
        "ext.CodeMirror.addons",
        // todo lazy loading per mode
        "ext.CodeMirror.mode.mediawiki",

        "ext.CodeMirror.lib.mode.clike",
        "ext.CodeMirror.lib.mode.css",
        "ext.CodeMirror.lib.mode.htmlmixed",
        "ext.CodeMirror.lib.mode.javascript",
        "ext.CodeMirror.lib.mode.php",
        "ext.CodeMirror.lib.mode.xml",
    ];
    var cmWikiEditorDependencies = [
        "ext.CodeMirror.WikiEditor",
    ]
    var wikiEditorDependencies = [
        "ext.wikiEditor",
    ];
    var aceWikiEditorDependencies = [
        "jquery.codeEditor",
    ]
    var aceEditorDependencies = [
        "ext.codeEditor.ace",
        "ext.codeEditor.ace.modes",
        "ext.codeEditor.icons",
        "ext.codeEditor.styles",

        "jquery.ui",
        "mediawiki.api",
        "mediawiki.user",
        "user.options",
        "mediawiki.cookie",
        "jquery.textSelection",
        "oojs-ui-windows",
        "oojs-ui.styles.icons-content",
        "oojs-ui.styles.icons-editing-advanced",
        "oojs-ui.styles.icons-editing-list",
        "ext.codeEditor.icons"
    ];

    function isMultiEditorPage() {
        // return true;
        return config.wgPageName === config.wgFormattedNamespaces[-1] + ':MultiEdit'
            || config.wgCanonicalSpecialPageName === 'Blankpage' && new URLSearchParams(window.location.search).get('blankspecial') === 'MultiEdit';
    }

    function loadMultiEditorPage($content) {
        $('.page-header__title').text('Multi Edit'); // Page header text
        $('#firstHeading').text('Multi Edit'); // Page header text
        document.title = 'Multi Edit' + ' | ' + config.wgSiteName; // Page title
        $content.empty();

        mw.loader.using(codeMirrorDependencies).then(require => addCodeMirrorInstance(addTextArea($content, 'Initial value cm')))
            .then(require => {
                mw.loader.using(aceEditorDependencies).then(require => {
                    addAceEditorInstance(addTextArea($content, 'Initial value'), 'lua');
                    addAceEditorInstance(addTextArea($content, 'Initial value 2 text'), 'text');
                });
            })

        // mw.loader.using([...wikiEditorDependencies, ...codeMirrorDependencies, ...cmWikiEditorDependencies, ...aceWikiEditorDependencies, ...aceEditorDependencies]).then(require => {
        //     addWikiEditorInstance(require, $content);
        //     addWikiEditorInstance(require, $content);
        // });


    }

    function addCodeMirrorInstance($textarea, mode) {
        // jQuery.textSelection overrides for CodeMirror.
        // See jQuery.textSelection.js for method documentation

        const selectionStart = $textarea.prop('selectionStart'),
            selectionEnd = $textarea.prop('selectionEnd'),
            scrollTop = $textarea.scrollTop(),
            hasFocus = $textarea.is(':focus');


        function isLineNumbering() {
            // T285660: Backspace related bug on Android browsers as of 2021
            if (/Android\b/.test(navigator.userAgent)) {
                return false;
            }

            var namespaces = mw.config.get('wgCodeMirrorLineNumberingNamespaces');
            // Set to [] to disable everywhere, or null to enable everywhere
            return !namespaces ||
                namespaces.indexOf(mw.config.get('wgNamespaceNumber')) !== -1;
        }

        // T174055: Do not redefine the browser history navigation keys (T175378: for PC only)
        CodeMirror.keyMap.pcDefault['Alt-Left'] = false;
        CodeMirror.keyMap.pcDefault['Alt-Right'] = false;

        let config = mw.config.get('extCodeMirrorConfig');
        let options = {
            mwConfig: config,
            // styleActiveLine: true, // disabled since Bug: T162204, maybe should be optional
            lineWrapping: true,
            lineNumbers: isLineNumbering(),
            readOnly: $textarea[0].readOnly,
            // select mediawiki as text input mode
            mode: 'text/mediawiki',
            extraKeys: {
                Tab: false,
                'Shift-Tab': false,
                // T174514: Move the cursor at the beginning/end of the current wrapped line
                Home: 'goLineLeft',
                End: 'goLineRight'
            },
            inputStyle: 'contenteditable',
            spellcheck: true,
            viewportMargin: Infinity
        };

        options.matchBrackets = {
            highlightNonMatching: false,
            maxHighlightLineLength: 10000
        };
        if (mode !== 'text/mediawiki') {
            options.mode = mode;
        }

        let cm = CodeMirror.fromTextArea($textarea.get(0), options);

        const cmTextSelection = {
            getContents: function () {
                return cm.doc.getValue();
            },
            setContents: function (content) {
                cm.doc.setValue(content);
                return this;
            },
            getSelection: function () {
                return cm.doc.getSelection();
            },
            setSelection: function (options) {
                cm.doc.setSelection(
                    cm.doc.posFromIndex(options.start),
                    cm.doc.posFromIndex(options.end)
                );
                cm.focus();
                return this;
            },
            replaceSelection: function (value) {
                cm.doc.replaceSelection(value);
                return this;
            },
            getCaretPosition: function (options) {
                const caretPos = cm.doc.indexFromPos(cm.doc.getCursor(true)),
                    endPos = cm.doc.indexFromPos(cm.doc.getCursor(false));
                if (options.startAndEnd) {
                    return [caretPos, endPos];
                }
                return caretPos;
            },
            scrollToCaretPosition: function () {
                cm.scrollIntoView(null);
                return this;
            }
        };

        const $codeMirror = $(cm.getWrapperElement());

        cm.on('focus', () => {
            $textarea[0].dispatchEvent(new Event('focus'));
        });
        cm.on('blur', () => {
            $textarea[0].dispatchEvent(new Event('blur'));
        });
        cm.on('keydown', (_, e) => {
            if (e.ctrlKey || e.metaKey) {
                // Possibly a WikiEditor keyboard shortcut
                if (!$textarea[0].dispatchEvent(new KeyboardEvent('keydown', e))) {
                    // If it was actually a WikiEditor keyboard shortcut, the default would be prevented
                    // for the dispatched event and hence dispatchEvent() would return false
                    e.preventDefault();
                }
            }
        });

        // Allow textSelection() functions to work with CodeMirror editing field.
        $codeMirror.textSelection('register', cmTextSelection);
        // Also override textSelection() functions for the "real" hidden textarea to route to CodeMirror.
        // We unregister this when switching to normal textarea mode.
        $textarea.textSelection('register', cmTextSelection);
        if (hasFocus) {
            cm.focus();
        }
        cm.doc.setSelection(cm.doc.posFromIndex(selectionEnd), cm.doc.posFromIndex(selectionStart));
        cm.scrollTo(null, scrollTop);

        // HACK: <textarea> font size varies by browser (chrome/FF/IE)
        $codeMirror.css({
            'font-size': $textarea.css('font-size'),
            'line-height': $textarea.css('line-height')
        });

        // use direction and language of the original textbox
        $codeMirror.attr({
            dir: $textarea.attr('dir'),
            lang: $textarea.attr('lang')
        });

        $(cm.getInputField())
            // T259347: Use accesskey of the original textbox
            .attr('accesskey', $textarea.attr('accesskey'))
            // T194102: UniversalLanguageSelector integration is buggy, disabling it completely
            .addClass('noime');

        if (mw.user.options.get('usecodemirror-colorblind')) {
            $codeMirror.addClass('cm-mw-colorblind-colors');
        }

        cm.refresh();
        // console.log(cm.textSelection('getContents'));
        let $wrapper = $(cm.getWrapperElement());
        $wrapper.resizable({
            handles: 's',
            resize: function (event, ui) {
                $wrapper.css("width", "100%");
            }
        });
        window.$textarea = $textarea;
        let context = {
            CodeMirror: cm,
        };
        $textarea.data('cm-context', context);


        return cm;
    }

    function addWikiEditorInstance(require, $content) {
        const WE = require('ext.wikiEditor');
        const CM = require('ext.CodeMirror');
        const mediawikiLang = require('ext.CodeMirror.mode.mediawiki');
        console.log('inside');
        const $textarea = $('<textarea>');
        $textarea.val('Initial value');
        mw.addWikiEditor($textarea);
        const wikiEditorContext = $textarea.data('wikiEditor-context');
        // let options = {};
        // const cm = CodeMirror.fromTextArea($textarea.get(0), options);
        $content.append(wikiEditorContext.$ui);
        window.textarea = $textarea;
        window.weContext = wikiEditorContext;
        window.cm = wikiEditorContext.$textarea.parent().closest(".CodeMirror");

        var lang = 'lua';
        initAceEditorInWikiEditor($textarea, lang);
    }

    function addWikiEditorAceInstance(require, $content) {
        const $textarea = $('<textarea>');
        $textarea.val('Initial value code');
        var lang = 'lua';
        initAceEditorInWikiEditor($textarea, lang);
        $content.append($textarea);
    }

    function initAceEditorInWikiEditor($textarea, lang) {

        // json, lua, css, js
        mw.config.set('wgCodeEditorCurrentLanguage', 'javascript');
        // eslint-disable-next-line no-jquery/no-global-selector

        // Code is supposed to be always LTR. See bug 39364.
        $textarea.parent().prop('dir', 'ltr');

        // Add code editor module
        $textarea.wikiEditor('addModule', 'codeEditor');

        $textarea.on('wikiEditor-toolbar-doneInitialSections', function () {
            $textarea.data('wikiEditor-context').fn.codeEditorMonitorFragment();
        });
    }

    function addPreviewSection($wrapper) {
        var $previewElement = $('<div>');
        $wrapper.append($previewElement);
        return $previewElement;
    }

    function addActionBar($wrapper) {
        var $actionBarElement = $('<div>');
        var actionBar = {
            editSummary: new OO.ui.TextInputWidget({

            }),
            saveButton: new OO.ui.ButtonWidget({
                label: 'Save changes',
                title: 'Save',
            }),
            previewButton: new OO.ui.ButtonWidget({
                label: 'Show preview',
                title: 'Preview',
            }),
            diffButton: new OO.ui.ButtonWidget({
                label: 'Show changes',
                title: 'Diff'
            }),
            cancelButton: new OO.ui.ButtonWidget({
                label: 'Reset',
                title: 'Reset',
            }),
        };
        $actionBarElement.append(new OO.ui.FieldLayout(actionBar.editSummary, {
            label: "Summary:"
        }));
        for (let button of [actionBar.saveButton, actionBar.previewButton, actionBar.diffButton, actionBar.cancelButton]) {
            button.onClickActions = [];
            button.addOnClickAction = function (func) {
                button.onClickActions.push(func);
            };
            button.on('click', evt => {
                for (let func of button.onClickActions) {
                    func();

                }
            })
            button.buttonActivateAction = function (index, delay) {
                let func = button.onClickActions.get(index);
                func();
                if (index < button.onClickActions.length - 2) {
                    setTimeout(() => buttonActivateAction(index + 1), delay);
                }
            };
            $actionBarElement.append(button.$element);
        }
        $wrapper.append($actionBarElement);
        return actionBar;
    }

    function addAceEditorInstance($textarea, lang) {
        let context = window.acecontext = {};
        context.$textarea = $textarea;

        var saveAndExtend,
            textSelectionFn,
            hasErrorsOnSave = false,
            selectedLine = 0,
            returnFalse = function () {
                return false;
            },
            api = new mw.Api();

        // Initialize state
        var cookieEnabled = parseInt(mw.cookie.get('codeEditor-' + context.instance + '-showInvisibleChars'), 10);
        context.showInvisibleChars = (cookieEnabled === 1);
        cookieEnabled = parseInt(mw.cookie.get('codeEditor-' + context.instance + '-lineWrappingActive'), 10);
        context.lineWrappingActive = (cookieEnabled === 1);

        /**
         * Compatibility with the $.textSelection jQuery plug-in. When the iframe is in use, these functions provide
         * equivalant functionality to the otherwise textarea-based functionality.
         */
        textSelectionFn = {

            /* Needed for search/replace */
            getContents: function () {
                return context.codeEditor.getSession().getValue();
            },

            setContents: function (newContents) {
                context.codeEditor.getSession().setValue(newContents);
            },

            /**
             * Gets the currently selected text in the content
             * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
             *
             * @return {string}
             */
            getSelection: function () {
                return context.codeEditor.getCopyText();
            },

            /**
             * Replace the current selection with the given text.
             * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
             *
             * @param {string} text
             */
            replaceSelection: function (text) {
                context.codeEditor.insert(text);
            },

            /**
             * Inserts text at the begining and end of a text selection, optionally inserting text at the caret when
             * selection is empty.
             * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
             *
             * @param {Object} options
             * @return {jQuery}
             */
            encapsulateSelection: function (options) {
                // Does not yet handle 'ownline', 'splitlines' option
                var sel = context.codeEditor.getSelection();
                var range = sel.getRange();
                var selText = textSelectionFn.getSelection();
                var isSample = false;

                if (!selText) {
                    selText = options.peri;
                    isSample = true;
                } else if (options.replace) {
                    selText = options.peri;
                }

                var text = options.pre;
                text += selText;
                text += options.post;
                context.codeEditor.insert(text);
                if (isSample && options.selectPeri && !options.splitlines) {
                    // May esplode if anything has newlines, be warned. :)
                    range.setStart(range.start.row, range.start.column + options.pre.length);
                    range.setEnd(range.start.row, range.start.column + selText.length);
                    sel.setSelectionRange(range);
                }
                return context.$textarea;
            },

            /**
             * Gets the position (in resolution of bytes not nessecarily characters) in a textarea
             * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
             *
             * @param {Object} options
             * @param {Object} [options.startAndEnd=false] Return range of the selection rather than just start
             * @return {number|number[]} If options.startAndEnd is true, returns an array holding the start and
             * end of the selection, else returns only the start of the selection as a single number.
             */
            getCaretPosition: function (options) {
                var selection = context.codeEditor.getSelection(),
                    range = selection.getRange(),
                    doc = context.codeEditor.getSession().getDocument(),
                    startOffset = doc.positionToIndex(range.start);

                if (options.startAndEnd) {
                    var endOffset = doc.positionToIndex(range.end);
                    return [startOffset, endOffset];
                }

                return startOffset;
            },

            /**
             * Sets the selection of the content
             * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
             *
             * @param {Object} options
             * @return {jQuery}
             */
            setSelection: function (options) {
                // Ace stores positions for ranges as row/column pairs.
                // To convert from character offsets, we'll need to iterate through the document
                var doc = context.codeEditor.getSession().getDocument();
                var lines = doc.getAllLines();

                var offsetToPos = function (offset) {
                    var row, col, pos;

                    row = 0;
                    col = 0;
                    pos = 0;

                    while (row < lines.length && pos + lines[row].length < offset) {
                        pos += lines[row].length;
                        pos++; // for the newline
                        row++;
                    }
                    col = offset - pos;
                    return { row: row, column: col };
                };
                var start = offsetToPos(options.start);
                var end = offsetToPos(options.end);

                var sel = context.codeEditor.getSelection();
                var range = sel.getRange();
                range.setStart(start.row, start.column);
                range.setEnd(end.row, end.column);
                sel.setSelectionRange(range);
                return context.$textarea;
            },

            /**
             * Scroll a textarea to the current cursor position. You can set the cursor position with setSelection()
             * DO NOT CALL THIS DIRECTLY, use $.textSelection( 'functionname', options ) instead
             *
             * @return {jQuery}
             */
            scrollToCaretPosition: function () {
                mw.log('codeEditor stub function scrollToCaretPosition called');
                return context.$textarea;
            }
        };
        /*
         * Event Handlers
         *
         * WikiEditor inspects the 'evt' object for event names and uses them if present as additional
         * event handlers that fire before the default handling.
         * To prevent WikiEditor from running its own handling, handlers should return false.
         *
         * This is also where we can attach some extra information to the events.
         */
        context.evt = $.extend(context.evt, {
            keydown: returnFalse,
            change: returnFalse,
            delayedChange: returnFalse,
            cut: returnFalse,
            paste: returnFalse,
            ready: returnFalse,
            codeEditorSubmit: function () {
                var form = this;
                context.evt.codeEditorSync();
                if (hasErrorsOnSave) {
                    hasErrorsOnSave = false;
                    OO.ui.confirm(mw.msg('codeeditor-save-with-errors')).done(function (confirmed) {
                        if (confirmed) {
                            // Programmatic submit doesn't retrigger this event listener
                            form.submit();
                        }
                    });
                    return false;
                }
                return true;
            },
            codeEditorSave: function () {
                if (context.codeEditor.getSession().getAnnotations().some(function (ann) {
                    return ann.type === 'error';
                })) {
                    hasErrorsOnSave = true;
                }
            },
            codeEditorSync: function () {
                context.$textarea.val(context.$textarea.textSelection('getContents'));

            }
        });

        context.fn = $.extend(context.fn, {
            isCodeEditorActive: function () {
                return context.codeEditorActive;
            },
            isShowInvisibleChars: function () {
                return context.showInvisibleChars;
            },
            isLineWrappingActive: function () {
                return context.lineWrappingActive;
            },
            changeCookieValue: function (cookieName, value) {
                mw.cookie.set(
                    'codeEditor-' + context.instance + '-' + cookieName,
                    value
                );
            },
            aceGotoLineColumn: function () {
                OO.ui.prompt(mw.msg('codeeditor-gotoline-prompt'), {
                    textInput: { placeholder: mw.msg('codeeditor-gotoline-placeholder') }
                }).done(function (result) {
                    if (!result) {
                        return;
                    }

                    var matches = result.split(':');
                    var line = 0;
                    var column = 0;

                    if (matches.length > 0) {
                        line = +matches[0];
                        if (isNaN(line)) {
                            return;
                        } else {
                            // Lines are zero-indexed
                            line--;
                        }
                    }
                    if (matches.length > 1) {
                        column = +matches[1];
                        if (isNaN(column)) {
                            column = 0;
                        }
                    }
                    context.codeEditor.navigateTo(line, column);
                    // Scroll up a bit to give some context
                    context.codeEditor.scrollToRow(line - 4);
                });
            },
            setupCodeEditorToolbar: function () {
                var toggleEditor = function (ctx) {
                    ctx.codeEditorActive = !ctx.codeEditorActive;

                    ctx.fn.setCodeEditorPreference(ctx.codeEditorActive);
                    ctx.fn.updateCodeEditorToolbarButton();

                    if (ctx.codeEditorActive) {
                        // set it back up!
                        ctx.fn.setupCodeEditor();
                    } else {
                        ctx.fn.disableCodeEditor();
                    }
                };
                var toggleInvisibleChars = function (ctx) {
                    ctx.showInvisibleChars = !ctx.showInvisibleChars;

                    ctx.fn.changeCookieValue('showInvisibleChars', ctx.showInvisibleChars ? 1 : 0);
                    ctx.fn.updateInvisibleCharsButton();

                    ctx.codeEditor.setShowInvisibles(ctx.showInvisibleChars);
                };
                var toggleSearchReplace = function (ctx) {
                    var searchBox = ctx.codeEditor.searchBox;
                    if (searchBox && $(searchBox.element).css('display') !== 'none') {
                        searchBox.hide();
                    } else {
                        ctx.codeEditor.execCommand(
                            ctx.codeEditor.getReadOnly() ? 'find' : 'replace'
                        );
                    }
                };
                var toggleLineWrapping = function (ctx) {
                    ctx.lineWrappingActive = !ctx.lineWrappingActive;

                    ctx.fn.changeCookieValue('lineWrappingActive', ctx.lineWrappingActive ? 1 : 0);
                    ctx.fn.updateLineWrappingButton();

                    ctx.codeEditor.getSession().setUseWrapMode(ctx.lineWrappingActive);
                };
                var indent = function (ctx) {
                    ctx.codeEditor.execCommand('indent');
                };
                var outdent = function (ctx) {
                    ctx.codeEditor.execCommand('outdent');
                };
                var gotoLine = function (ctx) {
                    ctx.codeEditor.execCommand('gotolinecolumn');
                };

                context.api.addToToolbar(context, {
                    section: 'main',
                    groups: {
                        'codeeditor-main': {
                            tools: {
                                codeEditor: {
                                    label: mw.msg('codeeditor-toolbar-toggle'),
                                    type: 'toggle',
                                    oouiIcon: 'markup',
                                    action: {
                                        type: 'callback',
                                        execute: toggleEditor
                                    }
                                }
                            }
                        },
                        'codeeditor-format': {
                            tools: {
                                indent: {
                                    label: mw.msg('codeeditor-indent'),
                                    type: 'button',
                                    oouiIcon: 'indent',
                                    action: {
                                        type: 'callback',
                                        execute: indent
                                    }
                                },
                                outdent: {
                                    label: mw.msg('codeeditor-outdent'),
                                    type: 'button',
                                    oouiIcon: 'outdent',
                                    action: {
                                        type: 'callback',
                                        execute: outdent
                                    }
                                }

                            }
                        },
                        'codeeditor-style': {
                            tools: {
                                invisibleChars: {
                                    label: mw.msg('codeeditor-invisibleChars-toggle'),
                                    type: 'toggle',
                                    oouiIcon: 'pilcrow',
                                    action: {
                                        type: 'callback',
                                        execute: toggleInvisibleChars
                                    }
                                },
                                lineWrapping: {
                                    label: mw.msg('codeeditor-lineWrapping-toggle'),
                                    type: 'toggle',
                                    oouiIcon: 'wrapping',
                                    action: {
                                        type: 'callback',
                                        execute: toggleLineWrapping
                                    }
                                },
                                gotoLine: {
                                    label: mw.msg('codeeditor-gotoline'),
                                    type: 'button',
                                    oouiIcon: 'gotoLine',
                                    action: {
                                        type: 'callback',
                                        execute: gotoLine
                                    }
                                },
                                toggleSearchReplace: {
                                    label: mw.msg('codeeditor-searchReplace-toggle'),
                                    type: 'button',
                                    oouiIcon: 'articleSearch',
                                    action: {
                                        type: 'callback',
                                        execute: toggleSearchReplace
                                    }
                                }
                            }
                        }
                    }
                });
                context.fn.updateCodeEditorToolbarButton();
                context.fn.updateInvisibleCharsButton();
                context.fn.updateLineWrappingButton();
                $('.group-codeeditor-style').prependTo('.section-main');
                $('.group-codeeditor-format').prependTo('.section-main');
                $('.group-codeeditor-main').prependTo('.section-main');
            },
            updateButtonIcon: function (targetName, iconFn) {
                var target = '.tool[rel=' + targetName + ']',
                    $button = context.modules.toolbar.$toolbar.find(target);

                $button.data('setActive')(iconFn());
            },
            updateCodeEditorToolbarButton: function () {
                context.fn.updateButtonIcon('codeEditor', context.fn.isCodeEditorActive);
            },
            updateInvisibleCharsButton: function () {
                context.fn.updateButtonIcon('invisibleChars', context.fn.isShowInvisibleChars);
            },
            updateLineWrappingButton: function () {
                context.fn.updateButtonIcon('lineWrapping', context.fn.isLineWrappingActive);
            },
            setCodeEditorPreference: function (prefValue) {
                // Abort any previous request
                api.abort();

                api.saveOption('usecodeeditor', prefValue ? 1 : 0)
                    .fail(function (code, result) {
                        if (code === 'http' && result.textStatus === 'abort') {
                            // Request was aborted. Ignore error
                            return;
                        }
                        if (code === 'notloggedin') {
                            // Expected for non-registered users
                            return;
                        }

                        var message = 'Failed to set code editor preference: ' + code;
                        if (result.error && result.error.info) {
                            message += '\n' + result.error.info;
                        }
                        mw.log.warn(message);
                    });
            },
            /**
             * Sets up the iframe in place of the textarea to allow more advanced operations
             */
            setupCodeEditor: function (lang) {
                // WGL - Add version parameter to allow for long-term caching.
                ace.config.set('suffix', '.js?version=' + ace.version);

                var $box = context.$textarea;
                // var lang = mw.config.get('wgCodeEditorCurrentLanguage');
                var basePath = mw.config.get('wgExtensionAssetsPath', '');
                if (basePath.slice(0, 2) === '//') {
                    // ACE uses web workers, which have importScripts, which don't like relative links.
                    // This is a problem only when the assets are on another server, so this rewrite should suffice
                    // Protocol relative
                    basePath = window.location.protocol + basePath;
                }
                ace.config.set('basePath', basePath + '/CodeEditor/modules/lib/ace');

                if (lang) {
                    // Ace doesn't like replacing a textarea directly.
                    // We'll stub this out to sit on top of it...
                    // line-height is needed to compensate for oddity in WikiEditor extension, which zeroes the line-height on a parent container
                    // eslint-disable-next-line no-jquery/no-parse-html-literal
                    var container = context.$codeEditorContainer = $('<div style="position: relative"><div class="editor" style="line-height: 1.5em; top: 0; left: 0; right: 0; bottom: 0; position: absolute;"></div></div>').insertAfter($box);
                    var editdiv = container.find('.editor');

                    $box.css('display', 'none');
                    container.height($box.height());

                    // Non-lazy loaded dependencies: Enable code completion
                    ace.require('ace/ext/language_tools');

                    // Load the editor now
                    context.codeEditor = ace.edit(editdiv[0]);
                    context.codeEditor.getSession().setValue($box.val());
                    $box.textSelection('register', textSelectionFn);

                    // Disable some annoying keybindings
                    context.codeEditor.commands.bindKeys({
                        'Ctrl-T': null,
                        'Ctrl-L': null,
                        'Command-L': null
                    });

                    context.codeEditor.setReadOnly($box.prop('readonly'));
                    context.codeEditor.setShowInvisibles(context.showInvisibleChars);

                    // The options to enable
                    context.codeEditor.setOptions({
                        enableBasicAutocompletion: true,
                        enableSnippets: true
                    });

                    context.codeEditor.commands.addCommand({
                        name: 'gotolinecolumn',
                        bindKey: { mac: 'Command-Shift-L', windows: 'Ctrl-Alt-L' },
                        exec: context.fn.aceGotoLineColumn,
                        readOnly: true
                    });

                    $box.closest('form')
                        .on('submit', context.evt.codeEditorSubmit)
                        .find('#wpSave').on('click', context.evt.codeEditorSave);

                    var session = context.codeEditor.getSession();

                    // Use proper tabs
                    session.setUseSoftTabs(false);
                    session.setUseWrapMode(context.lineWrappingActive);

                    // Configure any workers
                    session.on('changeMode', function (e, session2) {
                        // eslint-disable-next-line no-jquery/variable-pattern
                        var mode = session2.getMode().$id;
                        if (mode === 'ace/mode/javascript') {
                            session2.$worker.send('changeOptions', [{
                                maxerr: 1000
                            }]);
                        }
                    });

                    mw.hook('codeEditor.configure').fire(session);

                    // Add an Ace change handler to pass changes to Edit Recovery.
                    mw.hook('editRecovery.loadEnd').add(function (data) {
                        session.on('change', data.fieldChangeHandler);
                    });

                    ace.config.loadModule('ace/ext/modelist', function (modelist) {
                        if (!modelist || !modelist.modesByName[lang]) {
                            lang = 'text';
                        }
                        session.setMode('ace/mode/' + lang);
                    });

                    // Use jQuery UI resizable() so that users can make the box taller
                    // eslint-disable-next-line es-x/no-resizable-and-growable-arraybuffers
                    container.resizable({
                        handles: 's',
                        minHeight: $box.height(),
                        resize: function (event, ui) {
                            container.css("width", "100%");
                            // eslint-disable-next-line es-x/no-resizable-and-growable-arraybuffers
                            context.codeEditor.resize();

                        }
                    });
                    $('.wikiEditor-ui-toolbar').addClass('codeEditor-ui-toolbar');

                    if (selectedLine > 0) {
                        // Line numbers in CodeEditor are zero-based
                        context.codeEditor.navigateTo(selectedLine - 1, 0);
                        // Scroll up a bit to give some context
                        context.codeEditor.scrollToRow(selectedLine - 4);
                    }

                    context.fn.setupStatusBar();

                    document.body.classList.remove('codeeditor-loading');
                }
            },

            /**
             * Turn off the code editor view and return to the plain textarea.
             * May be needed by some folks with funky browsers, or just to compare.
             */
            disableCodeEditor: function () {
                // Kills it!
                context.$textarea.closest('form')
                    .off('submit', context.evt.codeEditorSubmit)
                    .find('#wpSave').off('click', context.evt.codeEditorSave);

                // Save contents
                context.$textarea.textSelection('unregister');
                context.$textarea.val(textSelectionFn.getContents());

                // @todo fetch cursor, scroll position

                // Drop the fancy editor widget...
                context.fn.removeStatusBar();
                context.$codeEditorContainer.remove();
                context.$codeEditorContainer = undefined;
                context.codeEditor = undefined;

                // Restore textarea
                context.$textarea.show();
                // Restore toolbar
                $('.wikiEditor-ui-toolbar').removeClass('codeEditor-ui-toolbar');

                // @todo restore cursor, scroll position
            },

            /**
             * Start monitoring the fragment of the current window for hash change
             * events. If the hash is already set, handle it as a new event.
             */
            codeEditorMonitorFragment: function () {
                function onHashChange() {
                    var regexp = /#mw-ce-l(\d+)/;
                    var result = regexp.exec(window.location.hash);

                    if (result === null) {
                        return;
                    }

                    selectedLine = parseInt(result[1], 10);
                    if (context.codeEditor && selectedLine > 0) {
                        // Line numbers in CodeEditor are zero-based
                        context.codeEditor.navigateTo(selectedLine - 1, 0);
                        // Scroll up a bit to give some context
                        context.codeEditor.scrollToRow(selectedLine - 4);
                    }
                }

                onHashChange();
                $(window).on('hashchange', onHashChange);
            },
            /**
             * This creates a Statusbar, that allows you to see a count of the
             * errors, warnings and the warning of the current line, as well as
             * the position of the cursor.
             */
            setupStatusBar: function () {
                var shouldUpdateAnnotations,
                    shouldUpdateSelection,
                    shouldUpdateLineInfo,
                    nextAnnotation,
                    delayedUpdate,
                    editor = context.codeEditor,
                    lang = ace.require('ace/lib/lang'),
                    $errors = $('<span>').addClass('codeEditor-status-worker-cell ace_gutter-cell ace_error').text('0'),
                    $warnings = $('<span>').addClass('codeEditor-status-worker-cell ace_gutter-cell ace_warning').text('0'),
                    $infos = $('<span>').addClass('codeEditor-status-worker-cell ace_gutter-cell ace_info').text('0'),
                    $message = $('<div>').addClass('codeEditor-status-message'),
                    $lineAndMode = $('<div>').addClass('codeEditor-status-line'),
                    $workerStatus = $('<div>')
                        .addClass('codeEditor-status-worker')
                        .attr('title', mw.msg('codeeditor-next-annotation'))
                        .append($errors)
                        .append($warnings)
                        .append($infos);

                context.$statusBar = $('<div>')
                    .addClass('codeEditor-status')
                    .append($workerStatus)
                    .append($message)
                    .append($lineAndMode);

                /* Help function to concatenate strings with different separators */
                function addToStatus(status, str, separator) {
                    if (str) {
                        status.push(str, separator || '|');
                    }
                }

                /**
                 * Update all the information in the status bar
                 */
                function updateStatusBar() {
                    var errors = 0,
                        warnings = 0,
                        infos = 0,
                        distance,
                        shortestDistance = Infinity,
                        closestAnnotation,
                        currentLine = editor.selection.lead.row,
                        annotations = editor.getSession().getAnnotations(),
                        closestType;

                    // Reset the next annotation
                    nextAnnotation = null;

                    for (var i = 0; i < annotations.length; i++) {
                        var annotation = annotations[i];
                        distance = Math.abs(currentLine - annotation.row);

                        if (distance < shortestDistance) {
                            shortestDistance = distance;
                            closestAnnotation = annotation;
                        }
                        if (nextAnnotation === null && annotation.row > currentLine) {
                            nextAnnotation = annotation;
                        }

                        switch (annotations[i].type) {
                            case 'error':
                                errors++;
                                break;
                            case 'warning':
                                warnings++;
                                break;
                            case 'info':
                                infos++;
                                break;
                        }
                    }
                    // Wrap around to the beginning for nextAnnotation
                    if (nextAnnotation === null && annotations.length > 0) {
                        nextAnnotation = annotations[0];
                    }
                    // Update the annotation counts
                    if (shouldUpdateAnnotations) {
                        $errors.text(errors);
                        $warnings.text(warnings);
                        $infos.text(infos);
                    }

                    // Show the message of the current line, if we have not already done so
                    if (closestAnnotation &&
                        currentLine === closestAnnotation.row &&
                        closestAnnotation !== $message.data('annotation')) {
                        $message.data('annotation', closestAnnotation);
                        closestType =
                            closestAnnotation.type.charAt(0).toUpperCase() +
                            closestAnnotation.type.slice(1);

                        $message.text(closestType + ': ' + closestAnnotation.text);
                    } else if ($message.data('annotation') !== null &&
                        (!closestAnnotation || currentLine !== closestAnnotation.row)) {
                        // If we are on a different line without an annotation, then blank the message
                        $message.data('annotation', null);
                        $message.text('');
                    }

                    // The cursor position has changed
                    if (shouldUpdateSelection || shouldUpdateLineInfo) {
                        // Adapted from Ajax.org's ace/ext/statusbar module
                        var status = [];

                        if (editor.$vimModeHandler) {
                            addToStatus(status, editor.$vimModeHandler.getStatusText());
                        } else if (editor.commands.recording) {
                            addToStatus(status, 'REC');
                        }

                        var c = editor.selection.lead;
                        addToStatus(status, (c.row + 1) + ':' + c.column, '');
                        if (!editor.selection.isEmpty()) {
                            var r = editor.getSelectionRange();
                            addToStatus(status, '(' + (r.end.row - r.start.row) + ':' + (r.end.column - r.start.column) + ')');
                        }
                        status.pop();
                        $lineAndMode.text(status.join(''));
                    }

                    shouldUpdateLineInfo = shouldUpdateSelection = shouldUpdateAnnotations = false;
                }

                // Function to delay/debounce updates for the StatusBar
                delayedUpdate = lang.delayedCall(function () {
                    updateStatusBar(editor);
                });

                /**
                 * Click handler that allows you to skip to the next annotation
                 */
                $workerStatus.on('click', function (e) {
                    if (nextAnnotation) {
                        context.codeEditor.navigateTo(nextAnnotation.row, nextAnnotation.column);
                        // Scroll up a bit to give some context
                        context.codeEditor.scrollToRow(nextAnnotation.row - 3);
                        e.preventDefault();
                    }
                });

                editor.getSession().on('changeAnnotation', function () {
                    shouldUpdateAnnotations = true;
                    delayedUpdate.schedule(100);
                });
                editor.on('changeStatus', function () {
                    shouldUpdateLineInfo = true;
                    delayedUpdate.schedule(100);
                });
                editor.on('changeSelection', function () {
                    shouldUpdateSelection = true;
                    delayedUpdate.schedule(100);
                });

                // Force update
                shouldUpdateLineInfo = shouldUpdateSelection = shouldUpdateAnnotations = true;
                updateStatusBar(editor);

                context.$statusBar.insertAfter(context.$textarea);
            },
            removeStatusBar: function () {
                context.codeEditor.getSession().removeListener('changeAnnotation');
                context.codeEditor.removeListener('changeSelection');
                context.codeEditor.removeListener('changeStatus');
                context.nextAnnotation = null;
                context.$statusBar = null;

                $('.codeEditor-status').remove();
            }

        });

        /**
         * Override the base functions in a way that lets
         * us fall back to the originals when we turn off.
         *
         * @param {Object} base
         * @param {Object} extended
         */
        saveAndExtend = function (base, extended) {
            // eslint-disable-next-line no-jquery/no-map-util
            $.map(extended, function (func, name) {
                if (name in base) {
                    var orig = base[name];
                    base[name] = function () {
                        if (context.codeEditorActive) {
                            return func.apply(this, arguments);
                        }
                        if (orig) {
                            return orig.apply(this, arguments);
                        }
                        throw new Error('CodeEditor: no original function to call for ' + name);
                    };
                } else {
                    base[name] = func;
                }
            });
        };

        saveAndExtend(context.fn, {
            saveSelection: function () {
                mw.log('codeEditor stub function saveSelection called');
            },
            restoreSelection: function () {
                mw.log('codeEditor stub function restoreSelection called');
            },

            /**
             * Scroll an element to the top of the iframe
             */
            scrollToTop: function () {
                mw.log('codeEditor stub function scrollToTop called');
            }
        });

        context.codeEditorActive = true;
        context.fn.setupCodeEditor(lang);
        context.$codeEditorContainer.insertAfter(context.$textarea);
        context.$textarea.data('ace-context', context);
    }

    function addWikiEditorInstanceCodeMirror6() {
        const $textarea = $('<textarea>');
        mw.loader.using([
            'ext.wikiEditor',
            'ext.CodeMirror.v6.WikiEditor',
            'ext.CodeMirror.v6.mode.mediawiki'
        ]).then((require) => {
            mw.addWikiEditor($textarea);
            const CodeMirrorWikiEditor = require('ext.CodeMirror.v6.WikiEditor');
            const mediawikiLang = require('ext.CodeMirror.v6.mode.mediawiki');
            const cmWe = new CodeMirrorWikiEditor($textarea, mediawikiLang());
            cmWe.initialize();
        });
    }

    function editPageSection(title, sectionId, text, editSummary) {
        var params = {
            action: "edit",
            title: title,
            section: sectionId,
            text: text,
            summary: editSummary,
        }
        // if (sectionId !== undefined && sectionId !== null) {
        //     params.section = sectionId;
        // }
        // if (editSummary !== undefined && editSummary !== null) {
        //     params.summary = editSummary;
        // }
        return api.postWithEditToken(params);
    }

    function getPageWikitext(title) {
        return getPageSectionWikitext(title, null);
    }

    function getPageSectionWikitext(title, sectionId) {
        var params = {
            action: "query",
            prop: "revisions",
            rvprop: "timestamp|content|size",
            rvslots: "*",
            rvlimit: "1",
            titles: title,
            format: "json",
            formatversion: "2",
        };
        if (sectionId !== undefined && sectionId !== null) {
            params.rvsection = sectionId;
        }
        return api.get(params).then(result => {
            if (!(result && result.query && result.query.pages && result.query.pages[0])) {
                throw new Error("Failed to get page revisions for page: " + title);
            }
            const resultPages = result.query.pages[0];
            return resultPages;
        });
    }

    function getPreview(text, contentmodel, includeWarnings, includeLimits) {
        let props = ["wikitext", "text"];
        if (includeWarnings) {
            props.push("parsewarnings", "parsewarininghtml");
        }
        if (includeLimits) {
            props.push("limitreportdata", "limitreporthtml");
        }
        let params = {
            action: "parse",
            text: text,
            contentmodel: contentmodel,
            prop: props.join('|'),
            format: "json",
            formatversion: "2",
        }
        return api.get(params).then(result => {
            if (!(result && result.parse)) {
                throw new Error("Failed to parse wikitext: " + text);
            }
            const resultText = result.parse;
            return resultText;
        });
    }

    function getDiffSectionText(title, section, text) {
        let params = {
            action: "compare",
            fromtitle: title,
            totitle: title,
            "toslots": "main",
            "totext-main": text,
            prop: "diff|title|size",
        }
        if (section) {
            params["tosection-main"] = section;
        }
        return api.get(params).then(result => {
            if (!(result && result.compare)) {
                throw new Error("Failed to compare revisions: " + title + section ? " " + section : "");
            }
            return result.compare;
        });
    }

    function getDiffTextText(originalText, text, contentmodel) {
        let params = {
            action: "compare",
            fromslots: "main",
            "fromtext-main": originalText,
            "fromcontentmodel-main": contentmodel,
            toslots: "main",
            "totext-main": text,
            "tocontentmodel-main": contentmodel,
            prop: "diff|title|size",
        }
        return api.get(params).then(result => {
            console.log(result);
        });
    }

    /**
     * 
     * @param {*} title 
     * @returns promise of array of sections as a result of an mw.api query
     */
    function getSections(title) {
        let params = {
            action: "parse",
            page: title,
            prop: "sections",
            format: "json",
            formatversion: "2",
        }
        return api.get(params).then(response => {
            if (!(response && response.parse && response.parse.sections)) {
                throw new Error("Failed to get sections: " + title);
            }
            const result = response.parse.sections;
            return result;
        });
    }

    /**
     * 
     * @param {*} title 
     * @param {*} sectionHeaderId from .mw-headline elements' id attribute
     * @returns promise of section id (string) or null if not found
     */
    function getSectionIdFromSectionHeaderId(title, sectionHeaderId) {
        if (!title || !sectionHeaderId) { return null; }
        return getSections(title).then(sections => {
            for (let section of sections) {
                if (section.anchor === sectionHeaderId) {
                    return section.index;
                }
            }
            return null;
        });
    }

    function getEditorType(editorType, contentType) {
        if (editorType) {
            switch (editorType.toLowerCase()) {
                case 'cm':
                case 'code-mirror':
                    return 'cm';
                case 'ace':
                case 'ace-editor':
                    return 'ace';
                case 'text':
                case 'plaintext':
                    return 'text';
            }
        }
        if (contentType) {
            switch (contentType.toLowerCase()) {
                case 'javascript':
                case 'js':
                case 'css':
                case 'json':
                case 'scribunto':
                case 'lua':
                case 'code':
                    return 'ace';
                case 'plaintext':
                case 'text':
                    return 'text';
                case 'wikitext':
                default:
                    return 'cm';
            }
        } else {
            return 'cm';
        }
    }

    function getContentType(contentType) {
        if (contentType) {
            switch (contentType.toLowerCase()) {
                case 'javascript':
                case 'js':
                    return 'javascript';
                case 'css':
                    return 'css';
                case 'json':
                    return 'json';
                case 'scribunto':
                case 'lua':
                    return 'lua';
                case 'wikitext':
                    return 'wikitext';
                case 'text':
                case 'plaintext':
                    return 'text';
                default:
                    return contentType.toLowerCase();
            }
        } else {
            return 'wikitext';
        }

    }

    function toAceEditorLang(contentType) {
        switch (contentType) {
            case 'javascript':
            case 'css':
            case 'json':
            case 'lua':
            case 'text':
                return contentType;
            default:
                return 'text';
        }
    }
    function toCmEditorMode(contentType) {
        switch (contentType) {
            case 'wikitext':
                return 'text/mediawiki';
            case 'javascript':
            case 'css':
            case 'php':
            case 'htmlmixed':
            case 'xml':
            case 'clike':
                return 'text/' + contentType;
            default:
                return 'text/plain';
        }
    }
    function toPreviewContentModel(contentType) {
        switch (contentType) {
            case 'gadgetdefinition':
                return 'GadgetDefinition';
            case 'geojson':
                return 'GeoJSON';
            case 'lua':
                return 'Scribunto';
            case 'css':
                return 'css';
            case 'interactivemap':
                return 'interactivemap';
            case 'javascript':
                return 'javascript';
            case 'json':
                return 'json';
            case 'sanitized-css':
                return 'sanitized-css';
            case 'wikitext':
                return 'wikitext';
            case 'text':
                return 'text';
            default:
                return 'unknown';
        }
    }

    function loadConfiguredEditors() {
        var $editors = $(".drop-in-editor").not(".die-loaded");
        $editors.each((index, editorElement) => {
            let $editor = $(editorElement);
            var contentType = $editor.data("content-type");
            var editorType = $editor.data("editor-type");
            var pageTitle = $editor.data("page");
            var sectionHeaderId = $editor.data("section");

            if (sectionHeaderId !== undefined && sectionHeaderId !== null) {
                sectionHeaderId = sectionHeaderId.replaceAll(' ', '_');
            } else {
                sectionHeaderId = null;
            }
            // new text area
            var editorType = getEditorType(editorType, contentType);
            var contentType = getContentType(contentType);
            let page;
            let sectionId = null;
            if (sectionHeaderId) {
                page = getSectionIdFromSectionHeaderId(pageTitle, sectionHeaderId)
                    .then(sectionIdValue => {
                        sectionId = sectionIdValue;
                        return getPageSectionWikitext(pageTitle, sectionIdValue)
                    })
            } else {
                page = getPageWikitext(pageTitle);
            }
            page.then(page => {
                if (!(page && page.revisions && page.revisions[0] && page.revisions[0].slots && page.revisions[0].slots.main && page.revisions[0].slots.main.content)) {
                    throw new Error("Failed to get page revisions for page: " + title + " section " + sectionId + ": " + sectionHeaderId);
                }
                return page.revisions[0].slots.main.content;
            }).then(pageContents => {
                let $previewElement = addPreviewSection($editor);
                let $textarea = addTextArea($editor, pageContents);
                let $actionBar;
                let $editorGroup = $editor.closest(".drop-in-editor-group");
                if ($editorGroup.length !== 0) {
                    if ($editorGroup.get(0).$actionBar === undefined) {
                        $editorGroup.get(0).$actionBar = addActionBar($editorGroup);
                    }
                    $actionBar = $editorGroup.get(0).$actionBar
                } else {
                    $actionBar = addActionBar($editor);
                }
                if (editorType === 'ace') {
                    let aceEditorInstance = addAceEditorInstance($textarea, toAceEditorLang(contentType));
                    // ace config
                } else if (editorType === 'cm') {
                    let cm = addCodeMirrorInstance($textarea, toCmEditorMode(contentType));
                    // cm config
                } else {
                    // textarea config
                }

                $actionBar.saveButton.addOnClickAction(() => {
                    var text = $textarea.textSelection('getContents');
                    editPageSection(pageTitle, sectionId, text, null).then(editResult => {
                        console.log(editResult);
                    }).catch(console.error);
                });
                $actionBar.previewButton.addOnClickAction(() => {
                    var text = $textarea.textSelection('getContents');
                    getPreview(text, toPreviewContentModel(contentType), true, true).then(previewResult => {
                        // console.log(previewResult);
                        $previewElement.html(previewResult.text);
                    }).catch(console.error);
                });
                $actionBar.diffButton.addOnClickAction(() => {
                    var text = $textarea.textSelection('getContents');
                    getDiffSectionText(pageTitle, sectionId, text).then(diffResult => {
                        console.log(diffResult)
                        let diffHtml = diffResult["*"];
                        if (!diffHtml) {
                            diffHtml = '<tr><td colspan="4" style="text-align:center;">(No changes)</td></tr>';
                        } else {
                            diffHtml = '<tr><th colspan="2">Old revision</td><th colspan="2">New revision</td></tr>' + diffHtml;
                        }
                        const diffTableHtml = '<table class="diff">' +
                            '<colgroup>' +
                            '<col class="diff-marker">' +
                            '<col class="diff-content">' +
                            '<col class="diff-marker">' +
                            '<col class="diff-content">' +
                            '</colgroup>' +
                            '<tbody>' +
                            diffHtml +
                            '</tbody>' +
                            '</table>';
                        mw.loader.using('mediawiki.diff.styles').then(() => {
                            $previewElement.html(diffTableHtml);
                        });
                    }).catch(console.error);
                });
                $actionBar.cancelButton.addOnClickAction(() => {
                    $textarea.textSelection('setContents', pageContents);
                    $previewElement.html('');
                });
            }).catch(error => console.error(error));
        });
    }

    function addTextArea($wrapper, contentText) {
        const $textarea = $('<textarea>');
        $textarea.val(contentText);
        // textarea must be attached to dom so its height can be calculated before its height can be used to set the ace editor initial height
        $wrapper.append($textarea);
        return $textarea;
    }
    function loadInlineSectionEditors() {
        var $headers = $(".mw-headline");
        var $editLinks = $headers.parent().closest(".mw-editsection");
        $headers.each((index, $header) => {
            var sectionHeaderId = $header.attr("id");
        })
    }

    // name ideas? droplet editor? embedded section editor (used by Mikevoir)? drop-in-editor (die)
    $.when(mw.loader.using(['mediawiki.api', 'mediawiki.util', ...aceEditorDependencies, ...codeMirrorDependencies]), $.ready).then(() => {
        mw.hook('wikipage.content').add(($content) => {
            api = new mw.Api();
            if (isMultiEditorPage()) {
                loadMultiEditorPage($content);
            }
            loadConfiguredEditors();
        })
    })
})(this, jQuery, mediaWiki);