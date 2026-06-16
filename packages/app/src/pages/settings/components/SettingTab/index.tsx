import React, { useState, useEffect, useCallback } from "react";
import * as antd from "antd";
import { Translation } from "react-i18next";
import { Icons } from "@components/Icons";

import { composedTabs, composeGroupsFromSettingsTab } from "@/settings";
import groupsDecorators from "@config/settingsGroupsDecorators";
import SettingItemComponent from "../SettingItemComponent";
import { SettingTabModule, Setting } from "../../types";

interface SettingTabProps {
	activeKey: string;
	baseConfig?: any;
	onUpdate?: (key: string, value: any) => void;
	withGroups?: boolean;
}

const SettingTab: React.FC<SettingTabProps> = ({ activeKey, baseConfig, onUpdate, withGroups }) => {
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState<SettingTabModule | null>(null);
	const [ctx, setCtx] = useState<any>({});

	const loadTab = useCallback(async () => {
		setLoading(true);

		const currentTab = (composedTabs as any)[activeKey] as SettingTabModule;

		if (!currentTab) {
			setLoading(false);
			return;
		}

		let tabCtx = {};

		if (typeof currentTab.ctxData === "function") {
			tabCtx = await currentTab.ctxData();
		}

		if (typeof currentTab.onLoad === "function") {
			await currentTab.onLoad(tabCtx);
		}

		setTab(currentTab);
		setCtx({
			baseConfig,
			...tabCtx,
		});
		setLoading(false);
	}, [activeKey, baseConfig]);

	useEffect(() => {
		loadTab();
	}, [loadTab]);

	const handleSettingUpdate = useCallback(
		async (key: string, value: any) => {
			if (onUpdate) {
				await onUpdate(key, value);
			}
		},
		[onUpdate],
	);

	if (loading) {
		return <antd.Skeleton active />;
	}

	if (!tab) {
		return null;
	}

	if (tab.render) {
		return React.createElement(tab.render, {
			ctx: ctx,
		});
	}

	if (withGroups) {
		const groups = composeGroupsFromSettingsTab(tab.settings);

		return (
			<>
				{Object.entries(groups).map(([groupKey, settings], index) => {
					const decorator = (groupsDecorators as any)[groupKey];
					const fromDecoratorIcon = decorator?.icon;
					const fromDecoratorTitle = decorator?.title;

					return (
						<div
							id={groupKey}
							key={index}
							className="settings_content_group"
						>
							<div className="settings_content_group_header">
								<h1>
									{fromDecoratorIcon ? React.createElement((Icons as any)[fromDecoratorIcon]) : null}
									<Translation>{(t) => t(fromDecoratorTitle ?? groupKey)}</Translation>
								</h1>
							</div>

							<div className="settings_list">
								{(settings as Setting[]).map((setting, idx) => (
									<SettingItemComponent
										key={idx}
										setting={setting}
										ctx={ctx}
										onUpdate={(value) => handleSettingUpdate(setting.id, value)}
									/>
								))}
							</div>
						</div>
					);
				})}

				{tab.footer && React.createElement(tab.footer, { ctx })}
			</>
		);
	}

	return (
		<>
			{tab.settings.map((setting, index) => (
				<SettingItemComponent
					key={index}
					setting={setting}
					ctx={{
						...ctx,
						baseConfig,
					}}
					onUpdate={(value) => handleSettingUpdate(setting.id, value)}
				/>
			))}

			{tab.footer && React.createElement(tab.footer, { ctx })}
		</>
	);
};

export default React.memo(SettingTab);
