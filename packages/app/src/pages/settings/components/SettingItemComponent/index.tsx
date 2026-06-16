import React from "react";
import * as antd from "antd";
import Button from "@ui/Button";
import classnames from "classnames";
import { Translation } from "react-i18next";

import { Icons, createIconRender } from "@components/Icons";
import SettingsComponents from "./components";
import { useSetting } from "../../hooks/useSetting";
import { Setting, SettingAction } from "../../types";

import "./index.less";

declare const app: any;

function shouldUseHorizontalLayout(type: string) {
	switch (type) {
		case "switch":
			return true;
		case "button":
			return true;
		default:
			return false;
	}
}

interface ExtraActionsProps {
	setting: Setting;
	ctx: any;
	actions?: (SettingAction | React.ComponentType<any> | React.ReactNode)[];
}

const SettingItemExtraActions: React.FC<ExtraActionsProps> = ({ setting, ctx, actions }) => {
	if (!actions) {
		return null;
	}

	return (
		<>
			{actions.map((action: any, index: number) => {
				if (typeof action === "function") {
					return React.createElement(action, {
						key: index,
						ctx: ctx,
						setting: setting,
					});
				}

				if (React.isValidElement(action)) {
					return React.cloneElement(action as React.ReactElement, { key: index });
				}

				const handleOnClick = () => {
					if (action.onClick) {
						action.onClick(ctx);
					}
				};

				return (
					<Button
						key={action.id || index}
						id={action.id}
						onClick={handleOnClick}
						icon={action.icon && createIconRender(action.icon)}
						type={action.type ?? "default"}
						disabled={setting.disabled}
					>
						{action.title}
					</Button>
				);
			})}
		</>
	);
};

interface SettingItemComponentProps {
	setting: Setting;
	ctx: any;
	onUpdate?: (value: any) => void;
}

const SettingItemComponent: React.FC<SettingItemComponentProps> = ({ setting, ctx, onUpdate }) => {
	const { value, debouncedValue, loading, disabled, componentProps, itemCtx, componentRef, dispatchUpdate } = useSetting(
		setting,
		ctx,
		onUpdate,
	);

	if (!setting) {
		console.error(`Item has no an setting!`);
		return null;
	}

	if (!setting.component) {
		console.error(`Item [${setting.id}] has no an setting component!`);
		return null;
	}

	const componentType = typeof setting.component === "string" ? setting.component.toLowerCase() : "";

	const generateInhertedProps = () => {
		if (!SettingsComponents[componentType]) {
			return {};
		}

		if (typeof SettingsComponents[componentType].props === "function") {
			return SettingsComponents[componentType].props!(itemCtx);
		}

		return {};
	};

	const finalProps = {
		...componentProps,
		...generateInhertedProps(),
		...setting.props,
		ctx: itemCtx,
		ref: componentRef,
		checked: value,
		value: value,
		disabled: disabled || setting.disabled,
		size: app.isMobile ? "large" : "default",
	};

	if (setting.children) {
		finalProps.children = setting.children;
	}

	const Component =
		typeof setting.component === "string"
			? SettingsComponents[componentType]?.component ?? setting.component
			: setting.component;

	const computeSwitchEnablerDefault = () => {
		if (typeof setting.switchDefault === "function") {
			return setting.switchDefault();
		}
		return setting.switchDefault;
	};

	return (
		<div
			key={setting.id}
			id={setting.id}
			className={classnames("setting_item", {
				["usePadding"]: setting.usePadding ?? true,
				["useHorizontal"]: setting.layout ?? shouldUseHorizontalLayout(componentType),
			})}
		>
			<div className="setting_item_header">
				<div className="setting_item_info">
					<div className="setting_item_header_title">
						<h1>
							{createIconRender(setting.icon)}
							<Translation>{(t) => t(setting.title ?? setting.id)}</Translation>
						</h1>

						{setting.experimental && <antd.Tag>Experimental</antd.Tag>}
					</div>
					{setting.description && (
						<div className="setting_item_header_description">
							<p>
								<Translation>{(t) => t(setting.description!)}</Translation>
							</p>
						</div>
					)}
				</div>

				<div className="setting_item_header_actions">
					<SettingItemExtraActions
						setting={setting}
						actions={setting.extraActions}
						ctx={itemCtx}
					/>

					{typeof setting.onEnabledChange === "function" && (
						<antd.Switch
							defaultChecked={computeSwitchEnablerDefault()}
							onChange={setting.onEnabledChange}
						/>
					)}
				</div>
			</div>

			<div className="setting_item_content">
				<>
					{!loading && React.createElement(Component, finalProps)}
					{loading && <antd.Spin />}
					{debouncedValue && (
						<Button
							type="round"
							icon={<Icons.Check />}
							onClick={async () => await dispatchUpdate(debouncedValue)}
						>
							Save
						</Button>
					)}
				</>
			</div>
		</div>
	);
};

export default React.memo(SettingItemComponent);
