import React from "react";
import * as antd from "antd";
import { Translation } from "react-i18next";

import DonativeSelector from "@components/DonativeSelector";
import PageTransition from "@components/PageTransition";
import { createIconRender } from "@components/Icons";

import useUrlQueryActiveKey from "@hooks/useUrlQueryActiveKey";
import useUserRemoteConfig from "@hooks/useUserRemoteConfig";

import { composedSettingsByGroups as settings } from "@/settings";

import menuGroupsDecorators from "@config/settingsMenuGroupsDecorators";

import SettingTab from "./components/SettingTab";
import { SettingsGroup } from "./types";

import "./index.less";

declare const app: any;

const extraMenuItems = [
	{
		key: "donate",
		label: (
			<div
				className="flex-row gap-10"
				style={{
					color: "#f72585",
				}}
			>
				{createIconRender("HandCoins")}
				<span>Support us</span>
			</div>
		),
	},
	{
		key: "logout",
		label: (
			<div className="flex-row gap-10">
				{createIconRender("Logout")}
				<span>Logout</span>
			</div>
		),
		danger: true,
	},
];

const menuEvents: Record<string, () => void> = {
	donate: () => {
		app.layout.modal.open("donate", DonativeSelector);
	},
	logout: () => {
		app.auth.logout();
	},
};

const generateMenuItems = () => {
	const items = (settings as SettingsGroup[]).map((entry, index) => {
		const children: any[] = entry.groupModule.map((item) => {
			return {
				key: item.id,
				type: "item",
				label: (
					<div className="menu-item-content">
						{createIconRender(item.icon ?? "Settings")}
						{item.label}
					</div>
				),
				danger: (item as any).danger,
				disabled: (item as any).disabled,
			};
		});

		if (index !== settings.length - 1) {
			children.push({
				type: "divider",
			});
		}

		return {
			key: entry.group,
			type: "group",
			children: children,
			label:
				entry.group === "bottom" ? null : (
					<>
						{(menuGroupsDecorators as any)[entry.group]?.icon &&
							createIconRender((menuGroupsDecorators as any)[entry.group]?.icon ?? "Settings")}
						<Translation>
							{(t) => t((menuGroupsDecorators as any)[entry.group]?.label ?? entry.group)}
						</Translation>
					</>
				),
		};
	});

	const keys = Object.keys(menuGroupsDecorators);

	// sort by keys
	items.sort((a, b) => {
		const aIndex = keys.indexOf(a.key);
		const bIndex = keys.indexOf(b.key);

		return aIndex - bIndex;
	});

	return items;
};

const SettingsPage = () => {
	const [config, setConfig, loading] = useUserRemoteConfig() as [any, (config: any) => void, boolean];
	const [activeKey, setActiveKey] = useUrlQueryActiveKey({
		defaultKey: "general",
		queryKey: "tab",
	}) as [string, (key: string) => void];

	const onChangeTab = (event: any) => {
		if (typeof menuEvents[event.key] === "function") {
			return menuEvents[event.key]();
		}

		app.cores.sfx.play("settings.navigation");

		setActiveKey(event.key);
	};

	const menuItems = React.useMemo(() => {
		const items = generateMenuItems();

		extraMenuItems.forEach((item) => {
			(items[settings.length - 1].children as any[]).push(item);
		});

		return items;
	}, []);

	function handleOnUpdate(key: string, value: any) {
		setConfig({
			...config,
			[key]: value,
		});
	}

	React.useEffect(() => {
		if (app.layout.tools_bar) {
			app.layout.tools_bar.toggleVisibility(false);
		}
	}, [activeKey]);

	React.useEffect(() => {
		return () => {
			if (app.layout.tools_bar) {
				app.layout.tools_bar.toggleVisibility(true);
			}
		};
	}, []);

	return (
		<div className="settings_wrapper">
			<div className="settings_menu">
				<antd.Menu
					mode="vertical"
					items={menuItems}
					onClick={onChangeTab}
					selectedKeys={[activeKey]}
				/>
			</div>

			{loading && <antd.Skeleton active />}

			<PageTransition
				className="settings_content"
				key={activeKey}
			>
				{!loading && (
					<SettingTab
						baseConfig={config}
						onUpdate={handleOnUpdate}
						activeKey={activeKey}
						withGroups
					/>
				)}
			</PageTransition>
		</div>
	);
};

(SettingsPage as any).options = {
	layout: {
		maxHeight: true,
	},
};

export default SettingsPage;
