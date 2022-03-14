import Evite from "evite"

import { Haptics, ImpactStyle } from "@capacitor/haptics"

// This is a temporal workaround to make the extension work with the new evite extension system.
export default class HapticExtensionV2 extends Evite.Extension {
    static id = "hapticsEngine"

    static compatible = ["mobile"]

    static extendsWith = ["SettingsController"]

    statement = {
        test: "macarronie",
    }

    initialization = [
        async (app, main) => {
            console.log(this.statement.test)
        }
    ]

    debug = {
        testVibrate: () => {

        },
        testSelectionStart: () => {

        },
        testSelectionChanged: () => {

        },
        testSelectionEnd: () => {

        },
    }

    public = {
        vibrate: async function () {
            const enabled = this.extended.SettingsController.get("haptic_feedback")

            if (enabled) {
                await Haptics.vibrate()
            }
        },
        selectionStart: async function () {
            const enabled = this.extended.SettingsController.get("haptic_feedback")

            if (enabled) {
                await Haptics.selectionStart()
            }
        },
        selectionChanged: async function () {
            const enabled = this.extended.SettingsController.get("haptic_feedback")

            if (enabled) {
                await Haptics.selectionChanged()
            }
        },
        selectionEnd: async function () {
            const enabled = this.extended.SettingsController.get("haptic_feedback")

            if (enabled) {
                await Haptics.selectionEnd()
            }
        },
    }
}