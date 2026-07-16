import React from "react";
import * as antd from "antd";
import { Translation } from "react-i18next";

import { Icons, createIconRender } from "@components/Icons";

import useUrlQueryActiveKey from "@hooks/useUrlQueryActiveKey";
import UseTopBar from "@hooks/useTopBar";

import { composedSettingsByGroups as settingsGroups, composedTabs } from "@/settings";

import menuGroupsDecorators from "@config/settingsMenuGroupsDecorators";

import SettingTab from "./components/SettingTab";
import { SettingsGroup, SettingTabModule } from "./types";

import "./index.mobile.less";

declare const app: any;

interface SettingsHeaderProps {
	activeKey: string | null;
	back?: () => void;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ activeKey, back = () => {} }) => {
	const currentTab = activeKey ? ((composedTabs as any)[activeKey] as SettingTabModule) : null;

	return (
		<UseTopBar
			options={{
				className: "settings_nav",
			}}
		>
			{activeKey && (
				<antd.Button
					icon={<Icons.ChevronLeft />}
					onClick={back}
					size="large"
					type="ghost"
				/>
			)}

			<h1>
				{createIconRender(currentTab?.icon ?? "Settings")}
				<Translation>{(t) => t(currentTab?.label ?? activeKey ?? "Settings")}</Translation>
			</h1>
		</UseTopBar>
	);
};

const SettingsMobilePage = () => {
	let lastKey: string | null = null;

	const [activeKey, setActiveKey] = useUrlQueryActiveKey({
		queryKey: "tab",
		defaultKey: null,
	}) as [string | null, (key: string | null) => void];

	const changeTab = (key: string | null) => {
		lastKey = key;
		setActiveKey(key);

		// scroll to top
		app.layout.scrollTo({
			top: 0,
		});
	};

	const handleTabChange = (key: string | null) => {
		// star page transition using new chrome transition api
		if ((document as any).startViewTransition) {
			return (document as any).startViewTransition(() => {
				changeTab(key);
			});
		}

		return changeTab(key);
	};

	const goBack = () => {
		handleTabChange(lastKey);
	};

	return (
		<div className="__mobile__settings">
			<SettingsHeader
				activeKey={activeKey}
				back={goBack}
			/>

			<div className="settings_list">
				{!activeKey &&
					(settingsGroups as SettingsGroup[]).map((entry, index) => {
						const groupDecorator = (menuGroupsDecorators as any)[entry.group];

						return (
							<div
								className="settings_list_group"
								key={index}
							>
								<span>
									<Translation>{(t) => t(groupDecorator?.label ?? entry.group)}</Translation>
								</span>

								<div className="settings_list_group_items">
									{entry.groupModule.map((settingsModule) => {
										return (
											<antd.Button
												size="large"
												key={settingsModule.id}
												id={settingsModule.id}
												icon={createIconRender(settingsModule.icon)}
												onClick={() => {
													handleTabChange(settingsModule.id);
												}}
											>
												<Translation>{(t) => t(settingsModule.label)}</Translation>
											</antd.Button>
										);
									})}
								</div>
							</div>
						);
					})}

				{activeKey && (
					<div className="settings_list_render">
						<SettingTab activeKey={activeKey} />
					</div>
				)}
			</div>
		</div>
	);
};

export default SettingsMobilePage;
