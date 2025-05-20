import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.gnome-phone-auto-hotspot';

const ComboButton = GObject.registerClass(
class ComboButton extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('Hotspot Connector'));

        this.onicon = new St.Icon({
            icon_name: 'network-wireless-signal-excellent-symbolic',
            style_class: 'system-status-icon',
        })
        this.officon = new St.Icon({
            icon_name: 'network-wireless-signal-disabled-symbolic',
            style_class: 'system-status-icon',
        })

        this.icon = this.officon;
        this.add_child(this.icon);

        this.connectItem = new PopupMenu.PopupMenuItem(_('Connect'));
        this.disconnectItem = new PopupMenu.PopupMenuItem(_('Disconnect'));

        const connect_fun = async () => {
            try{
                await this._connect();
            } catch (e) {
                console.error('Connect failed:', e);
            }
            this.connected = true;
            this._updateIcon();
        }

        const disconnect_fun = async () => {
            try{
                await this._disconnect();
            } catch (e) {
                console.error('Disconnect failed:', e);
            }
            this.connected = false;
            this._updateIcon();
        }

        this.connectItem.connect('activate', connect_fun);
        this.disconnectItem.connect('activate', disconnect_fun);
        this.menu.addMenuItem(this.connectItem);
        this.menu.addMenuItem(this.disconnectItem);
    }

    _updateIcon() {
        this.remove_child(this.icon);
        this.icon = this.connected ? this.onicon : this.officon;
        this.add_child(this.icon);
    }

    _runCommandAsync(command) {
        const proc = new Gio.Subprocess({
            argv: ['sh', '-c', command],
            flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });
        log(command);
        proc.init(null);

        return new Promise((resolve, reject) => {
            proc.communicate_utf8_async(null, null, (proc_, res) => {
                try {
                    const [, stdout, stderr] = proc_.communicate_utf8_finish(res);
                    const status = proc_.get_exit_status();
                    log(stdout);
                    resolve([status, stdout.trim()]);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async _runUntilSucceeds(command, delayMs = 500, max_retries = 5, success_status_code = 0){
        let [res, out] = await this._runCommandAsync(command);
        let retries = 0;
        while (res != success_status_code && retries < max_retries) {
            retries += 1;
            await this._sleep(delayMs);
            [res, out] = await this._runCommandAsync(command);
        }
    }

    async _shortPopup(message, durationMs = 500) {
        const notification = Main.notify(' ', message);
        await this._sleep(500);
        notification.destroy();
    }

    async _disconnect() {
        this._runUntilSucceeds(`bluetoothctl disconnect ${this.BT_MAC}`);
        this._runUntilSucceeds(`nmcli con down id ${this.SSID}`);
        this._shortPopup('Disconnected');
    }

    async _connect() {
        // get bt state
        let [res, out] = await this._runCommandAsync('bluetoothctl show');
        const wasPoweredOn = out.includes('Powered: yes');
        log(`Initial BT state: ${wasPoweredOn ? 'on' : 'off'}`);

        // turn bt on
        if (!wasPoweredOn) {
            await this._runUntilSucceeds('rfkill unblock bluetooth && sleep 0.5 && bluetoothctl power on');
        }

        // connect to bt
        await this._runUntilSucceeds(`bluetoothctl disconnect ${this.BT_MAC}`);
        await this._runUntilSucceeds(`bluetoothctl connect ${this.BT_MAC}`);

        // connect to wifi
        await this._runUntilSucceeds('nmcli radio wifi on');
        const connect_command = `nmcli dev wifi connect '${this.SSID}' password '${this.PASSWORD}'`;
        const cmd = this.HIDDEN ? connect_command + ` hidden yes` : connect_command;
        await this._runUntilSucceeds(cmd,1000)
        this._shortPopup('Connected');
    }
});

export default class ComboConnectorExtension extends Extension {
    enable() {
        this._indicator = new ComboButton();
        this._settings = this.getSettings();
        this._indicator.BT_MAC = this._settings.get_string('phone-bt-mac');
        this._indicator.SSID = this._settings.get_string('hotspot-ssid');
        this._indicator.PASSWORD = this._settings.get_string('hotspot-password');
        this._indicator.HIDDEN = this._settings.get_boolean('hotspot-hidden');

        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
