Settings = function(){
	var tp;

	var tabLinks = {
		BASIC_SERVER_SETTINGS: 'settings/server/basic.html',
		BEHAVIOR_SETTINGS: 'settings/server/behavior.html',
		ITUNES: 'plugins/iTunes/settings/itunes.html',
		PLUGIN_PODCAST: 'plugins/Podcast/settings/basic.html',
		SQUEEZENETWORK_SETTINGS: 'settings/server/squeezenetwork.html',
		INTERFACE_SETTINGS: 'settings/server/interface.html',
		SETUP_GROUP_PLUGINS: 'settings/server/plugins.html',
		advanced: 'settings/index.html?sub=advanced',
		player: 'settings/index.html?sub=player&playerid=' + player,
		SERVER_STATUS: 'settings/server/status.html'
	};

	return {
		init : function(){
			var layout = new Ext.BorderLayout(document.body, {
				north: {
					split:false,
					initialSize: 80
				},
				south: {
					split:false,
					initialSize: 65
				},
				center: {
					autoScroll: false
				}
			});

			layout.beginUpdate();
			layout.add('north', new Ext.ContentPanel('header', {fitToFrame:true, fitContainer:true}));
			layout.add('south', new Ext.ContentPanel('footer', {fitToFrame:true, fitContainer:true}));
			layout.add('center', new Ext.ContentPanel('main', {fitToFrame:true, fitContainer:true}));

			Ext.EventManager.onWindowResize(this.onResize, layout);
			Ext.EventManager.onDocumentReady(this.onResize, layout, true);

			layout.endUpdate();

			Ext.QuickTips.init();

			tp = new Ext.TabPanel('settingsTabs');

			tp.addTab('BASIC_SERVER_SETTINGS', strings['basic']).on('activate', Settings.showSettingsPage);
			tp.addTab('BEHAVIOR_SETTINGS', strings['mymusic']).on('activate', Settings.showSettingsPage);

			if (iTunesEnabled)
				tp.addTab('ITUNES', strings['itunes']).on('activate', Settings.showSettingsPage);

			if (podcastEnabled)
				tp.addTab('PLUGIN_PODCAST', strings['podcasts']).on('activate', Settings.showSettingsPage);

			tp.addTab('SQUEEZENETWORK_SETTINGS', strings['squeezenetwork']).on('activate', Settings.showSettingsPage);
			tp.addTab('INTERFACE_SETTINGS', strings['interface']).on('activate', Settings.showSettingsPage);
			tp.addTab('SETUP_GROUP_PLUGINS', strings['plugins']).on('activate', Settings.showSettingsPage);
			tp.addTab('advanced', strings['advanced']).on('activate', Settings.showSettingsPage);
			tp.addTab('player', strings['player']).on('activate', Settings.showSettingsPage);
			tp.addTab('SERVER_STATUS', strings['status']).on('activate', Settings.showSettingsPage);

			tp.activate('BASIC_SERVER_SETTINGS');

			new Ext.Button('cancel', {
				text: strings['close'],
				handler: function(){
					window.open('javascript:window.close();','_self','');
				}
			});

			new Ext.Button('save', {
				text: strings['save'],
				handler: this.submitSettings,
				scope: this
			});

			this.onResize();
		},

		submitSettings : function() {
			var myForm;
			try { myForm = frames.settings.subSettings.document.forms.settingsForm; }
			catch(e){
				try { myForm = frames.settings.document.forms.settingsForm; }
				catch(e){}
			}

			if (myForm) {
				myForm.submit();
			}
		},

		showSettingsPage : function(page) {
			if (page && tabLinks[page])
				page = tabLinks[page];
			else if (typeof page == 'object' && page.el != null)
				page = tabLinks[this.id];

			Ext.get('settings').dom.src = webroot + page + (page.search(/\?/) >= 0 ? '&' : '?') + 'player=' + player;
		},

		// resize panels, folder selectors etc.
		onResize : function(){
			var main = Ext.get('main');
			var settings = Ext.get('settings');

			var dimensions = new Array();
			dimensions['maxHeight'] = main.getHeight();
			dimensions['maxWidth'] = main.getWidth() - 10;

			settings.setHeight(dimensions['maxHeight']);
			settings.setWidth(dimensions['maxWidth'] - 20);
			main.setWidth(dimensions['maxWidth']);
		},

		activateTab : function(tab){
			tp.activate(tab);
		},

		showPlayerSetting : function(tab, page) {
			if (tabLinks[page])
				tp.activate(page);
			else {
				var oldUrl = tabLinks[tab];
				tabLinks[tab] = oldUrl + '&subPage=' + page;
				tp.activate(tab);
				tabLinks[tab] = oldUrl;
			}			
		}
	};
}();


