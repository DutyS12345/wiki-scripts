// <pre>
(function (window, $, mw) {
    if (window.gadgetNavLinks) return;
    window.gadgetNavLinks = true;

    var config = mw.config.get([
        'wgFormattedNamespaces',
        'wgPageName',
    ]);

    function generateNavLinks() {
        var gadgetDefinitions = document.querySelectorAll('#mw-content-text li:not(.navlink-loaded)');
        console.log(gadgetDefinitions);
        for (var gadgetDefinition of gadgetDefinitions) {
            console.log('raw ' + gadgetDefinition.textContent);
            if (gadgetDefinition.textContent) {
                // maps[ResourceLoader|type=general|default]|maps.js
                var match = gadgetDefinition.textContent.match(/^(\s*)(.+)(\[.*?\])\|(.*?)$/);

                gadgetDefinition.textContent = '';
                console.log(match);
                var space = match[1];
                gadgetDefinition.appendChild(document.createTextNode(space));
                var gadgetName = match[2];
                var gadgetPageUrl = mw.util.getUrl('MediaWiki:Gadget-' + gadgetName, { action: 'edit' });
                var gadgetNameLink = document.createElement('a');
                gadgetNameLink.appendChild(document.createTextNode(gadgetName));
                gadgetNameLink.href = gadgetPageUrl;
                gadgetDefinition.appendChild(gadgetNameLink);
                var gadgetConfig = match[3];
                gadgetDefinition.appendChild(document.createTextNode(gadgetConfig));
                var gadgetResources = match[4].split('|');
                for (var gadgetResource of gadgetResources) {
                    if (gadgetResource.length > 0) {
                        var gadgetResourceUrl = mw.util.getUrl('MediaWiki:Gadget-' + gadgetResource, { action: 'edit' });
                        var gadgetResourceLink = document.createElement('a');
                        gadgetResourceLink.appendChild(document.createTextNode(gadgetResource));
                        gadgetResourceLink.href = gadgetResourceUrl;
                        gadgetDefinition.appendChild(document.createTextNode('|'));
                        gadgetDefinition.appendChild(gadgetResourceLink);
                    }
                }
                gadgetDefinition.classList.add('navlink-loaded');
            }
        }
    }

    if (config.wgPageName === config.wgFormattedNamespaces[8] + ":Gadgets-definition") {
        mw.hook('wikipage.content').add(function ($content) {
            mw.loader.using(['mediawiki.util']).then(generateNavLinks);
        });
    }
})(this, jQuery, mediaWiki);
// </pre>