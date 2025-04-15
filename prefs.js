import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.gnome-phone-auto-hotspot';


export default class ExamplePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const fields = [
            { key: 'phone-bt-mac', label: 'Phone Bluetooth MAC' },
            { key: 'hotspot-ssid', label: 'Hotspot SSID' },
            { key: 'hotspot-password', label: 'Hotspot Password' },
        ];

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: _('Settings'),
            description: _('Configure extension settings'),
        });
        page.add(group);

        let rows = {}
        rows['phone-bt-mac'] = new Adw.EntryRow({
            title: _('Phone BT MAC'),
        });
        group.add(rows['phone-bt-mac']);

        rows['hotspot-ssid'] = new Adw.EntryRow({
            title: _('Hotspot SSID'),
        });
        group.add(rows['hotspot-ssid']);

        rows['hotspot-password'] = new Adw.PasswordEntryRow({
            title: _('Hotspot password'),
        });
        group.add(rows['hotspot-password']);

        rows['hotspot-hidden']  = new Adw.SwitchRow({
            title: _('Hotspot hidden'),
        });
        group.add(rows['hotspot-hidden']);


        window._settings = this.getSettings();
        window._settings.bind('phone-bt-mac', rows['phone-bt-mac'], 'text', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('hotspot-ssid', rows['hotspot-ssid'], 'text', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('hotspot-password', rows['hotspot-password'], 'text', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('hotspot-hidden', rows['hotspot-hidden'], 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}
