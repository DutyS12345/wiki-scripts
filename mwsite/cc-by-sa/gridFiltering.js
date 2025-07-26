// Adapted from Grid Filtering by Karol Dylewski aka "Nanaki".
// https://wiki.leagueoflegends.com/en-us/MediaWiki:Gadget-gridfiltering.js
/* License:    CC-BY-SA 3.0 */

window.gridConfigs = [
    { // LoL Champion Grid @ Template:Champion_roster
        containerClass: 'champion-roster',
        elementClass: 'champion-icon',
        filters: {
            'search': 'search',
            /*'game': ['- Game -',
                ['LOL','League of Legends'],
                ['TFT','Teamfight Tactics'],
                ['TFT1','• Set 1 - Faction Wars'],
                ['TFT2','• Set 2 - Rise of the Elements'],
                ['TFT3','• Set 3 - Galaxies'],
                ['TFT3.5','• Set 3.5 - Galaxies II'],
                ['TFT4','• Set 4 - Fates'],
                ['LOR','Legends of Runeterra'],
                ['WR','Wild Rift']
            ],*/
            'role': ['- Class -',
                ['Controller', 'Controller'],
                ['Catcher', '• Catcher'],
                ['Enchanter', '• Enchanter'],
                ['Fighter', 'Fighter'],
                ['Diver', '• Diver'],
                ['Juggernaut', '• Juggernaut'],
                ['Mage', 'Mage'],
                ['Artillery', '• Artillery'],
                ['Battlemage', '• Battlemage'],
                ['Burst', '• Burst'],
                ['Marksman', 'Marksman'],
                ['Slayer', 'Slayer'],
                ['Assassin', '• Assassin'],
                ['Skirmisher', '• Skirmisher'],
                ['Specialist', 'Specialist'],
                ['Tank', 'Tank'],
                ['Vanguard', '• Vanguard'],
                ['Warden', '• Warden']
            ],
            'type': ['- Range type -',
                ['Melee', 'Melee'],
                ['Ranged', 'Ranged']
            ],
            'position': ['- Position -',
                ['Top', 'Top'],
                ['Jungle', 'Jungle'],
                ['Middle', 'Middle'],
                ['Bottom', 'Bottom'],
                ['Support', 'Support']
            ],
            'diff': ['- Difficulty -',
                ['1', 'Easy'],
                ['2', 'Medium'],
                ['3', 'Hard']
            ]
        }
    },
    { // LoL Items @ Template:Items/List
        containerClass: 'item-grid',
        elementClass: 'item-icon',
        filters: {
            'search': 'search',
            'modes': ['- Game Modes - ',
                ['classic sr 5v5', 'Classic SR 5v5'],
                ['aram', 'ARAM'],
                ['arena', 'Arena'],
                ['FGM', 'FGM']
            ],
            'class': ['- Class - ',
                ['fighter', 'Fighter'],
                ['mage', 'Mage'],
                ['marksman', '• Marksman'],
                ['support', 'Support'],
                ['tank', 'Tank']
            ]
        }
    },
    { // WR Items @ Template:Items/WR_list
        containerClass: 'writem-grid',
        elementClass: 'item-icon',
        filters: {
            'search': 'search',
            'modes': ['- Game Modes - ',
                ['classic sr 5v5', '• Classic SR 5v5'],
                ['aram', '• ARAM'],
                ['duel', '• Duel'],
                ['FGM', '• FGM']
            ]
        }
    },
    { // Summoner Icons @ Template:Summoner_icons
        containerClass: 'avatar-grid',
        elementClass: 'avatar-icon',
        filters: {
            'search': 'search',
            'availability': ['- Availability -',
                ['Available', '• Available'],
                ['Legacy', '• Legacy'],
                ['Unavailable', '• Unavailable'],
                ['Temporary', '• Temporary'],
                ['Unlocked', '• Account Creation'],
                ['Unreleased', '• Unreleased']
            ],
            'source': ['- Source -',
                ['Store', '• Client Store'],
                ['Riot', '• Riot Distribution'],
                ['Missions', '• Missions'],
                ['Bundle', '• Bundles'],
                ['Code', '• Code Redemption'],
                ['Account Creation', '• Account Creation'],
                ['Merch Store', '• Merch Store']
            ],
            'release': ['- Year -',
                ['2021release', '• 2021'],
                ['2020release', '• 2020'],
                ['2019release', '• 2019'],
                ['2018release', '• 2018'],
                ['2017release', '• 2017'],
                ['2016release', '• 2016'],
                ['2015release', '• 2015'],
                ['2014release', '• 2014'],
                ['2013release', '• 2013'],
                ['2012release', '• 2012'],
                ['2011release', '• 2011'],
                ['2010release', '• 2010'],
                ['2009release', '• 2009']
            ]
        }
    },
    { // Esports Summoner Icons @ Summoner_icon
        containerClass: 'esports-grid',
        elementClass: 'esports-icon',
        filters: {
            'search': 'search',
            'region': ['- Region -',
                ['INT', 'International Team'],
                ['NA', 'North America'],
                ['US', '• North America'],
                ['EU', 'Europe'],
                ['DK', '• Denmark'],
                ['DE', '• Germany'],
                ['FR', '• France'],
                ['LT', '• Lithuania'],
                ['ES', '• Spain'],
                ['SW', '• Sweden'],
                ['UA', '• Ukraine'],
                ['UK', '• United Kingdom'],
                ['BR', 'Brazil'],
                ['CN', 'China'],
                ['KR', 'South Korea'],
                ['LAN', 'Latin American North'],
                ['CO', '• Colombia'],
                ['CR', '• Costa Rica'],
                ['MX', '• Mexico'],
                ['PE', '• Peru'],
                ['LAS', 'Latin America South'],
                ['AR', '• Argentina'],
                ['CL', '• Chile'],
                ['OCE', 'Oceania'],
                ['AU', '• Australia'],
                ['JP', 'Japan'],
                ['RU', 'Russia'],
                ['SEA', 'South East Asia'],
                ['ID', '• Indonesia'],
                ['HK', '• Hong Kong'],
                ['MY', '• Malaysia'],
                ['PH', '• Philippines'],
                ['SG', '• Singapore'],
                ['TH', '• Thailand'],
                ['TW', '• Taiwan'],
                ['VN', '• Vietnam'],
                ['TR', 'Turkey']
            ],
            'tournament': ['- Tournament -',
                ['International', 'International'],
                ['MSI', '• Mid-Season Invitational'],
                ['Worlds', '• World Championship'],
                ['All-Star', '• All-Stars'],
                ['Rift Rivals', '• Rift Rivals'],
                ['Regional', 'Regional'],
                ['NALCS', '• NA Championship Series'],
                ['EULCS', '• EU Championship Series'],
                ['CBLOL', '• CBLoL - Campeonato Brasileiro'],
                ['CLS', '• CLS - Copa Latinoamérica Sur'],
                ['CNC', '• CNC - Circuito Nacional Chile'],
                ['GPL', '• GPL - Garena Premier League'],
                ['LAN', '• LAN - Latin America Cup'],
                ['LCK', '• LCK - Champions Korea'],
                ['LCL', '• LCL - Continental League (RU)'],
                ['LJL', '• LJL - Japan League'],
                ['LMS', '• LMS - Master Series (SEA)'],
                ['LPL', '• LPL - Pro League (China)'],
                ['LLN', '• LLN - Liga Latinoamérica Norte'],
                ['OPL', '• OPL - Oceanic Pro League'],
                ['TCL', '• TCL - Turkey Champions League'],
                ['VCS', '• VCS - Vietnam Championship Series'],
                ['Special', 'Special'],
                ['OGN', '• OGN Invitational (KR)'],
                ['SLTV', '• SLTV Star Series (RU)'],
            ]
        }
    },
    { // WR champion grid @ Template:Champion roster/WR
        containerClass: 'wr-champion-grid',
        elementClass: 'champion-icon',
        filters: {
            'search': 'search',
            /*'game': ['- Game -',
                ['LOL','League of Legends'],
                ['TFT','Teamfight Tactics'],
                ['TFT1','• Set 1 - Faction Wars'],
                ['TFT2','• Set 2 - Rise of the Elements'],
                ['TFT3','• Set 3 - Galaxies'],
                ['TFT3.5','• Set 3.5 - Galaxies II'],
                ['TFT4','• Set 4 - Fates'],
                ['LOR','Legends of Runeterra'],
                ['WR','Wild Rift']
            ],*/
            'role': ['- Class -',
                ['Assassin', 'Assassin'],
                ['Fighter', 'Fighter'],
                ['Mage', 'Mage'],
                ['Marksman', 'Marksman'],
                ['Support', 'Support'],
                ['Tank', 'Tank']
            ],
            'type': ['- Range type -',
                ['Melee', 'Melee'],
                ['Ranged', 'Ranged']
            ],
            'position': ['- Position -',
                ['Top', 'Top'],
                ['Jungle', 'Jungle'],
                ['Middle', 'Middle'],
                ['Bottom', 'Bottom'],
                ['Support', 'Support']
            ]
        }
    },
    { // PoC champion filters @ Template:PoC_Champion_Roster
        containerClass: 'poc-champion-grid',
        elementClass: 'poc-roster-champion',
        filters: {
            'search': 'search	',
            'playstyle': ['- Playstyle -',
                ['Aggressive', 'Aggressive'],
                ['Balanced', 'Balanced'],
                ['Combo', 'Combo'],
                ['Defensive', 'Defensive'],
                ['Unique', 'Unique']
            ],
            'difficulty': ['- Difficulty -',
                ['Easy', 'Easy'],
                ['Medium', 'Medium'],
                ['Hard', 'Hard']
            ],
            'region': ['- Region -',
                ['Bandle City', 'Bandle City'],
                ['Bilgewater', 'Bilgewater'],
                ['Demacia', 'Demacia'],
                ['Freljord', 'Freljord'],
                ['Ionia', 'Ionia'],
                ['Noxus', 'Noxus'],
                ['Piltover & Zaun', 'Piltover & Zaun'],
                ['Shadow Isles', 'Shadow Isles'],
                ['Shurima', 'Shurima'],
                ['Targon', 'Targon'],
                ['Runeterra', 'Runeterra']
            ],
            'constellation': ['- Constellation -',
                ['hasConstellation', 'All'],
                ['constellation-none', 'None'],
                ['Bandle City', 'Bandle City'],
                ['Bilgewater', 'Bilgewater'],
                ['Demacia', 'Demacia'],
                ['Freljord', 'Freljord'],
                ['Ionia', 'Ionia'],
                ['Noxus', 'Noxus'],
                ['Piltover & Zaun', 'Piltover & Zaun'],
                ['Shadow Isles', 'Shadow Isles'],
                ['Shurima', 'Shurima'],
                ['Targon', 'Targon'],
                ['Runeterra', 'Runeterra']
            ]
        }
    }
];

