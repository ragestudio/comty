import { Icons } from "@components/Icons"

import InfoField from "./InfoField"

type ElectronVersions = NonNullable<Window["__ELECTRON__"]>["versions"]

export interface AppVersionsProps {
	versions: ElectronVersions
}

export function AppVersions({ versions }: AppVersionsProps) {
	return (
		<>
			<InfoField
				icon={<Icons.Wrench />}
				label="Version"
				value={versions.app}
			/>

			<InfoField
				icon={<Icons.Wrench />}
				label="Build"
				value={versions.build}
			/>

			<InfoField
				icon={<Icons.Wrench />}
				label="Electron"
				value={versions.electron}
			/>

			<InfoField
				icon={<Icons.Wrench />}
				label="SysAudio"
				value={versions.sysaudio}
			/>
		</>
	)
}

export default AppVersions
