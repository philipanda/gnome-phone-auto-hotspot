The extension allows to start and connect to a smartphone hotspot remotely, without touching the smartphone, in one click.

## Prerequesites:
The smartphone needs to have an application like [Automate](https://play.google.com/store/apps/details?id=com.llamalab.automat) installed
and configured to start the hotspot once a specific device connects via bluetooth.

## Configuration
A couple of settings have to be set using gsettings to make the extension work:
- the MAC address of the bluetooth interface of the phone to which it should connect to
- the SSID of the smartphone's hotspot
- the password to the hotspot
- whether the hotspot is hidden or not

## Usage
Once installed and configured a system tray icon will appear.
Pressing it shows a dropdown menu with two options: "Connect" and "Disconnect".