var SettingsPage = function(){
	var unHighlightTimer;

	return {
		init : function(){
			this.initDescPopup();
			FilesystemBrowser.init();

			if (Ext.isSafari)
				Ext.get(document).setStyle('overflow', 'auto');
		},

		initDescPopup : function(){
			var section, descEl, desc, helpEl, title;

			var tpl = new Ext.Template('<img src="' + webroot + 'html/images/search.gif" class="prefHelp">');
			tpl.compile();

			Ext.QuickTips.init();

			var items = Ext.query('div.hiddenDesc');
			for(var i = 0; i < items.length; i++) {
				descEl = Ext.get(items[i]);

				if (descEl)
					section = descEl.up('div.settingGroup', 1) || Ext.get(items[i]).up('div.settingSection', 1);
				else
					continue;

				title = section.child('div.prefHead');
				if (title)
					title = title.dom.innerHTML;

				if (section && (desc = descEl.dom.innerHTML)) {
					if (desc.length > 100) {
						helpEl = tpl.insertAfter(descEl);
						Ext.QuickTips.register({
							target: helpEl,
							text: desc,
							title: title,
							maxWidth: 600,
							autoHide: false
						});
					}
					else {
						descEl.removeClass('hiddenDesc');
					}
				}
			}
		},

		// remove sticky highlight from previously selected item
		onClicked : function(target){
			var el = Ext.get(target);
			if (el && el.hasClass('mouseOver')) {
				if (el = Ext.get(Ext.DomQuery.selectNode('div.selectedItem')))
					el.removeClass('selectedItem');
	
				if (el = Ext.get(target.id))
					el.addClass('selectedItem');
			}
		},

		highlight : function(target){
			if (Utils) {
				if (unHighlightTimer == null)
					unHighlightTimer = new Ext.util.DelayedTask(Utils.unHighlight);
					
				Utils.highlight(target);
				unHighlightTimer.delay(1000);	// remove highlighter after x seconds of inactivity
			}
		},

		initPlayerList : function(){
			var playerChooser = new Ext.SplitButton('playerSelector', {
				handler: function(ev){
					if(this.menu && !this.menu.isVisible()){
						this.menu.show(this.el, this.menuAlign);
					}
					this.fireEvent('arrowclick', this, ev);
				},
				menu: new Ext.menu.Menu({shadow: Ext.isGecko && Ext.isMac ? true : 'sides'}),
				tooltip: strings['choose_player'],
				arrowTooltip: strings['choose_player'],
				tooltipType: 'title'
			});

			for (x=0; x<playerList.length; x++){
				if (playerList[x].id == playerid || playerList[x].id == player) {
					playerChooser.setText(playerList[x].name);
				}

				playerChooser.menu.add(
					new Ext.menu.Item({
						text: playerList[x].name,
						value: playerList[x].id,
						cls: 'playerList',
						handler: function(ev){
							parent.location.href = Utils.replacePlayerIDinUrl(parent.location.href, ev.value);
						}
					})
				);
			}
		}
	};
}();
