(function (window, $, mw) {
    'use strict';
    if (window.gadgetNavLinks) return;
    window.gadgetNavLinks = true;

    var config = mw.config.get([
        'wgFormattedNamespaces',
        'wgPageName',
    ]);

    function gadgetLink(name) {
        var link = document.createElement('a');
        link.append(name);
        link.href = mw.util.getUrl(config.wgFormattedNamespaces[8] + ':Gadget-' + name, { action: 'edit' });
        return link;
    }

    function generateNavLinks() {
        var gadgetDefinitions = document.querySelectorAll('#bodyContent ul:not(#toc ul) > li:not(.navlink-loaded)');
        for (var gadgetDefinition of gadgetDefinitions) {
            if (gadgetDefinition.textContent) {
                // maps[ResourceLoader|type=general|default]|maps.js
                const match = gadgetDefinition.textContent.replaceAll(' ', '').match(/^([A-Za-z][A-Za-z0-9-_.]*)(\[.*?\])\|(.*?)$/);
                if (!match) {
                    continue;
                }
                gadgetDefinition.textContent = '';
                const [fullMatch, gadgetName, gadgetConfig, gadgetResources] = match;
                gadgetDefinition.append(gadgetLink(gadgetName), gadgetConfig);
                gadgetResources.split('|')
                    .filter(resource => resource.length > 0)
                    .forEach(resource => gadgetDefinition.append('|', gadgetLink(resource)));
            }
            gadgetDefinition.classList.add('navlink-loaded');
        }
    }

    if (config.wgPageName === config.wgFormattedNamespaces[8] + ":Gadgets-definition") {
        mw.hook('wikipage.content').add(function ($content) {
            mw.loader.using(['mediawiki.util']).then(generateNavLinks);
        });
    }
})(this, jQuery, mediaWiki);