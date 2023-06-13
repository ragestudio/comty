async function composeSettingsByGroups() {
    console.time("load settings")

    /* @vite-ignore */
    let _settings = import.meta.glob("/constants/settings/*/index.jsx")

    _settings = Object.entries(_settings).map(([route, moduleFile]) => {
        const path = route.split("/").slice(-2)
        const name = path[0]

        if (name === "components" || name === "index") {
            return null
        }

        return moduleFile
    })

    _settings = _settings.filter((moduleFile) => moduleFile)

    _settings = await Promise.all(_settings.map((moduleFile) => moduleFile()))

    _settings = _settings.map((moduleFile) => {
        return moduleFile.default || moduleFile
    })

    _settings = _settings.sort((a, b) => {
        if (a.group === "bottom") {
            return 1
        }

        if (b.group === "bottom") {
            return -1
        }

        return 0
    })

    _settings = _settings.reduce((acc, settingModule) => {
        if (typeof acc[settingModule.group] !== "object") {
            acc[settingModule.group] = []
        }

        acc[settingModule.group].push(settingModule)

        return acc
    }, {})

    _settings = Object.entries(_settings).map(([group, groupModule]) => {
        // filter setting by platform
        groupModule = groupModule.map((subGroup) => {
            if (Array.isArray(subGroup.settings)) {
                subGroup.settings = subGroup.settings.filter((setting) => {
                    if (!app.isMobile && setting.desktop === false) {
                        return false
                    }

                    if (app.isMobile && setting.mobile === false) {
                        return false
                    }

                    return true
                })
            }

            return subGroup
        })

        return {
            group,
            groupModule: groupModule
        }
    })

    // order groups
    _settings = _settings.map((group) => {
        group.groupModule = group.groupModule.sort((a, b) => {
            if (typeof a.order === undefined) {
                // find index
                a.order = group.groupModule.indexOf(a)
            }

            if (typeof b.order === undefined) {
                // find index
                b.order = group.groupModule.indexOf(b)
            }

            return a.order - b.order
        })

        return group
    })

    console.timeEnd("load settings")

    return _settings
}

function composeTabsFromGroups(settingsGroups) {
    return settingsGroups.reduce((acc, entry) => {
        entry.groupModule.forEach((item) => {
            if (item.id) {
                acc[item.id] = item
            }
        })

        return acc
    }, {})
}

function composeGroupsFromSettingsTab(settings) {
    if (!Array.isArray(settings)) {
        console.error("settings is not an array")
        return []
    }

    return settings.reduce((acc, setting) => {
        if (setting.group) {
            if (typeof acc[setting.group] === "undefined") {
                acc[setting.group] = []
            }

            acc[setting.group].push(setting)
        }

        return acc
    }, {})
}

const composedSettingsByGroups = await composeSettingsByGroups()
const composedTabs = composeTabsFromGroups(composedSettingsByGroups)

export {
    composedSettingsByGroups,
    composedTabs,

    composeSettingsByGroups,
    composeTabsFromGroups,
    composeGroupsFromSettingsTab,
}