(function ($) {
    function gridFiltering() {
        for (const gridConfig of gridConfigs) {
            const containers = $(".grid-filtering__" + gridConfig.containerClass).not(".grid-filtering-loaded");
            containers.each((index, container) => {
                const $container = $(container);
                initGridFilter($container, gridConfig);
            });
        }
    }

    function initGridFilter($container, gridConfig) {
        $container.gridElements = [];
        $container.gridFilterSwitches = [];

        // init grid elements
        $container.find('.' + gridConfig.elementClass).each((index, element) => {
            const $element = $(element);
            const filters = gridConfig.filters;
            const gridElements = $container.gridElements;
            let obj = { '*': $element };
            for (const filterId in filters) {
                const val = $element.data(filterId);
                if (!val) {
                    obj[filterId] = [];
                } else {
                    obj[filterId] = val.split(',').map(term => term.trim().toLowerCase());
                }
            }
            gridElements.push(obj);
        });

        // init grid filters
        $container.find('.grid-filter').each((index, filterSwitch) => {
            const $filterSwitchElement = $(filterSwitch);
            const filterId = $filterSwitchElement.data('gridFilterId');
            const filters = gridConfig.filters;
            const gridFilterElements = $container.gridElements;
            const gridFilterSwitches = $container.gridFilterSwitches;
            if (!filterId || !(filterId in filters)) { return; }
            const filterConfig = filters[filterId];
            let obj = {
                filterId: filterId,
            };

            if (filterConfig === 'search') {
                const field = $('<input type="text" placeholder="Search..." />')
                    .appendTo($filterSwitchElement)
                    .addClass($filterSwitchElement.attr('id') + '-field')
                    .data('type', 'search');

                field.keyup(function () {
                    gridFilteringApply(gridFilterElements, gridFilterSwitches);
                });

                obj.type = 'search';
                obj['*'] = field;

                gridFilterSwitches.push(obj);
            } else if (filterConfig instanceof Array) {
                var field = $('<select></select>')
                    .appendTo($filterSwitchElement)
                    .addClass($filterSwitchElement.attr('id') + '-field')
                    .data('type', 'select');

                field.append($('<option></option>')
                    .attr('value', '')
                    .html(filterConfig[0])
                );
                for (var y = 1; y < filterConfig.length; y++) {
                    field.append($('<option></option>')
                        .attr('value', filterConfig[y][0])
                        .html(filterConfig[y][1])
                    );
                }
                field.val('');

                field.change(function () {
                    gridFilteringApply(gridFilterElements, gridFilterSwitches);
                });

                obj.type = 'select';
                obj['*'] = field;

                gridFilterSwitches.push(obj);
            }
        });

        $container.addClass('grid-filtering-loaded');
    }


    function gridFilteringApply(gridElements, gridFilterSwitches) {
        for (const gridElement of gridElements) {
            const $element = $(gridElement['*']);
            let active = true;
            for (const filterSwitch of gridFilterSwitches) {
                let val = filterSwitch['*'].val();
                if (!val) continue;
                val = val.toLowerCase();

                if (filterSwitch.type === 'search') {
                    var regexp = new RegExp('^.*?(' + val.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + ').*?$', 'i');
                    if (gridElement[filterSwitch.filterId].join(', ').search(regexp) < 0) {
                        active = false;
                    }
                } else if (filterSwitch.type === 'select') {
                    if (gridElement[filterSwitch.filterId].indexOf(val) < 0) {
                        active = false;
                    }
                }
            }

            if (active) {
                gridFilteringShow($element);
            } else {
                gridFilteringHide($element);
            }
        }
    }

    function gridFilteringHide(elem) {
        $(elem).stop(true);
        $(elem).fadeTo(200, 0.1);
    }

    function gridFilteringShow(elem) {
        $(elem).stop(true);
        $(elem).fadeTo(200, 1);
    }

    $(gridFiltering);
})(jQuery);
